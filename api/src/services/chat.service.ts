import { desc, eq } from "drizzle-orm";
import { db } from "../config/db";
import { chatroom } from "../drizzle/schema/chatroom.schema";
import { message } from "../drizzle/schema/message.schema";
import { dispute } from "../drizzle/schema/dispute.schema";
import { users } from "../drizzle/schema/user.schema";
export const createChatroom = async (disputeId: string) => {
  const existing = await db.query.chatroom.findFirst({
    where: eq(chatroom.disputeId, disputeId),
  });
  if (existing) return existing;

  const [room] = await db
    .insert(chatroom)
    .values({
      disputeId,
    })
    .returning();

  return room;
};

export const getChatroomByDispute = async (disputeId: string) => {
  const room = await db.query.chatroom.findFirst({
    where: eq(chatroom.disputeId, disputeId),
  });
  return room;
};

export const getMessages = async (
  chatroomId: string,
  limit = 50,
  offset = 0,
) => {
  const msgs = await db
    .select()
    .from(message)
    .where(eq(message.chatroomId, chatroomId))
    .orderBy(desc(message.createdAt))
    .limit(limit)
    .offset(offset);

  const enriched = await Promise.all(
    msgs.map(async (msg) => {
      let senderName = msg.senderRole === "admin" ? "Admin" : "User";
      if (msg.senderRole === "user") {
        const u = await db.query.users.findFirst({
          where: eq(users.id, msg.senderId),
          columns: { name: true },
        });
        if (u) senderName = u.name;
      }
      return { ...msg, senderName };
    }),
  );

  return enriched.reverse();
};

export const getUserChatrooms = async (userId: string) => {
  const disputes = await db
    .select({
      id: dispute.id,
      escrow_id: dispute.escrow_id,
      dispute_type: dispute.dispute_type,
      status: dispute.status,
      reason: dispute.reason,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    })
    .from(dispute)
    .where(eq(dispute.reporter_id, userId));

  const reportedDisputes = await db
    .select({
      id: dispute.id,
      escrow_id: dispute.escrow_id,
      dispute_type: dispute.dispute_type,
      status: dispute.status,
      reason: dispute.reason,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
    })
    .from(dispute)
    .where(eq(dispute.reported_id, userId));

  const allDisputes = [...disputes, ...reportedDisputes];
  const unique = allDisputes.filter(
    (d, i, arr) => arr.findIndex((x) => x.id === d.id) === i,
  );

  const result = [];
  for (const d of unique) {
    const room = await db.query.chatroom.findFirst({
      where: eq(chatroom.disputeId, d.id),
    });
    let lastMessage = null;
    if (room) {
      const msgs = await db
        .select()
        .from(message)
        .where(eq(message.chatroomId, room.id))
        .orderBy(desc(message.createdAt))
        .limit(1);
      if (msgs.length > 0) lastMessage = msgs[0];
    }
    result.push({
      dispute: d,
      chatroom: room || null,
      lastMessage,
    });
  }

  result.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.dispute.createdAt;
    const bTime = b.lastMessage?.createdAt || b.dispute.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return result;
};

export const getAdminChatrooms = async (adminId: string) => {
  const rooms = await db
    .select({
      chatroom: chatroom,
      dispute: dispute,
    })
    .from(chatroom)
    .innerJoin(dispute, eq(chatroom.disputeId, dispute.id))
    .where(eq(dispute.assigned_admin_id, adminId))
    .orderBy(desc(dispute.updatedAt));

  const result = [];
  for (const r of rooms) {
    let lastMessage = null;
    const msgs = await db
      .select()
      .from(message)
      .where(eq(message.chatroomId, r.chatroom.id))
      .orderBy(desc(message.createdAt))
      .limit(1);
    if (msgs.length > 0) lastMessage = msgs[0];
    result.push({
      dispute: r.dispute,
      chatroom: r.chatroom,
      lastMessage,
    });
  }

  result.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt || a.dispute.updatedAt;
    const bTime = b.lastMessage?.createdAt || b.dispute.updatedAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return result;
};

export const sendMessage = async (
  chatroomId: string,
  senderId: string,
  senderRole: "user" | "admin",
  text: string,
) => {
  const [msg] = await db
    .insert(message)
    .values({
      chatroomId,
      senderId,
      senderRole,
      message: text,
    })
    .returning();

  return msg;
};
