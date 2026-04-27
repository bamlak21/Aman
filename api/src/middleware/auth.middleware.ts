import { NextFunction, Response } from "express";
import { AuthReq } from "../types/auth";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

export const protect = (req: AuthReq, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError(403, "Token not Provided"));
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return next(new AppError(401, "Invalid or malformed Token"));
  }
};
