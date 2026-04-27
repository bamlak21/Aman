import { Request } from "express";
import { User } from "./user";

export type JwtPayload = Omit<User, "name">;

export interface AuthReq extends Request {
  user?: JwtPayload | null;
}
