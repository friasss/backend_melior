import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as ctrl from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

router.get("/", ctrl.getNotifications);
router.get("/unread", ctrl.getUnreadCount);
router.patch("/:id/read", ctrl.markAsRead);
router.patch("/read-all", ctrl.markAllAsRead);

export default router;
