import { Router } from "express";
import { authenticate, authorize, optionalAuth } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { upload } from "../middlewares/upload.middleware";
import { createPropertySchema, updatePropertySchema, propertyQuerySchema } from "../schemas/property.schema";
import * as ctrl from "../controllers/property.controller";

const router = Router();

// Agent – own properties
router.get("/mine", authenticate, authorize("AGENT", "ADMIN"), ctrl.getMyProperties);

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

// Images – by URL (no Cloudinary required)
router.post(
  "/:id/images/urls",
  authenticate,
  authorize("AGENT", "ADMIN"),
  ctrl.uploadPropertyImageUrls
);

// Replace all images in one shot (handles reorder + delete + recrop)
router.put(
  "/:id/images/urls",
  authenticate,
  authorize("AGENT", "ADMIN"),
  ctrl.replacePropertyImageUrls
);

// Images – file upload (requires Cloudinary)
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
