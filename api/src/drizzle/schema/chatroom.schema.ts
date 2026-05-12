import { uuid } from "drizzle-orm/pg-core";
import { pgTable } from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { admins } from "./admin.schema";
import { dispute } from "./dispute.schema";

export const chatroom = pgTable("chat-room",{
  id:uuid("id").primaryKey().defaultRandom(),
  disputeId:uuid("disputeId").notNull().references(()=>dispute.id),
  senderId:uuid("senderId").notNull().references(()=>users.id),
  recieverId:uuid("recieverId").notNull().references(()=>users.id),
  adminId:uuid("adminId").notNull().references(()=>admins.id),
});