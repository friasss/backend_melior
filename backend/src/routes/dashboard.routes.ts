import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import * as ctrl from "../controllers/dashboard.controller";

const router = Router();

router.use(authenticate);

router.get("/admin", authorize("ADMIN"), ctrl.getAdminDashboard);
router.get("/agent", authorize("AGENT"), ctrl.getAgentDashboard);

export default router;
