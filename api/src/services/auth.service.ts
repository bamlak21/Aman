import { eq } from "drizzle-orm";
import { db } from "../config/db";
import {  admins, users } from "../drizzle/schema";
import bcrypt from "bcrypt";
import { User } from "../types/user";
import { AppError } from "../utils/AppError";
import { refreshTokens } from "../drizzle/schema/refreshToken.schema";
import { JwtPayload } from "../types/auth";
import { generateRefreshToken, generateToken } from "../utils/jwt";
import { Admin } from "../types/admin";

export const createUser = async (
  name: string,
  email: string,
  password: string,
  role: string,
): Promise<User|Admin> => {
 
const roleTyped = role as "admin" | "super admin" | "payee" | "payer";

const adminRoles = ['admin'];
const isAdmin = adminRoles.includes(role);


const targetTable = isAdmin ? admins : users;


const [existingUser] = await db
  .select()
  .from(targetTable)
  .where(eq(targetTable.email, email))
  .limit(1);

if (existingUser) {
  throw new AppError(409, "User already exists");
}

const hashedPassword = await bcrypt.hash(password, 10);


const [newUser] = await db
  .insert(targetTable)
  .values({
    name,
    email,
    role: roleTyped,
    password: hashedPassword,
  })
  .returning({
    id: targetTable.id,
    name: targetTable.name,
    email: targetTable.email,
    role: targetTable.role,
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

  if(!user?.isActive){
    throw new AppError(403,"Your account has been suspended")
  }

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
    token: token,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  console.log("Refresh token created for: ", userId);
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
  const getSignablePayload = (payload: JwtPayload) => {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  };
  const newRefreshToken = generateRefreshToken(getSignablePayload(payload));
  const newAccessToken = generateToken(getSignablePayload(payload));

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

export const saveUserRefreshToken = async (token: string, userId: string) => {
  if (!token || !userId) {
    throw new AppError(400, "Missing Required fields");
  }
  await db.insert(refreshTokens).values({
    userId: userId,
    token: token,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });
  console.log("Refresh token created for: ", userId);
};