import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { dispute } from "./dispute.schema";
import { users } from "./user.schema";

export const offerStatus = pgEnum("offer_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
  "superseded",
]);

export const disputeOffer = pgTable("dispute_offer", {
  id: uuid("id").primaryKey().defaultRandom(),
  dispute_id: uuid("dispute_id").notNull().references(() => dispute.id),
  offered_by: uuid("offered_by").notNull().references(() => users.id),
  amount_cents: integer("amount_cents").notNull(),
  terms: text("terms"),
  status: offerStatus("status").default("pending"),
  is_counter_offer: boolean("is_counter_offer").default(false),
  parent_offer_id: uuid("parent_offer_id"),
  responded_at: timestamp("responded_at", { withTimezone: true }),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
