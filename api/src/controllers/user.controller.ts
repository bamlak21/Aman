import { NextFunction, Response } from "express";
import { searchByEmail } from "../services/user.service";
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
