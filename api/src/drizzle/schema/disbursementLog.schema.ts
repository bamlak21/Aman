import { bigint, jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { dispute } from "./dispute.schema";
import { escrow } from "./escrow.schema";
import { users } from "./user.schema";

export const disbursementType = pgEnum("disbursement_type", [
  "refund",
  "release",
  "split",
  "fee",
  "arbitration_fee",
]);

export const disbursementStatus = pgEnum("disbursement_status", [
  "recorded",
  "settled",
]);

export const disbursementLog = pgTable("disbursement_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  dispute_id: uuid("dispute_id").notNull().references(() => dispute.id),
  escrow_id: uuid("escrow_id").notNull().references(() => escrow.id),
  from_user_id: uuid("from_user_id").references(() => users.id),
  to_user_id: uuid("to_user_id").references(() => users.id),
  amount_cents: bigint("amount_cents", { mode: "number" }).notNull(),
  type: disbursementType("type").notNull(),
  status: disbursementStatus("status").default("recorded"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  settled_at: timestamp("settled_at", { withTimezone: true }),
});
