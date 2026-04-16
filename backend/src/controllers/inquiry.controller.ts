import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { inquiryService } from "../services/inquiry.service";

export const getInquiries = asyncHandler(async (req: Request, res: Response) => {
  const result = await inquiryService.findAll(req.query as any);
  res.json({ success: true, ...result });
});

export const getInquiryById = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await inquiryService.findById(req.params.id);
  res.json({ success: true, data: inquiry });
});

export const getMyInquiries = asyncHandler(async (req: Request, res: Response) => {
  const user = await import("../config/database").then(({ prisma }) =>
    prisma.user.findUnique({ where: { id: req.userId! }, select: { email: true } })
  );
  if (!user) { res.status(404).json({ success: false, message: "Usuario no encontrado" }); return; }
  const data = await inquiryService.findByEmail(user.email);
  res.json({ success: true, data });
});

export const createInquiry = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await inquiryService.create(req.body);
  res.status(201).json({ success: true, message: "Consulta enviada", data: inquiry });
});

export const updateInquiryStatus = asyncHandler(async (req: Request, res: Response) => {
  const inquiry = await inquiryService.updateStatus(req.params.id, req.body);
  res.json({ success: true, message: "Estado actualizado", data: inquiry });
});

export const deleteInquiry = asyncHandler(async (req: Request, res: Response) => {
  await inquiryService.delete(req.params.id);
  res.json({ success: true, message: "Consulta eliminada" });
});
