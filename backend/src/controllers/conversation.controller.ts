import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { conversationService } from "../services/conversation.service";

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const data = await conversationService.getConversations(req.userId!);
  res.json({ success: true, data });
});

export const getConversationMessages = asyncHandler(async (req: Request, res: Response) => {
  const data = await conversationService.getConversationMessages(
    req.userId!,
    req.params.conversationId
  );
  res.json({ success: true, data });
});

export const startConversation = asyncHandler(async (req: Request, res: Response) => {
  const { propertyId, initialMessage } = req.body;
  const data = await conversationService.startConversation(req.userId!, propertyId, initialMessage);
  res.status(201).json({ success: true, data });
});

export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = await conversationService.sendMessage(
    req.userId!,
    req.params.conversationId,
    req.body.content
  );
  res.status(201).json({ success: true, data });
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  await conversationService.markRead(req.userId!, req.params.conversationId);
  res.json({ success: true });
});

export const getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await conversationService.getUnreadCount(req.userId!);
  res.json({ success: true, data: { count } });
});
