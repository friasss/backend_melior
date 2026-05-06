import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notification.service";

export class MessageService {
  async getConversations(userId: string) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { sender: { select: { id: true, firstName: true, lastName: true } } },
            },
            participants: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    return participations.map((p) => {
      const conv = p.conversation;
      const lastMsg = conv.messages[0] ?? null;
      return {
        id: conv.id,
        unreadCount: p.unreadCount,
        updatedAt: conv.updatedAt,
        lastMessage: lastMsg
          ? { content: lastMsg.content, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId }
          : null,
        participants: conv.participants.map((cp) => cp.user),
      };
    });
  }

  async getConversation(userId: string, partnerId: string, limit = 50) {
    const participant = await prisma.user.findUnique({ where: { id: partnerId } });
    if (!participant) throw ApiError.notFound("Usuario no encontrado");

    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: partnerId } } },
        ],
      },
    });

    if (!existing) return [];

    const messages = await prisma.message.findMany({
      where: { conversationId: existing.id },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: existing.id, userId },
      data: { unreadCount: 0 },
    });

    await prisma.message.updateMany({
      where: { conversationId: existing.id, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return messages;
  }

  async send(senderId: string, receiverId: string, content: string) {
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw ApiError.notFound("Destinatario no encontrado");

    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: senderId } } },
          { participants: { some: { userId: receiverId } } },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: senderId }, { userId: receiverId }],
          },
        },
      });
    }

    const message = await prisma.message.create({
      data: { conversationId: conversation.id, senderId, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: conversation.id, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { firstName: true, lastName: true },
    });

    await notificationService.create({
      userId: receiverId,
      type: "MESSAGE",
      title: "Nuevo mensaje",
      body: `${sender?.firstName} ${sender?.lastName}: ${content.substring(0, 100)}`,
      data: { senderId, messageId: message.id },
    });

    return message;
  }

  async getUnreadCount(userId: string) {
    const result = await prisma.conversationParticipant.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    });
    return result._sum.unreadCount ?? 0;
  }
}

export const messageService = new MessageService();
