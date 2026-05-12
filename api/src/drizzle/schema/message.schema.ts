
import { uuid } from "drizzle-orm/pg-core"
import { varchar } from "drizzle-orm/pg-core"
import { pgTable } from "drizzle-orm/pg-core"
import { chatroom } from "./chatroom.schema"

export const message = pgTable("message",{
id:uuid("id").primaryKey().defaultRandom(),
participants:uuid("participantsId").notNull().references(()=> chatroom.id),
message:varchar("message",{length:1000}).notNull(),

})