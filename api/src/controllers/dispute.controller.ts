import { NextFunction, Response } from "express";
import { AuthReq } from "../types/auth";
import { AppError } from "../utils/AppError";
import { createDispute } from "../services/dispute.service";
import { analyzeDisputeWithAI } from "../services/ai.service";
import { db } from "../config/db";
import { admins } from "../drizzle/schema/admin.schema";
import { eq } from "drizzle-orm";

export const create = async (
  req: AuthReq,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const reporter_id = req.user?.id;
  const { reason, reported_id, escrow_id, dispute_type } = req.body;

  if (!reason || !reported_id || !escrow_id || !dispute_type) {
    next(new AppError(400, "missing fields"));
    return;
  }

  try {
    if (!reporter_id) {
      next(new AppError(400, "reporter id missing"));
      return;
    }

    const files = (req as any).files as { filename: string }[] | undefined;
    const evidence_url = files
      ? files.map((f) => `/uploads/disputes/${f.filename}`)
      : [];


    const dispute = await createDispute({
      evidence_url,
      reason,
      escrow_id,
      dispute_type,
      reported_id,
      reporter_id,
    });


    return res.status(201).json({
      id: dispute.id,
      status: dispute.status,
      dispute_type: dispute.dispute_type,
      reporter_id: dispute.reporter_id,
      reported_id: dispute.reported_id,
      reason: dispute.reason,
      evidence_url: evidence_url,
    });
  } catch (error) {
    next(error);
  }
};

export const analyze = async (
  req: AuthReq,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { disputeId } = req.params;
    
    if (!disputeId) {
      return next(new AppError(400, "disputeId is required"));
    }

    const adminMatch = req.user?.id ? await db.query.admins.findFirst({ where: eq(admins.id, req.user.id) }) : null;
    if (!adminMatch) {
      return next(new AppError(403, "Only admins can trigger AI analysis directly"));
    }

    analyzeDisputeWithAI(disputeId).catch(console.error);

    return res.status(200).json({ message: "AI analysis triggered successfully" });
  } catch (error) {
    next(error);
  }
};
