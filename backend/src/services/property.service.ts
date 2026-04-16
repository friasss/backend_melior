import { Prisma } from "@prisma/client";
import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { slugify, parsePagination, paginate } from "../utils/helpers";
import { CreatePropertyInput, UpdatePropertyInput, PropertyQuery } from "../schemas/property.schema";
import { uploadService } from "./upload.service";

const PROPERTY_INCLUDE = {
  address: true,
  images: { orderBy: { sortOrder: "asc" as const } },
  features: true,
  agent: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
  },
  _count: {
    select: { favorites: true, reviews: true },
  },
};

export class PropertyService {
  async findAll(query: PropertyQuery) {
    const { page, limit, skip, sortBy, sortOrder } = parsePagination(query);

    const where: Prisma.PropertyWhereInput = {
      ...(query.listingStatus ? { listingStatus: query.listingStatus } : { listingStatus: "ACTIVE" }),
      ...(query.status && { status: query.status }),
      ...(query.propertyType && { propertyType: query.propertyType }),
      ...(query.isFeatured !== undefined && { isFeatured: query.isFeatured }),
      ...(query.agentId && { agentId: query.agentId }),
      ...(query.beds && { beds: { gte: query.beds } }),
      ...(query.baths && { baths: { gte: query.baths } }),
      ...((query.minPrice || query.maxPrice) && {
        price: {
          ...(query.minPrice && { gte: query.minPrice }),
          ...(query.maxPrice && { lte: query.maxPrice }),
        },
      }),
      ...((query.city || query.neighborhood) && {
        address: {
          ...(query.city && { city: { contains: query.city, mode: "insensitive" as const } }),
          ...(query.neighborhood && { neighborhood: { contains: query.neighborhood, mode: "insensitive" as const } }),
        },
      }),
      ...(query.search && {
        OR: [
          { title: { contains: query.search, mode: "insensitive" as const } },
          { description: { contains: query.search, mode: "insensitive" as const } },
          { propertyType: { contains: query.search, mode: "insensitive" as const } },
          { address: { city: { contains: query.search, mode: "insensitive" as const } } },
          { address: { neighborhood: { contains: query.search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const orderBy: Prisma.PropertyOrderByWithRelationInput =
      sortBy === "price" ? { price: sortOrder } : { createdAt: sortOrder };

    const [data, total] = await prisma.$transaction([
      prisma.property.findMany({
        where,
        include: PROPERTY_INCLUDE,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.property.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        ...PROPERTY_INCLUDE,
        reviews: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!property) throw ApiError.notFound("Propiedad no encontrada");

    // Increment view count
    await prisma.property.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return property;
  }

  async findBySlug(slug: string) {
    const property = await prisma.property.findUnique({
      where: { slug },
      include: PROPERTY_INCLUDE,
    });

    if (!property) throw ApiError.notFound("Propiedad no encontrada");
    return property;
  }

  async create(agentId: string, input: CreatePropertyInput) {
    // Verify agent exists
    const agent = await prisma.agentProfile.findUnique({ where: { userId: agentId } });
    if (!agent) throw ApiError.forbidden("Solo los agentes pueden crear propiedades");

    let slug = slugify(input.title);
    // Ensure unique slug
    const existing = await prisma.property.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const property = await prisma.property.create({
      data: {
        title: input.title,
        slug,
        description: input.description,
        price: input.price,
        currency: input.currency,
        status: input.status,
        condition: input.condition,
        propertyType: input.propertyType,
        beds: input.beds,
        baths: input.baths,
        size: input.size,
        lotSize: input.lotSize,
        yearBuilt: input.yearBuilt,
        parkingSpaces: input.parkingSpaces,
        isFeatured: input.isFeatured,
        agent: { connect: { id: agent.id } },
        address: {
          create: input.address,
        },
        features: {
          create: input.features,
        },
      },
      include: PROPERTY_INCLUDE,
    });

    return property;
  }

  async update(propertyId: string, userId: string, userRole: string, input: UpdatePropertyInput) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { agent: true },
    });

    if (!property) throw ApiError.notFound("Propiedad no encontrada");

    // Only the owning agent or admin can edit
    if (userRole !== "ADMIN" && property.agent.userId !== userId) {
      throw ApiError.forbidden("No tienes permiso para editar esta propiedad");
    }

    const { address, features, ...propertyData } = input;

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...propertyData,
        ...(address && {
          address: {
            update: address,
          },
        }),
        ...(features && {
          features: {
            deleteMany: {},
            create: features,
          },
        }),
      },
      include: PROPERTY_INCLUDE,
    });

    return updated;
  }

  async delete(propertyId: string, userId: string, userRole: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { agent: true, images: true },
    });

    if (!property) throw ApiError.notFound("Propiedad no encontrada");
    if (userRole !== "ADMIN" && property.agent.userId !== userId) {
      throw ApiError.forbidden("No tienes permiso para eliminar esta propiedad");
    }

    // Delete images from Cloudinary
    const publicIds = property.images
      .map((img) => img.publicId)
      .filter((id): id is string => id !== null);
    if (publicIds.length > 0) {
      await uploadService.deleteMany(publicIds);
    }

    await prisma.property.delete({ where: { id: propertyId } });
  }

  async addImages(propertyId: string, userId: string, userRole: string, files: Express.Multer.File[]) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { agent: true, images: true },
    });

