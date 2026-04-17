import { Router } from "express";
import passport from "passport";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { upload } from "../middlewares/upload.middleware";
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from "../schemas/auth.schema";
import * as ctrl from "../controllers/auth.controller";
import { env } from "../config/env";
import { authService } from "../services/auth.service";
import { z } from "zod";

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

// Complete profile after OAuth sign-up
const completeProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  role: z.enum(["CLIENT", "AGENT"]),
});

router.post("/complete-profile", authenticate, async (req, res, next) => {
  try {
    const data = completeProfileSchema.parse(req.body);
    const updated = await authService.completeProfile(req.userId!, data);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── Google OAuth ───
if (env.GOOGLE_CLIENT_ID) {
  router.get("/google", passport.authenticate("google", { session: false, scope: ["profile", "email"] }));

  router.get(
    "/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=google_failed` }),
    async (req, res, next) => {
      try {
        const user = req.user as { id: string };
        const result = await authService.loginOAuthUser(user.id);
        const params = new URLSearchParams({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          needs_profile: String((result.user as { needsProfileCompletion?: boolean }).needsProfileCompletion ?? false),
        });
        res.redirect(`${env.FRONTEND_URL}/oauth-callback?${params}`);
      } catch (err) {
        next(err);
      }
    }
  );
}

// ─── Facebook OAuth ───
if (env.FACEBOOK_APP_ID) {
  router.get("/facebook", passport.authenticate("facebook", { session: false, scope: ["email"] }));

  router.get(
    "/facebook/callback",
    passport.authenticate("facebook", { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=facebook_failed` }),
    async (req, res, next) => {
      try {
        const user = req.user as { id: string };
        const result = await authService.loginOAuthUser(user.id);
        const params = new URLSearchParams({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          needs_profile: String((result.user as { needsProfileCompletion?: boolean }).needsProfileCompletion ?? false),
        });
        res.redirect(`${env.FRONTEND_URL}/oauth-callback?${params}`);
      } catch (err) {
        next(err);
      }
    }
  );
}

export default router;
