import { Router } from "express";
import authRoutes from "./auth.routes";
import propertyRoutes from "./property.routes";
import clientRoutes from "./client.routes";
import favoriteRoutes from "./favorite.routes";
import appointmentRoutes from "./appointment.routes";
import messageRoutes from "./message.routes";
import notificationRoutes from "./notification.routes";
import inquiryRoutes from "./inquiry.routes";
import transactionRoutes from "./transaction.routes";
import reviewRoutes from "./review.routes";
import dashboardRoutes from "./dashboard.routes";
import analyticsRoutes from "./analytics.routes";
import siteRoutes from "./site.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/properties", propertyRoutes);
router.use("/clients", clientRoutes);
router.use("/favorites", favoriteRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/messages", messageRoutes);
router.use("/notifications", notificationRoutes);
router.use("/inquiries", inquiryRoutes);
router.use("/transactions", transactionRoutes);
router.use("/reviews", reviewRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/site", siteRoutes);

export default router;