    if (!property) throw ApiError.notFound("Propiedad no encontrada");
    if (userRole !== "ADMIN" && property.agent.userId !== userId) {
      throw ApiError.forbidden("No tienes permiso para editar esta propiedad");
    }

    const uploaded = await uploadService.uploadMany(files);
    const maxOrder = property.images.reduce((max, img) => Math.max(max, img.sortOrder), -1);

    const images = await prisma.$transaction(
      uploaded.map((upload, i) =>
        prisma.propertyImage.create({
          data: {
            propertyId,
            url: upload.url,
            publicId: upload.publicId,
            sortOrder: maxOrder + 1 + i,
            isPrimary: property.images.length === 0 && i === 0,
          },
        })
      )
    );

    return images;
  }

  async deleteImage(imageId: string, userId: string, userRole: string) {
    const image = await prisma.propertyImage.findUnique({
      where: { id: imageId },
      include: { property: { include: { agent: true } } },
    });

    if (!image) throw ApiError.notFound("Imagen no encontrada");
    if (userRole !== "ADMIN" && image.property.agent.userId !== userId) {
      throw ApiError.forbidden("No tienes permiso");
    }

    if (image.publicId) {
      await uploadService.deleteImage(image.publicId);
    }

    await prisma.propertyImage.delete({ where: { id: imageId } });
  }

  async getFeatured(limit = 6) {
    return prisma.property.findMany({
      where: { isFeatured: true, listingStatus: "ACTIVE" },
      include: PROPERTY_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getSimilar(propertyId: string, limit = 3) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { propertyType: true, status: true, price: true },
    });
    if (!property) return [];

    return prisma.property.findMany({
      where: {
        id: { not: propertyId },
        propertyType: property.propertyType,
        listingStatus: "ACTIVE",
      },
      include: PROPERTY_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async getStats() {
    const [total, forSale, forRent, featured, avgPrice, byType] = await prisma.$transaction([
      prisma.property.count({ where: { listingStatus: "ACTIVE" } }),
      prisma.property.count({ where: { listingStatus: "ACTIVE", status: "SALE" } }),
      prisma.property.count({ where: { listingStatus: "ACTIVE", status: "RENT" } }),
      prisma.property.count({ where: { isFeatured: true, listingStatus: "ACTIVE" } }),
      prisma.property.aggregate({
        where: { listingStatus: "ACTIVE" },
        _avg: { price: true },
      }),
      prisma.property.groupBy({
        by: ["propertyType"],
        where: { listingStatus: "ACTIVE" },
        _count: true,
      }),
    ]);

    return {
      total,
      forSale,
      forRent,
      featured,
      averagePrice: avgPrice._avg.price || 0,
      byType: byType.map((t) => ({ type: t.propertyType, count: t._count })),
    };
  }
}

export const propertyService = new PropertyService();
