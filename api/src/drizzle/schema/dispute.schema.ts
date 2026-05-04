
import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { pgEnum } from "drizzle-orm/pg-core";
import { text } from "drizzle-orm/pg-core";
import { escrow } from "./escrow.schema";
import { timestamp } from "drizzle-orm/pg-core";


export const disputeStatus= pgEnum('dispute_status',[
"Pending",
"Negotiating",
"Resolved"
])

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
]);


export const dispute =pgTable('dispute',{
  id:uuid('id').primaryKey().defaultRandom(),
  escrow_id:uuid('escrow_id').notNull().references(()=>escrow.id),
  reporter_id:uuid('reporter_id').notNull().references(()=>users.id),
  reported_id:uuid('reported_id').notNull().references(()=>users.id),
  dispute_type:disputeType('dispute_type').default('other'),
  resolution: disputeResolution("resolution"),
  status:disputeStatus('dispute_status').default('Pending'),
  reason:text('reason'),
  evidence_url:text('evidence_url').array(),
  createdAt:timestamp('created_at',{withTimezone:true}).defaultNow().notNull(),
  updatedAt:timestamp('updated_at',{withTimezone:true}).defaultNow().notNull()

})