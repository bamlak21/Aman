import { NextFunction, Response } from "express";
import { searchByEmail, findUserByEmail } from "../services/user.service";
import { AuthReq } from "../types/auth";
import { AppError } from "../utils/AppError";

export const searchUserByEmail = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.query;
  const id = req.user?.id;

  if (!id) {
    next(new AppError(403, "Unauthorized access"));
    return;
  }

  if (typeof email !== "string" || email.length < 3) {
    res.json([]);
    return;
  }

  try {
    const search = await searchByEmail(email, id);
    if (search.length === 0) {
      res.json([]);
      return;
    }
    res.json(search);
    return;
  } catch (error) {
    next(error);
  }
};

export const getUserByEmail = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    next(new AppError(400, "Email is required"));
    return;
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      next(new AppError(404, "User not found"));
      return;
    }
    res.json({ id: user.id, email: user.email, name: user.name });
  } catch (error) {
    next(error);
  }
};
