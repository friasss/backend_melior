import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import * as ctrl from "../controllers/favorite.controller";

const router = Router();

router.use(authenticate);

router.get("/", ctrl.getFavorites);
router.post("/:propertyId", ctrl.toggleFavorite);
router.get("/:propertyId/check", ctrl.checkFavorite);

export default router;
