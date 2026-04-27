import { pgTable, uuid } from "drizzle-orm/pg-core";
import { escrow } from "./escrow.schema";
import { userEnum, users } from "./user.schema";

export const escrowParties = pgTable("escrow_parties", {
  id: uuid("id").primaryKey().defaultRandom(),
  escrowId: uuid("escrow_id")
    .notNull()
    .references(() => escrow.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  role: userEnum("role").default("payee").notNull(),
});
