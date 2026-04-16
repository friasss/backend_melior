import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().min(5, "Mínimo 5 caracteres").max(200),
  description: z.string().min(20, "Mínimo 20 caracteres").max(5000),
  price: z.coerce.number().positive("El precio debe ser positivo"),
  currency: z.string().default("USD"),
  status: z.enum(["SALE", "RENT"]),
  condition: z.enum(["NEW", "USED", "UNDER_CONSTRUCTION"]).optional().default("USED"),
  propertyType: z.string().min(1, "El tipo de propiedad es requerido"),
  beds: z.coerce.number().int().min(0).default(0),
  baths: z.coerce.number().int().min(0).default(0),
  size: z.coerce.number().positive("El tamaño debe ser positivo"),
  lotSize: z.coerce.number().positive().optional(),
  yearBuilt: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 5).optional(),
  parkingSpaces: z.coerce.number().int().min(0).default(0),
  isFeatured: z.coerce.boolean().default(false),

  // Address
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    city: z.string().min(1, "La ciudad es requerida"),
    state: z.string().optional(),
    neighborhood: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().default("DO"),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  }),

  // Features (amenities)
  features: z.array(z.object({
    name: z.string().min(1),
    category: z.string().default("general"),
  })).optional().default([]),
});

export const updatePropertySchema = createPropertySchema.partial().omit({ address: true }).extend({
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    city: z.string().min(1).optional(),
    state: z.string().optional(),
    neighborhood: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  }).optional(),
  listingStatus: z.enum(["ACTIVE", "INACTIVE", "SOLD", "RENTED", "PENDING"]).optional(),
});

export const propertyQuerySchema = z.object({
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
  status: z.enum(["SALE", "RENT"]).optional(),
  propertyType: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  beds: z.coerce.number().optional(),
  baths: z.coerce.number().optional(),
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  listingStatus: z.enum(["ACTIVE", "INACTIVE", "SOLD", "RENTED", "PENDING"]).optional(),
  agentId: z.string().optional(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyQuery = z.infer<typeof propertyQuerySchema>;
