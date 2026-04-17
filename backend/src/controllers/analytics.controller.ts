import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { analyticsService } from "../services/analytics.service";

export const recordPageView = asyncHandler(async (req: Request, res: Response) => {
  const { path } = req.body as { path: string };
  if (!path) { res.status(400).json({ success: false }); return; }
  await analyticsService.recordView(path);
  res.json({ success: true });
});

export const getTrafficStats = asyncHandler(async (_req: Request, res: Response) => {
  const data = await analyticsService.getTrafficStats();
  res.json({ success: true, data });
});
