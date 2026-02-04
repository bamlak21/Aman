import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { users } from "../drizzle/schema";
import bcrypt from "bcrypt";
import { User, UserRole } from "../types/user";
import { AppError } from "../utils/AppError";
import { refreshTokens } from "../drizzle/schema/refreshToken.schema";
import { JwtPayload } from "../types/auth";
import { generateRefreshToken, generateToken } from "../utils/jwt";

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: UserRole,
): Promise<User> => {
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
  password: string,
): Promise<User> => {
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

export const saveRefreshToken = async (token: string, userId: string) => {
  if (!token || !userId) {
    throw new AppError(400, "Missing Required fields");
  }
  await db.insert(refreshTokens).values({
    userId: userId,
    token,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });
};

export const renewToken = async (token: string, payload: JwtPayload) => {
  const storedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
  });

  if (!storedToken || storedToken.revoked) {
    throw new AppError(403, "Token malformed");
  }

  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, storedToken.id));

  const newRefreshToken = generateRefreshToken(payload);
  const newAccessToken = generateToken(payload);

  await db.insert(refreshTokens).values({
    userId: payload.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const revokeToken = async (token: string) => {
  const t = await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.token, token))
    .returning();

  return t;
};
