import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { parsePagination, paginate } from "../utils/helpers";
import { CreateInquiryInput, UpdateInquiryInput } from "../schemas/inquiry.schema";

export class InquiryService {
  async findAll(query: { page?: number; limit?: number; status?: string; search?: string }) {
    const { page, limit, skip } = parsePagination(query);

    const where = {
      ...(query.status && { status: query.status as any }),
      ...(query.search && {
        OR: [
          { firstName: { contains: query.search, mode: "insensitive" as const } },
          { lastName: { contains: query.search, mode: "insensitive" as const } },
          { email: { contains: query.search, mode: "insensitive" as const } },
          { message: { contains: query.search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.contactInquiry.findMany({
        where,
        include: {
          property: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.contactInquiry.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string) {
    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!inquiry) throw ApiError.notFound("Consulta no encontrada");
    return inquiry;
  }

  async findByEmail(email: string) {
    return prisma.contactInquiry.findMany({
      where: { email },
      include: {
        property: { select: { id: true, title: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: CreateInquiryInput) {
    return prisma.contactInquiry.create({
      data: input,
    });
  }

  async updateStatus(id: string, input: UpdateInquiryInput) {
    const inquiry = await prisma.contactInquiry.findUnique({ where: { id } });
    if (!inquiry) throw ApiError.notFound("Consulta no encontrada");

    return prisma.contactInquiry.update({
      where: { id },
      data: { status: input.status },
    });
  }

  async delete(id: string) {
    await prisma.contactInquiry.delete({ where: { id } });
  }
}

export const inquiryService = new InquiryService();
