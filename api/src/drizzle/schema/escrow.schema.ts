import { pgEnum, pgTable, uuid, timestamp, bigint } from "drizzle-orm/pg-core";

export const escrowStatus = pgEnum("escrow_status", [
  "created",
  "funded",
  "released",
  "disputed",
  "cancelled",
  "expired",
]);

export const conditions = pgEnum("conditions", [
  "manual",
  "auto_after_date",
  "milestone",
]);

export const escrow = pgTable("escrow", {
  id: uuid("id").primaryKey().defaultRandom(),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  status: escrowStatus("status").default("created").notNull(),
  releaseCondition: conditions("release_conditions").default("manual"),
  expiresAt: timestamp("expires_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
