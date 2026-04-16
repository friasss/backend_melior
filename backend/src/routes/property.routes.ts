import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { upload } from "../middlewares/upload.middleware";
import { createPropertySchema, updatePropertySchema, propertyQuerySchema } from "../schemas/property.schema";
import * as ctrl from "../controllers/property.controller";

const router = Router();

// Public
router.get("/", validate(propertyQuerySchema, "query"), ctrl.getProperties);
router.get("/featured", ctrl.getFeaturedProperties);
router.get("/stats", ctrl.getPropertyStats);
router.get("/slug/:slug", ctrl.getPropertyBySlug);
router.get("/:id", ctrl.getPropertyById);
router.get("/:id/similar", ctrl.getSimilarProperties);

// Protected – Agent / Admin
router.post(
  "/",
  authenticate,
  authorize("AGENT", "ADMIN"),
  validate(createPropertySchema),
  ctrl.createProperty
);

router.patch(
  "/:id",
  authenticate,
  authorize("AGENT", "ADMIN"),
  validate(updatePropertySchema),
  ctrl.updateProperty
);

router.delete(
  "/:id",
  authenticate,
  authorize("AGENT", "ADMIN"),
  ctrl.deleteProperty
);

// Images
router.post(
  "/:id/images",
  authenticate,
  authorize("AGENT", "ADMIN"),
  upload.array("images", 10),
  ctrl.uploadPropertyImages
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("AGENT", "ADMIN"),
  ctrl.deletePropertyImage
);

export default router;
