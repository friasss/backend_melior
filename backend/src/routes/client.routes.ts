import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createClientSchema, updateClientSchema } from "../schemas/client.schema";
import * as ctrl from "../controllers/client.controller";

const router = Router();

// All client management requires AGENT or ADMIN
router.use(authenticate, authorize("AGENT", "ADMIN"));

router.get("/", ctrl.getClients);
router.get("/:id", ctrl.getClientById);
router.post("/", validate(createClientSchema), ctrl.createClient);
router.patch("/:id", validate(updateClientSchema), ctrl.updateClient);
router.delete("/:id", ctrl.deleteClient);

// Property interests
router.post("/:id/interests", ctrl.addPropertyInterest);
router.delete("/:id/interests/:propertyId", ctrl.removePropertyInterest);

export default router;
