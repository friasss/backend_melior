import { z } from "zod";

export const createTransactionSchema = z.object({
  propertyId: z.string().cuid(),
  clientId: z.string().cuid(),
  type: z.enum(["SALE", "RENT", "COMMISSION", "DEPOSIT", "REFUND"]),
  amount: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  description: z.string().max(500).optional(),
});

export const createPaymentSchema = z.object({
  transactionId: z.string().cuid(),
  amount: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "CHECK", "FINANCING"]),
  reference: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REFUNDED"]),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;
