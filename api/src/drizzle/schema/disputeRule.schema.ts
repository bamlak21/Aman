import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const ruleTrigger = pgEnum("rule_trigger", [
  "on_create",
  "on_timer_miss",
  "on_evidence_submit",
  "on_escalation",
]);

export const ruleAction = pgEnum("rule_action", [
  "auto_refund_buyer",
  "auto_release_seller",
  "assign_admin",
  "escalate_to_senior",
  "suspend_seller",
  "start_negotiation",
  "flag_for_review",
  "send_notification",
]);

export const disputeRule = pgTable("dispute_rule", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  trigger: ruleTrigger("trigger").notNull(),
  action: ruleAction("action").notNull(),
  conditions: jsonb("conditions"),
  priority: integer("priority").default(0),
  is_active: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
