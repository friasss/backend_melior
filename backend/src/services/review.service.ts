import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { CreateReviewInput, UpdateReviewInput } from "../schemas/review.schema";

export class ReviewService {
  async getByProperty(propertyId: string) {
    return prisma.review.findMany({
      where: { propertyId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(userId: string, input: CreateReviewInput) {
    const property = await prisma.property.findUnique({ where: { id: input.propertyId } });
    if (!property) throw ApiError.notFound("Propiedad no encontrada");

    return prisma.review.create({
      data: {
        propertyId: input.propertyId,
        userId,
        rating: input.rating,
        comment: input.comment,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });
  }

  async update(reviewId: string, userId: string, input: UpdateReviewInput) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw ApiError.notFound("Reseña no encontrada");
    if (review.userId !== userId) throw ApiError.forbidden("No puedes editar esta reseña");

    return prisma.review.update({
      where: { id: reviewId },
      data: input,
    });
  }

  async delete(reviewId: string, userId: string, userRole: string) {
    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw ApiError.notFound("Reseña no encontrada");
    if (userRole !== "ADMIN" && review.userId !== userId) {
      throw ApiError.forbidden("No tienes permiso");
    }
    await prisma.review.delete({ where: { id: reviewId } });
  }
}

export const reviewService = new ReviewService();
