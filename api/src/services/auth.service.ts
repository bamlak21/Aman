import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { users } from "../drizzle/schema";
import bcrypt from "bcrypt";
import { User, UserRole } from "../types/user";
import { AppError } from "../utils/AppError";

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<User | void> => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (user) throw new AppError(409, "User already exists");

  const hashed = await bcrypt.hash(password, 10);
  const [newUser] = await db
    .insert(users)
    .values({
      name,
      email,
      password: hashed,
      role,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  return newUser;
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<User | void> => {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new AppError(401, "User doesn't exist");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  else throw new AppError(401, "Invalid Credentials");
};
