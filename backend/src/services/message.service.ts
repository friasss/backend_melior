import { prisma } from "../config/database";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notification.service";

export class MessageService {
  async getConversations(userId: string) {
    // Get unique conversation partners with last message
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Group by conversation partner
    const conversations = new Map<string, typeof messages[0]>();
    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversations.has(partnerId)) {
        conversations.set(partnerId, msg);
      }
    }

    return Array.from(conversations.values());
  }

  async getConversation(userId: string, partnerId: string, limit = 50) {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Mark unread messages as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return messages;
  }

  async send(senderId: string, receiverId: string, content: string) {
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) throw ApiError.notFound("Destinatario no encontrado");

    const message = await prisma.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    // Notification
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
    return prisma.message.count({
      where: { receiverId: userId, isRead: false },
    });
  }
}

export const messageService = new MessageService();
