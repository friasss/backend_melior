import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { authService } from "../services/auth.service";
import { uploadService } from "../services/upload.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json({
    success: true,
    message: "Cuenta creada exitosamente",
    data: result,
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.json({
    success: true,
    message: "Sesión iniciada",
    data: result,
  });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: "Refresh token requerido" });
    return;
  }
  const tokens = await authService.refreshAccessToken(refreshToken);
  res.json({
    success: true,
    message: "Token renovado",
    data: tokens,
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await authService.logout(refreshToken);
  }
  res.json({ success: true, message: "Sesión cerrada" });
});

export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  await authService.logoutAll(req.userId!);
  res.json({ success: true, message: "Todas las sesiones cerradas" });
});

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getProfile(req.userId!);
  res.json({ success: true, data: user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.updateProfile(req.userId!, req.body);
  res.json({ success: true, message: "Perfil actualizado", data: user });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  await authService.changePassword(req.userId!, req.body);
  res.json({ success: true, message: "Contraseña actualizada" });
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ success: false, message: "Imagen requerida" });
    return;
  }
  const uploaded = await uploadService.uploadBuffer(req.file.buffer, "melior/avatars");
  const user = await authService.updateAvatar(req.userId!, uploaded.url);
  res.json({ success: true, message: "Avatar actualizado", data: user });
});
