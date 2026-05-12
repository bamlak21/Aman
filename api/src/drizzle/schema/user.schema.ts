import { boolean } from "drizzle-orm/pg-core";
import { varchar, uuid, timestamp, pgTable, pgEnum } from "drizzle-orm/pg-core";

export const userEnum = pgEnum("user_role", ["payee", "payer"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password").notNull(),
  role: userEnum("user_role").default("payee").notNull(),
  isActive:boolean("isActive").default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
