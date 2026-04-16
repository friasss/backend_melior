import { z } from "zod";

export const sendMessageSchema = z.object({
  receiverId: z.string().cuid(),
  content: z.string().min(1, "El mensaje no puede estar vacío").max(5000),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
