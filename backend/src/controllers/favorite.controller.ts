import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { favoriteService } from "../services/favorite.service";

export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
  const favorites = await favoriteService.getUserFavorites(req.userId!);
  res.json({ success: true, data: favorites });
});

export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
  const result = await favoriteService.toggle(req.userId!, req.params.propertyId);
  res.json({
    success: true,
    message: result.isFavorite ? "Agregado a favoritos" : "Eliminado de favoritos",
    data: result,
  });
});

export const checkFavorite = asyncHandler(async (req: Request, res: Response) => {
  const result = await favoriteService.isFavorite(req.userId!, req.params.propertyId);
  res.json({ success: true, data: result });
});
