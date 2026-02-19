import { NextFunction, Request, Response } from "express";
import {
  authenticateUser,
  createUser,
  renewToken,
  revokeToken,
  saveRefreshToken,
} from "../services/auth.service";
import { AppError } from "../utils/AppError";
import {
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { JwtPayload } from "../types/auth";
import { UserRole } from "../types/user";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }

  try {
    let newRole: UserRole;

    if (role === "client") {
      newRole = "payer";
    } else if (role === "freelancer") {
      newRole = "payee";
    } else {
      next(new AppError(400, "Error"));
      return;
    }
    const user = await createUser(name, email, password, newRole);

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await saveRefreshToken(refreshToken, user.id);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "success", user, accessToken });
    return;
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }

  try {
    const user = await authenticateUser(email, password);

    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await saveRefreshToken(refreshToken, user.id);

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "success", user, accessToken });
    return;
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies?.refresh_token;
  if (!token) {
    next(new AppError(403, "Token missing"));
    return;
  }

  try {
    const payload = verifyRefreshToken(token);

    const tokens = await renewToken(token, payload);

    res.cookie("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken: tokens.accessToken });

    return;
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.refresh_token;

  if (!token) next(new AppError(403, "Token missing"));

  try {
    await revokeToken(token);
    res.clearCookie("refresh_token", { path: "/auth/token" });
    res.sendStatus(204);

    return;
  } catch (error) {
    next(error);
  }
};
