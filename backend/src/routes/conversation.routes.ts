import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import * as ctrl from "../controllers/conversation.controller";

const router = Router();

router.use(authenticate);

const startConversationSchema = z.object({
  propertyId: z.string().cuid(),
  initialMessage: z.string().min(1).max(5000),
});

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

router.get("/", ctrl.getConversations);
router.get("/unread-count", ctrl.getUnreadCount);
router.post("/", validate(startConversationSchema), ctrl.startConversation);
router.get("/:conversationId/messages", ctrl.getConversationMessages);
router.post("/:conversationId/messages", validate(sendMessageSchema), ctrl.sendMessage);
router.patch("/:conversationId/read", ctrl.markRead);

export default router;
