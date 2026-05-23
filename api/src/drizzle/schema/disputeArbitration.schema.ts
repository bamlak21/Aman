import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { dispute } from "./dispute.schema";
import { admins } from "./admin.schema";

export const arbitrationStatus = pgEnum("arbitration_status", [
  "pending_fees",
  "in_review",
  "ruled",
  "appealed",
  "enforced",
]);

export const arbitrationOutcome = pgEnum("arbitration_outcome", [
  "buyer_wins",
  "seller_wins",
  "split",
]);

export const disputeArbitration = pgTable("dispute_arbitration", {
  id: uuid("id").primaryKey().defaultRandom(),
  dispute_id: uuid("dispute_id").notNull().unique().references(() => dispute.id),
  arbitrator_id: uuid("arbitrator_id").references(() => admins.id),
  status: arbitrationStatus("status").default("pending_fees"),
  outcome: arbitrationOutcome("outcome"),
  buyer_fee_cents: integer("buyer_fee_cents").default(0),
  seller_fee_cents: integer("seller_fee_cents").default(0),
  split_ratio_buyer: integer("split_ratio_buyer"),
  ruling_summary: text("ruling_summary"),
  ruling_details: text("ruling_details"),
  appeal_deadline: timestamp("appeal_deadline", { withTimezone: true }),
  appealed_by: uuid("appealed_by"),
  appeal_fee_cents: integer("appeal_fee_cents").default(0),
  appeal_ruling: text("appeal_ruling"),
  enforced: boolean("enforced").default(false),
  enforced_at: timestamp("enforced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
