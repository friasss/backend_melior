import { z } from "zod";

export const createInquirySchema = z.object({
  propertyId: z.string().cuid().optional(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres").max(5000),
});

export const updateInquirySchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
