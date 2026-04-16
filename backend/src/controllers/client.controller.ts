import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { clientService } from "../services/client.service";

export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const result = await clientService.findAll(req.query as any);
  res.json({ success: true, ...result });
});

export const getClientById = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.findById(req.params.id);
  res.json({ success: true, data: client });
});

export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.create(req.body);
  res.status(201).json({ success: true, message: "Cliente creado", data: client });
});

export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientService.update(req.params.id, req.body);
  res.json({ success: true, message: "Cliente actualizado", data: client });
});

export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  await clientService.delete(req.params.id);
  res.json({ success: true, message: "Cliente eliminado" });
});

export const addPropertyInterest = asyncHandler(async (req: Request, res: Response) => {
  const result = await clientService.addPropertyInterest(
    req.params.id,
    req.body.propertyId,
    req.body.notes
  );
  res.status(201).json({ success: true, data: result });
});

export const removePropertyInterest = asyncHandler(async (req: Request, res: Response) => {
  await clientService.removePropertyInterest(req.params.id, req.params.propertyId);
  res.json({ success: true, message: "Interés eliminado" });
});
