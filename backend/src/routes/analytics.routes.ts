import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import * as ctrl from "../controllers/analytics.controller";

const router = Router();

// Public — any visitor records their visit (no auth needed, lightweight)
router.post("/view", ctrl.recordPageView);

// Admin only — view traffic stats
router.get("/traffic", authenticate, authorize("ADMIN"), ctrl.getTrafficStats);

export default router;
