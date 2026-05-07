import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notification.service";

export class ConversationService {
  async getConversations(userId: string) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
            participants: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
              },
            },
            property: {
              select: {
                id: true,
                title: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: "desc" } },
    });

    return participations
      .map((p) => {
        const conv = p.conversation;
        const otherParticipant = conv.participants.find((cp) => cp.userId !== userId);
        if (!otherParticipant?.user) return null;
        const lastMsg = conv.messages[0] ?? null;
        const prop = conv.property;

        return {
          id: conv.id,
          otherUser: otherParticipant.user,
          property: prop
            ? { id: prop.id, title: prop.title, image: prop.images[0]?.url ?? "" }
            : null,
          lastMessage: lastMsg
            ? { content: lastMsg.content, createdAt: lastMsg.createdAt, senderId: lastMsg.senderId }
            : null,
          unreadCount: p.unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }

  async getConversationMessages(userId: string, conversationId: string) {
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participation) throw ApiError.forbidden("No tienes acceso a esta conversación");

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
      },
    });
    if (!conversation) throw ApiError.notFound("Conversación no encontrada");

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0 },
    });

    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    const otherParticipant = conversation.participants.find((cp) => cp.userId !== userId);
    const prop = conversation.property;

    return {
      conversation: {
        id: conversation.id,
        otherUser: otherParticipant?.user ?? null,
        property: prop
          ? { id: prop.id, title: prop.title, image: prop.images[0]?.url ?? "" }
          : null,
        unreadCount: 0,
        updatedAt: conversation.updatedAt,
      },
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        senderName: `${m.sender.firstName} ${m.sender.lastName}`,
        senderAvatar: m.sender.avatarUrl,
        content: m.content,
        createdAt: m.createdAt,
        isRead: m.isRead,
      })),
    };
  }

  async startConversation(userId: string, propertyId: string, initialMessage: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { agent: { select: { userId: true } } },
    });
    if (!property) throw ApiError.notFound("Propiedad no encontrada");
    if (!property.agent) throw ApiError.badRequest("Esta propiedad no tiene un agente asignado");

    const agentUserId = property.agent.userId;
    if (agentUserId === userId) throw ApiError.badRequest("No puedes iniciar una conversación contigo mismo");

    const existing = await prisma.conversation.findFirst({
      where: {
        propertyId,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: agentUserId } } },
        ],
      },
    });

    if (existing) {
      await this.sendMessage(userId, existing.id, initialMessage);
      return { conversationId: existing.id };
    }

    const conversation = await prisma.conversation.create({
      data: {
        propertyId,
        participants: {
          create: [{ userId }, { userId: agentUserId }],
        },
      },
    });

    await this.sendMessage(userId, conversation.id, initialMessage);
    return { conversationId: conversation.id };
  }

  async sendMessage(senderId: string, conversationId: string, content: string) {
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: senderId } },
    });
    if (!participation) throw ApiError.forbidden("No tienes acceso a esta conversación");

    const message = await prisma.message.create({
      data: { conversationId, senderId, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: senderId } },
      data: { unreadCount: { increment: 1 } },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const receiver = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true },
    });

    if (receiver) {
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true },
      });
      await notificationService.create({
        userId: receiver.userId,
        type: "MESSAGE",
        title: "Nuevo mensaje",
        body: `${sender?.firstName} ${sender?.lastName}: ${content.substring(0, 100)}`,
        data: { senderId, conversationId, messageId: message.id },
      });
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: `${message.sender.firstName} ${message.sender.lastName}`,
      senderAvatar: message.sender.avatarUrl,
      content: message.content,
      createdAt: message.createdAt,
      isRead: message.isRead,
    };
  }

  async markRead(userId: string, conversationId: string) {
    const participation = await prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
    });
    if (!participation) throw ApiError.forbidden("No tienes acceso a esta conversación");

    await prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { unreadCount: 0 },
    });

    await prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    const result = await prisma.conversationParticipant.aggregate({
      where: { userId },
      _sum: { unreadCount: true },
    });
    return result._sum.unreadCount ?? 0;
  }
}

export const conversationService = new ConversationService();
