import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { reviewService } from "../services/review.service";

export const getPropertyReviews = asyncHandler(async (req: Request, res: Response) => {
  const reviews = await reviewService.getByProperty(req.params.propertyId);
  res.json({ success: true, data: reviews });
});

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.create(req.userId!, req.body);
  res.status(201).json({ success: true, message: "Reseña creada", data: review });
});

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const review = await reviewService.update(req.params.id, req.userId!, req.body);
  res.json({ success: true, message: "Reseña actualizada", data: review });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  await reviewService.delete(req.params.id, req.userId!, req.userRole!);
  res.json({ success: true, message: "Reseña eliminada" });
});
