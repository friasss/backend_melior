import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { siteService } from "../services/site.service";

export const getFounders = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: siteService.getFounders() });
});

export const updateFounder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, role, bio, photo } = req.body as {
    name?: string; role?: string; bio?: string; photo?: string | null;
  };
  const updated = siteService.updateFounder(id, { name, role, bio, photo });
  res.json({ success: true, data: updated });
});
