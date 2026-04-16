import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";
import { parsePagination, paginate } from "../utils/helpers";
import { CreateClientInput, UpdateClientInput, ClientQuery } from "../schemas/client.schema";

const CLIENT_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  createdAt: true,
  clientProfile: {
    include: {
      interestedProperties: {
        include: {
          property: {
            select: { id: true, title: true, price: true, status: true, propertyType: true },
          },
        },
      },
    },
  },
};

export class ClientService {
  async findAll(query: ClientQuery) {
    const { page, limit, skip, sortOrder } = parsePagination(query);

    const where = {
      role: "CLIENT" as const,
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" as const } },
          { lastName: { contains: query.search, mode: "insensitive" as const } },
          { email: { contains: query.search, mode: "insensitive" as const } },
          { phone: { contains: query.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: CLIENT_SELECT,
        orderBy: { createdAt: sortOrder },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(clientId: string) {
    const client = await prisma.user.findFirst({
      where: { id: clientId, role: "CLIENT" },
      select: CLIENT_SELECT,
    });

    if (!client) throw ApiError.notFound("Cliente no encontrado");
    return client;
  }

  async create(input: CreateClientInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict("Ya existe un usuario con este correo");

    const passwordHash = await bcrypt.hash(
      input.password || "Melior2024!",
      env.BCRYPT_SALT_ROUNDS
    );

    const client = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: "CLIENT",
        clientProfile: {
          create: {
            preferredContact: input.preferredContact,
            budget: input.budget,
            notes: input.notes,
          },
        },
      },
      select: CLIENT_SELECT,
    });

    return client;
  }

  async update(clientId: string, input: UpdateClientInput) {
    const client = await prisma.user.findFirst({ where: { id: clientId, role: "CLIENT" } });
    if (!client) throw ApiError.notFound("Cliente no encontrado");

    const { preferredContact, budget, notes, isActive, ...userData } = input;

    const updated = await prisma.user.update({
      where: { id: clientId },
      data: {
        ...userData,
        ...(isActive !== undefined && { isActive }),
        clientProfile: {
          update: {
            ...(preferredContact !== undefined && { preferredContact }),
            ...(budget !== undefined && { budget }),
            ...(notes !== undefined && { notes }),
          },
        },
      },
      select: CLIENT_SELECT,
    });

    return updated;
  }

  async delete(clientId: string) {
    const client = await prisma.user.findFirst({ where: { id: clientId, role: "CLIENT" } });
    if (!client) throw ApiError.notFound("Cliente no encontrado");

    await prisma.user.delete({ where: { id: clientId } });
  }

  async addPropertyInterest(clientId: string, propertyId: string, notes?: string) {
    const profile = await prisma.clientProfile.findUnique({ where: { userId: clientId } });
    if (!profile) throw ApiError.notFound("Perfil de cliente no encontrado");

    return prisma.clientPropertyInterest.create({
      data: {
        clientId: profile.id,
        propertyId,
        notes,
      },
      include: {
        property: {
          select: { id: true, title: true, price: true, status: true },
        },
      },
    });
  }

  async removePropertyInterest(clientId: string, propertyId: string) {
    const profile = await prisma.clientProfile.findUnique({ where: { userId: clientId } });
    if (!profile) throw ApiError.notFound("Perfil de cliente no encontrado");

    await prisma.clientPropertyInterest.deleteMany({
      where: { clientId: profile.id, propertyId },
    });
  }
}

export const clientService = new ClientService();
