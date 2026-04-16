import { z } from "zod";

export const createAppointmentSchema = z.object({
  propertyId: z.string().cuid(),
  clientId: z.string().cuid(),
  scheduledAt: z.coerce.date().refine((d) => d > new Date(), "La fecha debe ser futura"),
  endAt: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateAppointmentSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
