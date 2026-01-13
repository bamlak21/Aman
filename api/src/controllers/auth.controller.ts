import { NextFunction, Request, Response } from "express";
import { authenticateUser, createUser } from "../services/auth.service";
import { AppError } from "../utils/AppError";

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }

  try {
    const user = await createUser(name, email, password, role);

    res.status(201).json({ message: "success", user });
    return;
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  if (!email || !password) {
    next(new AppError(401, "Missing Required Fields"));
    return;
  }

  try {
    const user = await authenticateUser(email, password);

    res.status(200).json({ message: "success", user });
    return;
  } catch (error) {
    console.error(error);
    next(error);
  }
};
