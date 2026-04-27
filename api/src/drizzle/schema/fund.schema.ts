import { bigint, boolean, timestamp } from "drizzle-orm/pg-core"
import { uuid } from "drizzle-orm/pg-core"
import { pgTable } from "drizzle-orm/pg-core"
import { escrow } from "./escrow.schema"
import { users } from "./user.schema"



export const fund = pgTable("escrow_fund",{
  escrowId: uuid("escrow_id").notNull().references(() => escrow.id),
  tx_ref: uuid("tx_ref").primaryKey().defaultRandom(),
  userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", {withTimezone:true}).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", {withTimezone:true}).defaultNow().notNull(),
  isFunded: boolean("is_funded").default(false).notNull(),
})