import { Request, Response } from "express";
import { authenticateUser, createUser } from "../services/auth.service";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    res.status(401).json({ message: "Missing Required Fields" });
    return;
  }

  try {
    const user = await createUser(name, email, password, role);

    res.status(201).json({ message: "success", user });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password)
    res.status(401).json({ message: "Missing Required Fields" });

  try {
    const user = await authenticateUser(email, password);

    res.status(200).json({ message: "success", user });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
