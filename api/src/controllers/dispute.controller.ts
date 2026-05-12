import { NextFunction, Response } from "express";
import { AuthReq } from "../types/auth";
import { AppError } from "../utils/AppError";
import { createDispute } from "../services/dispute.service";

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
      evidence_url: dispute.evidence_url,
    });
  } catch (error) {
    next(error);
  }
};
