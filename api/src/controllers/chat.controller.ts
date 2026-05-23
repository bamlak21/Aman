import { NextFunction, Response } from "express";
import { AuthReq } from "../types/auth";
import { AppError } from "../utils/AppError";
import {
  createChatroom,
  getMessages,
  getUserChatrooms,
  getAdminChatrooms,
} from "../services/chat.service";
import { db } from "../config/db";
import { dispute } from "../drizzle/schema/dispute.schema";
import { eq } from "drizzle-orm";
import { chatroom as chatroomSchema } from "../drizzle/schema/chatroom.schema";
import { admins } from "../drizzle/schema/admin.schema";

export const getOrCreate = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { disputeId } = req.params;
    if (!disputeId) {
      next(new AppError(400, "disputeId required"));
      return;
    }

    const dis = await db.query.dispute.findFirst({
      where: eq(dispute.id, disputeId),
    });
    if (!dis) {
      next(new AppError(404, "Dispute not found"));
      return;
    }

    const isReporter = dis.reporter_id === req.user?.id;
    const isReported = dis.reported_id === req.user?.id;

    const room = await db.query.chatroom.findFirst({
      where: eq(chatroomSchema.disputeId, disputeId),
    });
    const isAdmin = dis.assigned_admin_id === req.user?.id;

    if (!isReporter && !isReported && !isAdmin) {
      next(new AppError(403, "Not a participant"));
      return;
    }

    if (!room) {
      next(new AppError(404, "Chatroom not yet created"));
      return;
    }

    res.json(room);
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { chatroomId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const room = await db.query.chatroom.findFirst({
      where: eq(chatroomSchema.id, chatroomId),
    });
    if (!room) {
      next(new AppError(404, "Chatroom not found"));
      return;
    }

    const dis = await db.query.dispute.findFirst({
      where: eq(dispute.id, room.disputeId),
    });
    if (!dis) {
      next(new AppError(404, "Dispute not found"));
      return;
    }

    const isReporter = dis.reporter_id === req.user?.id;
    const isReported = dis.reported_id === req.user?.id;
    const isAdmin = dis.assigned_admin_id === req.user?.id;

    if (!isReporter && !isReported && !isAdmin) {
      next(new AppError(403, "Not a participant"));
      return;
    }

    const msgs = await getMessages(chatroomId, limit, offset);
    res.json(msgs);
  } catch (error) {
    next(error);
  }
};

export const getMyChats = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      next(new AppError(401, "Unauthorized"));
      return;
    }

    const chatrooms = await getUserChatrooms(req.user.id);
    res.json(chatrooms);
  } catch (error) {
    next(error);
  }
};

export const getAdminChats = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user?.id) {
      next(new AppError(401, "Unauthorized"));
      return;
    }

    const chatrooms = await getAdminChatrooms(req.user.id);
    res.json(chatrooms);
  } catch (error) {
    next(error);
  }
};

export const getDisputeChatroom = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { disputeId } = req.params;

    const dis = await db.query.dispute.findFirst({
      where: eq(dispute.id, disputeId),
    });
    if (!dis) {
      next(new AppError(404, "Dispute not found"));
      return;
    }

    const isReporter = dis.reporter_id === req.user?.id;
    const isReported = dis.reported_id === req.user?.id;
    const adminMatch = req.user?.id ? await db.query.admins.findFirst({ where: eq(admins.id, req.user.id) }) : null;
    const isAdmin = !!adminMatch;

    if (!isReporter && !isReported && !isAdmin) {
      next(new AppError(403, "Not a participant"));
      return;
    }

    let room = await db.query.chatroom.findFirst({
      where: eq(chatroomSchema.disputeId, disputeId),
    });

    if (!room) {
      room = await createChatroom(disputeId);
    }

    const msgs = await getMessages(room.id);
    res.json({
      chatroom: room,
      messages: msgs,
      dispute_type: dis.dispute_type,
      status: dis.status,
      reason: dis.reason,
    });
  } catch (error) {
    next(error);
  }
};
