import { varchar, uuid, timestamp, pgTable, pgEnum } from "drizzle-orm/pg-core";

export const adminEnum = pgEnum("role", ["admin"]);

export const admins = pgTable("admin", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password").notNull(),
  role: adminEnum("role").default("admin").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
