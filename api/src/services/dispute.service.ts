import { and, eq, ne } from "drizzle-orm";
import { db } from "../config/db";
import { dispute, escrow } from "../drizzle/schema";
import { AppError } from "../utils/AppError";

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

 const existingDispute= await db.select().from(dispute)
 .where(
  and(
    eq(dispute.escrow_id,escrow_id),
    eq(dispute.reporter_id,reporter_id),
    ne(dispute.status,"Resolved")
  )
 )

  if(existingDispute.length>0){
   throw new AppError(400,"An active dispute already exists for this escrow")
  }

  return await db.transaction(async(tx)=>{
    const [newDispute] = await tx
          .insert(dispute)
          .values({
            escrow_id,
            reported_id,
            reporter_id,
            reason,
            dispute_type,
            evidence_url
          })
          .returning();

    await tx.update(escrow).set({ status: "disputed" }).where(eq(escrow.id, escrow_id));

    return newDispute;
  })

}