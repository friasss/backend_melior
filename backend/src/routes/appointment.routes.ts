import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createAppointmentSchema, updateAppointmentSchema } from "../schemas/appointment.schema";
import * as ctrl from "../controllers/appointment.controller";

const router = Router();

router.use(authenticate);

router.get("/", ctrl.getMyAppointments);
router.post("/", authorize("AGENT", "ADMIN"), validate(createAppointmentSchema), ctrl.createAppointment);
router.patch("/:id", validate(updateAppointmentSchema), ctrl.updateAppointment);
router.delete("/:id", ctrl.deleteAppointment);

export default router;
