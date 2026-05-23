import { uuid } from "drizzle-orm/pg-core";
import { pgTable, timestamp } from "drizzle-orm/pg-core";
import { dispute } from "./dispute.schema";

export const chatroom = pgTable("chat_room", {
  id: uuid("id").primaryKey().defaultRandom(),
  disputeId: uuid("dispute_id")
    .notNull()
    .unique()
    .references(() => dispute.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
