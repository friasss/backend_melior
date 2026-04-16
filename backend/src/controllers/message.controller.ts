import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { messageService } from "../services/message.service";

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await messageService.getConversations(req.userId!);
  res.json({ success: true, data: conversations });
});

export const getConversation = asyncHandler(async (req: Request, res: Response) => {
  const messages = await messageService.getConversation(req.userId!, req.params.partnerId);
  res.json({ success: true, data: messages });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const message = await messageService.send(req.userId!, req.body.receiverId, req.body.content);
  res.status(201).json({ success: true, data: message });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await messageService.getUnreadCount(req.userId!);
  res.json({ success: true, data: { count } });
});
