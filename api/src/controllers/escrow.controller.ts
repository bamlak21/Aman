import { Response, NextFunction } from "express";
import {
  createEscrow,
  fetchEscrow,
  fetchEscrows,
} from "../services/escrow.service";
import { AuthReq } from "../types/auth";
import { AppError } from "../utils/AppError";

export const create = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  const payerId = req.user?.id; // from auth middleware
  const { payeeId, amount, releaseCondition, expiresAt } = req.body;

  const amountCents = amount * 100;
  try {
    if (!payerId) {
      next(new AppError(400, "Missing data"));
      return;
    }
    const escrow = await createEscrow({
      payerId,
      payeeId,
      amountCents,
      releaseCondition,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });
    return res.status(201).json({
      id: escrow.id,
      status: escrow.status,
      amount: escrow.amountCents,
      releaseCondition: escrow.releaseCondition,
      expiresAt: escrow.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

export const getEscrowById = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const { escrowId } = req.params;

  if (!escrowId || typeof escrowId !== "string") {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }
  const userId = req.user?.id;
  console.log(req.user);

  if (!userId) {
    next(new AppError(403, "An authorized access"));
    return;
  }

  try {
    const escrow = await fetchEscrow(escrowId, userId);

    res.status(200).json({
      message: "Success",
      escrow,
    });

    return;
  } catch (error) {
    next(error);
  }
};

export const getUserEscrows = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;

  if (!userId) {
    next(new AppError(403, "An authorized access"));
    return;
  }

  try {
    const escrows = await fetchEscrows(userId);

    res.status(200).json({
      message: "Success",
      escrows,
    });
    return;
  } catch (error) {
    next(error);
  }
};
