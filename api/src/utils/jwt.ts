import jwt from "jsonwebtoken";
import { JwtPayload } from "../types/auth";
import { config } from "../config";
import { AppError } from "./AppError";

export const generateToken = (payload: JwtPayload) => {
  return jwt.sign(payload, config.secret, { expiresIn: "2m" });
};

export const generateRefreshToken = (payload: JwtPayload) => {
  return jwt.sign(payload, config.secret, { expiresIn: "15d" });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, config.secret) as JwtPayload;
  } catch (error) {
    console.error("Invalid Token: ", error);
    throw new AppError(409, "InValid Token");
  }
};

export const verifyRefreshToken = (token: string) => {
  try {
    return jwt.verify(token, config.secret) as JwtPayload;
  } catch (error) {
    console.error("Invalid Token: ", error);
    throw new AppError(409, "InValid Token");
  }
};
