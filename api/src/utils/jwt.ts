import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/auth";
import { config } from "../config";
import { AppError } from "./AppError";

export const generateToken = (payload: JwtPayload) => {
  return jwt.sign(payload, config.secret, { expiresIn: "24h" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, config.secret) as JwtPayload;
  } catch (error) {
    console.error("Invalid Token: ", error);
    throw new AppError(409, "InValid Token");
  }
};
