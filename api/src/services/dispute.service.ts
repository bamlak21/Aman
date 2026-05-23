import { and, eq, ne } from "drizzle-orm";
import { db } from "../config/db";
import { dispute, escrow, notification } from "../drizzle/schema";
import { chatroom } from "../drizzle/schema/chatroom.schema";
import { disputeEvidence } from "../drizzle/schema/disputeEvidence.schema";
import { AppError } from "../utils/AppError";
import { analyzeDisputeWithAI } from "./ai.service";

type disputeData ={
    escrow_id:string
    reporter_id:string,
    reported_id:string,
    dispute_type:"non_delivery"|"quality_issue"|"fraud"|"breach_of_terms"|"other",
    reason:string,
    evidence_url:string[]
}

export const createDispute = async(input:disputeData) =>{
 const {escrow_id,reported_id,reporter_id,dispute_type,reason,evidence_url}=input;

 if(reported_id===reporter_id){
  throw new AppError(400,"reporter can report itself")
 }
 if(!escrow_id){
    throw new AppError(400,"escrow not found")
 }
 const escrowStatus = await db.select().from(escrow).
 where(and
  (eq(escrow.id,escrow_id),
  eq(escrow.status,'released')
  ))
 if(escrowStatus.length>0)
 {
  throw new AppError(409,'escrow contract already closed');
 }

 const existingDispute= await db.select().from(dispute)
 .where(
  and(
    eq(dispute.escrow_id,escrow_id),
    eq(dispute.reporter_id,reporter_id),
    eq(dispute.reason,reason),
    ne(dispute.status,"Resolved"),

  )
 )

  if(existingDispute.length>0){
   throw new AppError(400,"An active dispute already exists for this escrow")
  }

  const createdDispute = await db.transaction(async(tx)=>{
    const negotaitionDate = new Date(Date.now()+1209600000)
    const arbitrationDate = new Date(Date.now()+5184000000)
    const [newDispute] = await tx
          .insert(dispute)
          .values({
            escrow_id,
            reported_id,
            reporter_id,
            reason,
            dispute_type,
            negotiation_deadline:negotaitionDate,
            arbitration_deadline:arbitrationDate
          })
          .returning();

    await tx.update(escrow).set({ status: "disputed" ,updatedAt: new Date()}).where(eq(escrow.id, escrow_id));

    if (evidence_url && evidence_url.length > 0) {
      await tx.insert(disputeEvidence).values(
        evidence_url.map((url) => ({
          dispute_id: newDispute.id,
          uploaded_by: reporter_id,
          evidence_url: [url],
        }))
      );
    }

    await tx
      .insert(chatroom)
      .values({
        disputeId: newDispute.id,
      });

    await tx
     .insert(notification)
     .values({
       dispute_id:newDispute.id,
       escrow_id:newDispute.escrow_id,
       text:`the payer raised dispute with the id ${newDispute.escrow_id} and reason of ${newDispute.dispute_type}`,
       user_id:newDispute.reported_id,
       isRead:false,
       type:newDispute.dispute_type!
      }).returning()


    return newDispute;
  });

  // Trigger AI analysis asynchronously
  analyzeDisputeWithAI(createdDispute.id).catch(console.error);

  return createdDispute;
}