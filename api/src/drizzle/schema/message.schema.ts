import { uuid } from "drizzle-orm/pg-core";
import { varchar } from "drizzle-orm/pg-core";
import { pgTable, timestamp } from "drizzle-orm/pg-core";
import { chatroom } from "./chatroom.schema";

export const message = pgTable("message", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatroomId: uuid("chatroom_id")
    .notNull()
    .references(() => chatroom.id),
  senderId: uuid("sender_id").notNull(),
  senderRole: varchar("sender_role", { length: 20 }).notNull(),
  message: varchar("message", { length: 1000 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
