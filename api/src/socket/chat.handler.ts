import { Server, Socket } from "socket.io";
import { db } from "../config/db";
import { message } from "../drizzle/schema/message.schema";
import { eq } from "drizzle-orm";
import { chatroom } from "../drizzle/schema/chatroom.schema";
import { dispute } from "../drizzle/schema/dispute.schema";
import { users } from "../drizzle/schema/user.schema";

const onlineUsers = new Map<string, string[]>();

export const registerChatHandlers = (io: Server, socket: Socket) => {
  const user = (socket as any).user;
  if (!user) return;

  socket.on("join-dispute", async (disputeId: string) => {
    const room = `dispute:${disputeId}`;

    const dis = await db.query.dispute.findFirst({
      where: eq(dispute.id, disputeId),
    });
    if (!dis) {
      socket.emit("error", "Dispute not found");
      return;
    }

    const isReporter = dis.reporter_id === user.id;
    const isReported = dis.reported_id === user.id;

    await db.query.chatroom.findFirst({
      where: eq(chatroom.disputeId, disputeId),
    });
    const isAdmin = dis.assigned_admin_id === user.id;

    if (!isReporter && !isReported && !isAdmin) {
      socket.emit("error", "Not a participant of this dispute");
      return;
    }

    socket.join(room);

    const existing = onlineUsers.get(disputeId) || [];
    if (!existing.includes(user.id)) {
      existing.push(user.id);
    }
    onlineUsers.set(disputeId, existing);
    io.to(room).emit("online-users", existing.length);
  });

  socket.on("leave-dispute", (disputeId: string) => {
    const room = `dispute:${disputeId}`;
    socket.leave(room);

    const existing = onlineUsers.get(disputeId) || [];
    const filtered = existing.filter((id) => id !== user.id);
    if (filtered.length === 0) {
      onlineUsers.delete(disputeId);
    } else {
      onlineUsers.set(disputeId, filtered);
    }
    io.to(room).emit("online-users", filtered.length);
  });

  socket.on("send-message", async (data: { disputeId: string; message: string }) => {
    const { disputeId, message: text } = data;
    const room = `dispute:${disputeId}`;

    if (!text?.trim()) {
      socket.emit("error", "Message cannot be empty");
      return;
    }

    const chat = await db.query.chatroom.findFirst({
      where: eq(chatroom.disputeId, disputeId),
    });
    if (!chat) {
      socket.emit("error", "Chatroom not found");
      return;
    }

    const dis = await db.query.dispute.findFirst({
      where: eq(dispute.id, disputeId),
    });
    if (dis?.status === "Resolved") {
      socket.emit("error", "Dispute is resolved. Chat is read-only.");
      return;
    }

    const isAdmin = dis?.assigned_admin_id === user.id;
    const senderRole = isAdmin ? "admin" : "user";

    let senderName = senderRole === "admin" ? "Admin" : "User";
    if (senderRole === "user") {
      const u = await db.query.users.findFirst({ where: eq(users.id, user.id) });
      if (u) senderName = u.name;
    }

    const [msg] = await db
      .insert(message)
      .values({
        chatroomId: chat.id,
        senderId: user.id,
        senderRole,
        message: text.trim(),
      })
      .returning();

    const payload = {
      id: msg.id,
      senderId: msg.senderId,
      senderRole: msg.senderRole,
      senderName,
      message: msg.message,
      createdAt: msg.createdAt,
    };

    io.to(room).emit("new-message", payload);
  });

  socket.on("typing", async (data: { disputeId: string; isTyping: boolean }) => {
    const room = `dispute:${data.disputeId}`;
    let senderName: string | undefined;
    if (data.isTyping) {
      const u = await db.query.users.findFirst({
        where: eq(users.id, user.id),
        columns: { name: true },
      });
      if (u) senderName = u.name;
    }
    socket.to(room).emit("user-typing", {
      userId: user.id,
      isTyping: data.isTyping,
      senderName,
    });
  });
};
