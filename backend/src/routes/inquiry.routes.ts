import { Router } from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createInquirySchema, updateInquirySchema } from "../schemas/inquiry.schema";
import * as ctrl from "../controllers/inquiry.controller";

const router = Router();

// Public – anyone can submit an inquiry
router.post("/", validate(createInquirySchema), ctrl.createInquiry);

// Protected – logged-in user sees their own inquiries (matched by email)
router.get("/mine", authenticate, ctrl.getMyInquiries);

// Protected – management
router.get("/", authenticate, authorize("AGENT", "ADMIN"), ctrl.getInquiries);
router.get("/:id", authenticate, authorize("AGENT", "ADMIN"), ctrl.getInquiryById);
router.patch("/:id", authenticate, authorize("AGENT", "ADMIN"), validate(updateInquirySchema), ctrl.updateInquiryStatus);
router.delete("/:id", authenticate, authorize("ADMIN"), ctrl.deleteInquiry);

export default router;
