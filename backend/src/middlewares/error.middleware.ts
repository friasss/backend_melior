import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: Object.keys(err.errors).length > 0 ? err.errors : undefined,
    });
    return;
  }

  // Prisma unique constraint
  if ((err as any).code === "P2002") {
    res.status(409).json({
      success: false,
      message: "Ya existe un registro con esos datos",
    });
    return;
  }

  // Prisma not found
  if ((err as any).code === "P2025") {
    res.status(404).json({
      success: false,
      message: "Registro no encontrado",
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    success: false,
    message: "Error interno del servidor",
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
