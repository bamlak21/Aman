import { and, eq, ilike, ne } from "drizzle-orm";
import { db } from "../config/db";
import { users } from "../drizzle/schema";

export const searchByEmail = async (email: string, userId: string) => {
  return await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(and(ilike(users.email, email), ne(users.id, userId)))
    .limit(4);
};

export const findUserByEmail = async (email: string) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.email, email));
  return user || null;
};
