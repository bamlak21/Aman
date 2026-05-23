import axios from "axios";
import { db } from "../config/db";
import { dispute, disputeAuditLog } from "../drizzle/schema";
import { config } from "../config";
import { eq } from "drizzle-orm";

export const analyzeDisputeWithAI = async (disputeId: string) => {
  try {
    const dis = await db.query.dispute.findFirst({
      where: eq(dispute.id, disputeId),
    });

    if (!dis) {
      console.error(`AI Analysis Error: Dispute ${disputeId} not found`);
      return;
    }

    const prompt = `You are an expert dispute mediator for an escrow platform.
Please analyze the following dispute and provide a JSON response containing strictly these keys:
- "ai_severity_score": an integer from 1 to 10 (10 being most severe).
- "ai_suggested_path": a brief recommendation on how to resolve it.
- "ai_confidence": an integer from 1 to 100 representing your confidence.
- "ai_reasoning": a brief explanation of your reasoning.

Dispute Details:
Type: ${dis.dispute_type}
Reason given by reporter: ${dis.reason}
Claim Amount Cents: ${dis.claim_amount_cents || "Unknown"}
`;

    const response = await axios.post(config.localAiUrl, {
      model: "ibm/granite4.1:3b", // Assuming a generic local model, configurable if needed
      prompt: prompt,
      stream: false,
      format: "json",
    });

    const aiResponseText = response.data.response;
    const parsed = JSON.parse(aiResponseText);

    await db.update(dispute).set({
      ai_severity_analysis: parsed.ai_severity_analysis || null,
      ai_suggested_path: parsed.ai_suggested_path || null,
      ai_confidence: parsed.ai_confidence || null,
      ai_reasoning: parsed.ai_reasoning || null,
    }).where(eq(dispute.id, disputeId));

    // Log the AI action
    await db.insert(disputeAuditLog).values({
      dispute_id: disputeId,
      action: "ai_triage",
      actor_type: "system",
      details: parsed,
    });

    console.log(`Successfully completed AI analysis for dispute ${disputeId}`);
  } catch (error) {
    console.error(`AI Analysis Failed for dispute ${disputeId}:`, error);
  }
};
