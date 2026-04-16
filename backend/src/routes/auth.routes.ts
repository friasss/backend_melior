import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { upload } from "../middlewares/upload.middleware";
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "../schemas/auth.schema";
import * as ctrl from "../controllers/auth.controller";

const router = Router();

// Public
router.post("/register", validate(registerSchema), ctrl.register);
router.post("/login", validate(loginSchema), ctrl.login);
router.post("/refresh", ctrl.refreshToken);

// Protected
router.post("/logout", authenticate, ctrl.logout);
router.post("/logout-all", authenticate, ctrl.logoutAll);
router.get("/profile", authenticate, ctrl.getProfile);
router.patch("/profile", authenticate, validate(updateProfileSchema), ctrl.updateProfile);
router.patch("/password", authenticate, validate(changePasswordSchema), ctrl.changePassword);
router.patch("/avatar", authenticate, upload.single("avatar"), ctrl.uploadAvatar);

export default router;
