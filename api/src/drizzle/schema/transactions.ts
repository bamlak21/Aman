import { bigint, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { escrow } from "./escrow.schema";
import { users } from "./user.schema";

export const txnTypes = pgEnum("txn_types", [
  "deposit",
  "release",
  "refund",
  "fee",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  escrowId: uuid("escrow_id").references(() => escrow.id),
  type: txnTypes("type").notNull(),
  amountCents: bigint("amount_cents", { mode: "number" }),
  fromAccount: uuid("from_account").references(() => users.id),
  toAccount: uuid("to_account").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
