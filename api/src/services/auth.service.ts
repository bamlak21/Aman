import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { users } from "../drizzle/schema";
import bcrypt from "bcrypt";
import { User, UserRole } from "../types/user";

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<User | void> => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (user) throw new Error("User already exists");

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
  } catch (error) {
    console.error(error);
  }
};

export const authenticateUser = async (
  email: string,
  password: string
): Promise<User | void> => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      throw new Error("User doesn't exist");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch)
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    else throw new Error("Invalid Credentials");
  } catch (error) {
    console.error(error);
  }
};
