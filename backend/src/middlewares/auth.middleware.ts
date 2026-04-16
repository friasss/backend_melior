import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types";
import { ApiError } from "../utils/ApiError";
import { UserRole } from "@prisma/client";

/**
 * Verifies the access token from the Authorization header.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Token de acceso no proporcionado"));
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    next(ApiError.unauthorized("Token inválido o expirado"));
  }
};

/**
 * Optional authentication – sets user info if token is present but doesn't reject without one.
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (header?.startsWith("Bearer ")) {
    try {
      const token = header.split(" ")[1];
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      req.userId = payload.userId;
      req.userRole = payload.role;
    } catch {
      // Token invalid – just continue without auth
    }
  }

  next();
};

/**
 * Role-based authorization middleware.
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(ApiError.forbidden("No tienes permiso para realizar esta acción"));
    }
    next();
  };
};
