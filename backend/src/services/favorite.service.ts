import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";

export class FavoriteService {
  async getUserFavorites(userId: string) {
    return prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            address: true,
            images: { where: { isPrimary: true }, take: 1 },
            agent: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async toggle(userId: string, propertyId: string) {
    // Check property exists
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw ApiError.notFound("Propiedad no encontrada");

    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return { isFavorite: false };
    }

    await prisma.favorite.create({ data: { userId, propertyId } });
    return { isFavorite: true };
  }

  async isFavorite(userId: string, propertyId: string) {
    const fav = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    return { isFavorite: !!fav };
  }
}

export const favoriteService = new FavoriteService();
