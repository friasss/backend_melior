import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { parsePagination, paginate } from "../utils/helpers";
import { CreateTransactionInput, CreatePaymentInput, UpdatePaymentInput } from "../schemas/transaction.schema";

export class TransactionService {
  async findAll(query: { page?: number; limit?: number; type?: string; agentId?: string }) {
    const { page, limit, skip } = parsePagination(query);

    const where = {
      ...(query.type && { type: query.type as any }),
      ...(query.agentId && { agentId: query.agentId }),
    };

    const [data, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: {
          property: { select: { id: true, title: true } },
          client: { include: { user: { select: { firstName: true, lastName: true } } } },
          agent: { include: { user: { select: { firstName: true, lastName: true } } } },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true } },
        client: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        agent: { include: { user: { select: { firstName: true, lastName: true } } } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!transaction) throw ApiError.notFound("Transacción no encontrada");
    return transaction;
  }

  async create(agentUserId: string, input: CreateTransactionInput) {
    const agent = await prisma.agentProfile.findUnique({ where: { userId: agentUserId } });
    if (!agent) throw ApiError.forbidden("Solo agentes pueden crear transacciones");

    return prisma.transaction.create({
      data: {
        ...input,
        agentId: agent.id,
      },
    });
  }

  async addPayment(input: CreatePaymentInput) {
    const transaction = await prisma.transaction.findUnique({ where: { id: input.transactionId } });
    if (!transaction) throw ApiError.notFound("Transacción no encontrada");

    return prisma.payment.create({
      data: input,
    });
  }

  async updatePayment(paymentId: string, input: UpdatePaymentInput) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw ApiError.notFound("Pago no encontrado");

    return prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: input.status,
        paidAt: input.status === "COMPLETED" ? new Date() : undefined,
      },
    });
  }
}

export const transactionService = new TransactionService();
