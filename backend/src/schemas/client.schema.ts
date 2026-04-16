import { z } from "zod";

export const createClientSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().optional(),
  preferredContact: z.string().optional(),
  budget: z.coerce.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .optional(),
});

export const updateClientSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
  preferredContact: z.string().optional(),
  budget: z.coerce.number().positive().optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export const clientQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQuery = z.infer<typeof clientQuerySchema>;
