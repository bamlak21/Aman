import { bigint, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const platformBalance = pgTable("platform_balance", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id").notNull().unique().references(() => users.id),
  balance_cents: bigint("balance_cents", { mode: "number" }).notNull().default(0),
  locked_cents: bigint("locked_cents", { mode: "number" }).notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
