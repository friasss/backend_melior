import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { JwtPayload } from "../types";
import { messageService } from "../services/message.service";
import { notificationService } from "../services/notification.service";

// Map userId -> Set of socket IDs (one user can have multiple tabs/devices)
const onlineUsers = new Map<string, Set<string>>();

let io: Server;

export function getIO(): Server {
  return io;
}

/**
 * Emit an event to a specific user (all their connected sockets).
 */
export function emitToUser(userId: string, event: string, data: unknown) {
  const sockets = onlineUsers.get(userId);
  if (sockets && io) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
  }
}

export function initializeSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = (socket as any).userId as string;

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    console.log(`🔌 User ${userId} connected (socket: ${socket.id})`);

    // Join personal room
    socket.join(`user:${userId}`);

    // ─── Chat / Direct Message ───

    socket.on("message:send", async (data: { receiverId: string; content: string }) => {
      try {
        const message = await messageService.send(userId, data.receiverId, data.content);

        // Send to receiver in real-time
        emitToUser(data.receiverId, "message:new", message);

        // Acknowledge to sender
        socket.emit("message:sent", message);
      } catch (error: any) {
        socket.emit("message:error", { error: error.message });
      }
    });

    socket.on("message:typing", (data: { receiverId: string }) => {
      emitToUser(data.receiverId, "message:typing", { senderId: userId });
    });

    socket.on("message:stop-typing", (data: { receiverId: string }) => {
      emitToUser(data.receiverId, "message:stop-typing", { senderId: userId });
    });

    // ─── Notifications ───

    socket.on("notifications:mark-read", async (data: { notificationId: string }) => {
      try {
        await notificationService.markAsRead(data.notificationId, userId);
        socket.emit("notifications:updated");
      } catch (error: any) {
        socket.emit("notifications:error", { error: error.message });
      }
    });

    socket.on("notifications:mark-all-read", async () => {
      try {
        await notificationService.markAllAsRead(userId);
        socket.emit("notifications:updated");
      } catch (error: any) {
        socket.emit("notifications:error", { error: error.message });
      }
    });

    // ─── Online Status ───

    socket.on("user:get-online", (data: { userIds: string[] }) => {
      const statuses: Record<string, boolean> = {};
      for (const id of data.userIds) {
        statuses[id] = onlineUsers.has(id) && onlineUsers.get(id)!.size > 0;
      }
      socket.emit("user:online-status", statuses);
    });

    // ─── Disconnect ───

    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
        }
      }
      console.log(`🔌 User ${userId} disconnected (socket: ${socket.id})`);
    });
  });

  return io;
}
