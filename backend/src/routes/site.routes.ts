import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import * as ctrl from "../controllers/site.controller";

const router = Router();

router.get("/founders", ctrl.getFounders);
router.patch("/founders/:id", authenticate, authorize("ADMIN"), ctrl.updateFounder);

export default router;
