import { boolean } from "drizzle-orm/pg-core";
import { text } from "drizzle-orm/pg-core";
import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { timestamp } from "drizzle-orm/pg-core";
import { dispute } from "./dispute.schema";
import { pgEnum } from "drizzle-orm/pg-core";
import { escrow } from "./escrow.schema";

export const notifType = pgEnum('notification_type',[
  "non_delivery",
  "quality_issue",
  "fraud",
  "breach_of_terms",
  "other",
  "release-fund",
]) 
export const notification = pgTable('notification',{
  id: uuid('id').notNull().primaryKey().defaultRandom(),
  escrow_id:uuid("escrow_id").references(()=>escrow.id),
  dispute_id:uuid('dispute_id').references(()=>dispute.id),
  user_id:uuid('user_id').references(()=>users.id),
  isRead:boolean('isRead').default(false),
  text:text('text').notNull(),
  type:notifType("notification_type").notNull(),
  createdAt:timestamp('createdAt',{withTimezone:true}).defaultNow().notNull()

})