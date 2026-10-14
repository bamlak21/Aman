import { NextFunction, Response } from "express";
import { AuthReq } from "../types/auth";
import { AppError } from "../utils/AppError";
import {
  createDispute,
  myDisputes,
  listDisputeOffers,
  createDisputeOffer,
  acceptDisputeOffer,
  rejectDisputeOffer,
  counterDisputeOffer,
} from "../services/dispute.service";
import { analyzeDisputeWithAI } from "../services/ai.service";

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
      next(new AppError(400, "disputeId is required"));
      return;
    }
    await analyzeDisputeWithAI(disputeId);
    res.json({ message: "Analysis completed" });
  } catch (error) {
    next(error);
  }
};

export const my = async (
  req: AuthReq,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    if (!req.user?.id) {
      next(new AppError(401, "Unauthorized"));
      return;
    }
    const disputes = await myDisputes(req.user.id);
    res.status(200).json({ data: disputes });
  } catch (error) {
    next(error);
  }
};

export const listOffers = async (
  req: AuthReq,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { disputeId } = req.params;
    const offers = await listDisputeOffers(disputeId, req.user?.id as string, req.user?.role);
    res.status(200).json({ data: offers });
  } catch (error) {
    next(error);
  }
};

export const createOffer = async (
  req: AuthReq,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { disputeId } = req.params;
    const { amountCents, terms } = req.body;
    if (amountCents === undefined) {
      next(new AppError(400, "amountCents is required"));
      return;
    }
    const offer = await createDisputeOffer(disputeId, req.user?.id, Number(amountCents), terms);
    res.status(201).json(offer);
  } catch (error) {
    next(error);
  }
};

export const acceptOffer = async (
  req: AuthReq,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { offerId } = req.params;
    const result = await acceptDisputeOffer(offerId, req.user?.id, req.user?.role);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const rejectOffer = async (
  req: AuthReq,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { offerId } = req.params;
    const result = await rejectDisputeOffer(offerId, req.user?.id, req.user?.role);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const counterOffer = async (
  req: AuthReq,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { offerId } = req.params;
    const { amountCents, terms } = req.body;
    if (amountCents === undefined) {
      next(new AppError(400, "amountCents is required"));
      return;
    }
    const result = await counterDisputeOffer(offerId, req.user?.id, Number(amountCents), terms);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
