import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { dashboardService } from "../services/dashboard.service";

export const getAdminDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await dashboardService.getAdminDashboard();
  res.json({ success: true, data });
});

export const getAgentDashboard = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getAgentDashboard(req.userId!);
  res.json({ success: true, data });
});
