import { integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { escrow } from "./escrow.schema";
import { admins } from "./admin.schema";

export const disputeStatus = pgEnum("dispute_status", [
  "Pending",
  "Triaging",
  "AutoResolved",
  "InNegotiation",
  "UnderReview",
  "InMediation",
  "InArbitration",
  "Resolved",
  "Closed",
]);

export const disputeSeverity = pgEnum("dispute_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const disputeType = pgEnum("dispute_type", [
  "non_delivery",
  "quality_issue",
  "fraud",
  "breach_of_terms",
  "other",
]);

export const disputeResolution = pgEnum("dispute_resolution", [
  "refund_payer",
  "release_payee",
  "split",
  "cancel",
  "auto_refund",
  "auto_release",
  "admin_ruling",
  "mediation_settlement",
  "arbitration_ruling",
]);

export const dispute = pgTable("dispute", {
  id: uuid("id").primaryKey().defaultRandom(),
  escrow_id: uuid("escrow_id").notNull().references(() => escrow.id),
  reporter_id: uuid("reporter_id").notNull().references(() => users.id),
  reported_id: uuid("reported_id").notNull().references(() => users.id),
  dispute_type: disputeType("dispute_type").default("other"),
  // severity: disputeSeverity("severity").default('low'),
  resolution: disputeResolution("resolution"),
  status: disputeStatus("dispute_status").default("Pending"),
  reason: text("reason"),
  // evidence_url: text("evidence_url").array(),
  assigned_admin_id: uuid("assigned_admin_id").references(() => admins.id),
  // resolved_by_id: uuid("resolved_by_id").references(() => users.id),
  resolution_notes: text("resolution_notes"),
  claim_amount_cents: integer("claim_amount_cents"),
  escrow_balance_at_triage: integer("escrow_balance_at_triage"),
  // seller_suspended: boolean("seller_suspended").default(false),
  auto_resolve_rule: text("auto_resolve_rule"),
  respond_by_payer: timestamp("respond_by_payer", { withTimezone: true }),
  respond_by_payee: timestamp("respond_by_payee", { withTimezone: true }),
  negotiation_deadline: timestamp("negotiation_deadline", { withTimezone: true }),
  arbitration_deadline: timestamp("arbitration_deadline", { withTimezone: true }),
  ai_severity_analysis: disputeSeverity("ai_severity_analysis").default('low'),
  ai_suggested_path: text("ai_suggested_path"),
  ai_confidence: integer("ai_confidence"),
  ai_reasoning: text("ai_reasoning"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
