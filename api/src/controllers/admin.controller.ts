import { NextFunction, Request, Response } from "express";
import {
  renewToken,
  revokeToken,
  saveRefreshToken,
  getAdminById,
  getAllUsers,
} from "../services/admin.service";
import { AppError } from "../utils/AppError";
import {
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { JwtPayload } from "../types/auth";
import { authenticateAdmin } from "../services/admin.service";
import { AuthReq } from "../types/auth";



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
    const user = await authenticateAdmin(email, password);
  if(!user) {
    next(new AppError(401, "Invalid Credentials"));
    return;
  }
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

    res.status(200).json({ message: "Login successful", admin: user, accessToken });
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

export const me = async (
  req: AuthReq,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user?.id) {
    next(new AppError(401, "Unauthorized"));
    return;
  }

  try {
    const adminUser = await getAdminById(req.user.id);
    res.json(adminUser);
  } catch (error) {
    next(error);
  }
};

export const fetchAllUsers=async(
  req:AuthReq,
  res:Response,
  next:NextFunction
)=>{
 if (!req.user?.id) {
    next(new AppError(401, "Unauthorized"));
    return;
  }
try{
const data = await getAllUsers();

res.status(200).json(data);
}
catch(error){
 next(error);
 return;
}
}