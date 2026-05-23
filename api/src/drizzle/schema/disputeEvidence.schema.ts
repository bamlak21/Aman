import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { dispute } from "./dispute.schema";
import { users } from "./user.schema";

export const evidenceType = pgEnum("evidence_type", [
  "receipt",
  "shipping_proof",
  "screenshot",
  "message_log",
  "inspection_report",
  "contract",
  "other",
]);

export const disputeEvidence = pgTable("dispute_evidence", {
  id: uuid("id").primaryKey().defaultRandom(),
  dispute_id: uuid("dispute_id").notNull().references(() => dispute.id),
  uploaded_by: uuid("uploaded_by").notNull().references(() => users.id),
  type: evidenceType("type").default("other"),
  evidence_url: text("evidence_url").array(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
