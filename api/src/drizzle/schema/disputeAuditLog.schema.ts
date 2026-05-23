import { pgEnum, pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { dispute } from "./dispute.schema";
import { users } from "./user.schema";
import { admins } from "./admin.schema";

export const auditAction = pgEnum("audit_action", [
  "dispute_created",
  "evidence_uploaded",
  "evidence_viewed",
  "status_changed",
  "admin_assigned",
  "admin_ruling",
  "auto_resolved",
  "offer_submitted",
  "offer_accepted",
  "offer_rejected",
  "negotiation_started",
  "mediation_started",
  "mediation_proposed",
  "mediation_accepted",
  "arbitration_initiated",
  "arbitration_ruling",
  "appeal_filed",
  "appeal_expired",
  "seller_suspended",
  "seller_unsuspended",
  "timer_missed",
  "escalated",
  "funds_refunded",
  "funds_released",
  "funds_split",
  "dispute_closed",
  "note_added",
  "ai_triage",
  "ai_suggestion",
]);

export const disputeAuditLog = pgTable("dispute_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  dispute_id: uuid("dispute_id").notNull().references(() => dispute.id),
  action: auditAction("action").notNull(),
  actor_type: text("actor_type").notNull(),
  actor_id: uuid("actor_id").references(()=> users.id),
  admin_id: uuid("admin_id").references(() => admins.id),
  previous_value: text("previous_value"),
  new_value: text("new_value"),
  details: jsonb("details"),
  ip_address: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
