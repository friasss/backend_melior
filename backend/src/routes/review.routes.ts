import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { createReviewSchema, updateReviewSchema } from "../schemas/review.schema";
import * as ctrl from "../controllers/review.controller";

const router = Router();

// Public
router.get("/property/:propertyId", ctrl.getPropertyReviews);

// Protected
router.post("/", authenticate, validate(createReviewSchema), ctrl.createReview);
router.patch("/:id", authenticate, validate(updateReviewSchema), ctrl.updateReview);
router.delete("/:id", authenticate, ctrl.deleteReview);

export default router;
