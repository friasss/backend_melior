import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/database";
import { JwtPayload } from "../types";
import { ApiError } from "../utils/ApiError";
import { RegisterInput, LoginInput, ChangePasswordInput } from "../schemas/auth.schema";
import { UserRole } from "@prisma/client";

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

function parseExpiry(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] || 86400000);
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw ApiError.conflict("Ya existe una cuenta con este correo electrónico");
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role as UserRole,
        ...(input.role === "AGENT" && {
          agent: {
            create: {
              company: "Melior Properties",
            },
          },
        }),
        ...(input.role === "CLIENT" && {
          clientProfile: {
            create: {},
          },
        }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const tokens = await this.createTokens({ userId: user.id, role: user.role });

    return { user, ...tokens };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
      throw ApiError.unauthorized("Credenciales inválidas");
    }

    if (!user.isActive) {
      throw ApiError.forbidden("Tu cuenta ha sido desactivada");
    }

    if (!user.passwordHash) {
      throw ApiError.unauthorized("Esta cuenta usa inicio de sesión social. Usa Google o Facebook.");
    }

    const isValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isValid) {
      throw ApiError.unauthorized("Credenciales inválidas");
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.createTokens({ userId: user.id, role: user.role });

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async refreshAccessToken(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw ApiError.unauthorized("Refresh token inválido");
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw ApiError.unauthorized("Refresh token expirado");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Usuario no encontrado o desactivado");
    }

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await this.createTokens({ userId: user.id, role: user.role });

    return tokens;
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("Usuario no encontrado");

    const isValid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isValid) throw ApiError.badRequest("La contraseña actual es incorrecta");

    const newHash = await bcrypt.hash(input.newPassword, env.BCRYPT_SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Invalidate all refresh tokens
    await this.logoutAll(userId);
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        agent: true,
        clientProfile: true,
      },
    });

    if (!user) throw ApiError.notFound("Usuario no encontrado");
    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
    return user;
  }

  async loginOAuthUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) throw ApiError.unauthorized("Cuenta inactiva");

    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });

    const tokens = await this.createTokens({ userId: user.id, role: user.role });
    const { passwordHash, ...safeUser } = user as typeof user & { passwordHash?: string | null };
    return { user: safeUser, ...tokens };
  }

  async completeProfile(
    userId: string,
    data: { firstName: string; lastName: string; phone?: string; role: "CLIENT" | "AGENT" }
  ) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { agent: true, clientProfile: true } });
    if (!user) throw ApiError.notFound("Usuario no encontrado");

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        needsProfileCompletion: false,
        ...(data.role === "AGENT" && !user.agent ? { agent: { create: { company: "Melior Properties" } } } : {}),
        ...(data.role === "CLIENT" && !user.clientProfile ? { clientProfile: { create: {} } } : {}),
      },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatarUrl: true, role: true, needsProfileCompletion: true },
    });

    return updated;
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        avatarUrl: true,
      },
    });
  }

  private async createTokens(payload: JwtPayload) {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = new Date(Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRES_IN));

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
