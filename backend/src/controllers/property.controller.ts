import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { propertyService } from "../services/property.service";

export const getProperties = asyncHandler(async (req: Request, res: Response) => {
  const result = await propertyService.findAll(req.query as any);
  res.json({ success: true, ...result });
});

export const getPropertyById = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.findById(req.params.id);
  res.json({ success: true, data: property });
});

export const getPropertyBySlug = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.findBySlug(req.params.slug);
  res.json({ success: true, data: property });
});

export const createProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.create(req.userId!, req.body);
  res.status(201).json({ success: true, message: "Propiedad creada", data: property });
});

export const updateProperty = asyncHandler(async (req: Request, res: Response) => {
  const property = await propertyService.update(req.params.id, req.userId!, req.userRole!, req.body);
  res.json({ success: true, message: "Propiedad actualizada", data: property });
});

export const deleteProperty = asyncHandler(async (req: Request, res: Response) => {
  await propertyService.delete(req.params.id, req.userId!, req.userRole!);
  res.json({ success: true, message: "Propiedad eliminada" });
});

export const uploadPropertyImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({ success: false, message: "Al menos una imagen es requerida" });
    return;
  }
  const images = await propertyService.addImages(req.params.id, req.userId!, req.userRole!, files);
  res.status(201).json({ success: true, message: "Imágenes subidas", data: images });
});

export const deletePropertyImage = asyncHandler(async (req: Request, res: Response) => {
  await propertyService.deleteImage(req.params.imageId, req.userId!, req.userRole!);
  res.json({ success: true, message: "Imagen eliminada" });
});

export const getFeaturedProperties = asyncHandler(async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 6;
  const properties = await propertyService.getFeatured(limit);
  res.json({ success: true, data: properties });
});

export const getSimilarProperties = asyncHandler(async (req: Request, res: Response) => {
  const properties = await propertyService.getSimilar(req.params.id);
  res.json({ success: true, data: properties });
});

export const getPropertyStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await propertyService.getStats();
  res.json({ success: true, data: stats });
});
