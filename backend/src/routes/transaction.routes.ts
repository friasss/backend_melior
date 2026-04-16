import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createTransactionSchema, createPaymentSchema, updatePaymentSchema } from "../schemas/transaction.schema";
import * as ctrl from "../controllers/transaction.controller";

const router = Router();

router.use(authenticate, authorize("AGENT", "ADMIN"));

router.get("/", ctrl.getTransactions);
router.get("/:id", ctrl.getTransactionById);
router.post("/", validate(createTransactionSchema), ctrl.createTransaction);

// Payments
router.post("/payments", validate(createPaymentSchema), ctrl.addPayment);
router.patch("/payments/:id", validate(updatePaymentSchema), ctrl.updatePaymentStatus);

export default router;
