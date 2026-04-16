import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { sendMessageSchema } from "../schemas/message.schema";
import * as ctrl from "../controllers/message.controller";

const router = Router();

router.use(authenticate);

router.get("/", ctrl.getConversations);
router.get("/unread", ctrl.getUnreadCount);
router.get("/:partnerId", ctrl.getConversation);
router.post("/", validate(sendMessageSchema), ctrl.sendMessage);

export default router;
