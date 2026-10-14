import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../config/db";
import bcrypt from "bcrypt";
import { AppError } from "../utils/AppError";
import { refreshTokens } from "../drizzle/schema/refreshToken.schema";
import { JwtPayload } from "../types/auth";
import { generateRefreshToken, generateToken } from "../utils/jwt";
import { Admin } from "../types/admin";
import { admins} from "../drizzle/schema/admin.schema";
import { dispute } from "../drizzle/schema/dispute.schema";
import { disputeEvidence } from "../drizzle/schema/disputeEvidence.schema";
import { escrow, escrowParties, notification, users } from "../drizzle/schema";
import { transactions } from "../drizzle/schema/transactions.schema";
import { disputeOffer } from "../drizzle/schema/disputeOffer.schema";
import { disputeAuditLog } from "../drizzle/schema/disputeAuditLog.schema";
import { applyDisputeResolution, insertDisputeEventMessage, OFFER_TTL_MS } from "./dispute.service";




export const authenticateAdmin = async (
  email: string,
  password: string,
): Promise<Admin> => {
  const user = await db.query.admins.findFirst({
    where: eq(admins.email, email),
  });

  if (!user) {
    throw new AppError(401, "prohibited for other users");
  }
  

  const isMatch = await bcrypt.compare(password, user.password);

  if (isMatch)
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  else throw new AppError(401, "Invalid Credentials");
};

export const saveRefreshToken = async (token: string, adminId: string) => {
  if (!token || !adminId) {
    throw new AppError(400, "Missing Required fields");
  }
  await db.insert(refreshTokens).values({
    adminId: adminId,
    token: token,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  console.log("Refresh token created for: ", adminId);
};

export const renewToken = async (token: string, payload: JwtPayload) => {
  const storedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
  });

  if (!storedToken || storedToken.revoked) {
    throw new AppError(403, "Token malformed");
  }

  await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.id, storedToken.id));
  const getSignablePayload = (payload: JwtPayload) => {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  };
  const newRefreshToken = generateRefreshToken(getSignablePayload(payload));
  const newAccessToken = generateToken(getSignablePayload(payload));

  await db.insert(refreshTokens).values({
    adminId: payload.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const getAdminById = async (id: string): Promise<Admin> => {
  const adminUser = await db.query.admins.findFirst({
    where: eq(admins.id, id),
  });

  if (!adminUser) {
    throw new AppError(404, "Admin not found");
  }

  return {
    id: adminUser.id,
    name: adminUser.name,
    email: adminUser.email,
    role: adminUser.role,
  };
};

export const revokeToken = async (token: string) => {
  const t = await db
    .update(refreshTokens)
    .set({ revoked: true })
    .where(eq(refreshTokens.token, token))
    .returning();

  return t;
};

export const getAllUsers = async () => {
  return await db.query.users.findMany({
    columns: {
      password: false,
    },
    limit: 12,
  });
};

export const fetchAllDispute = async () => {
  
  const disputes = await db.query.dispute.findMany();
  const nameIds = [...new Set([...disputes.flatMap((p) => [p.reported_id,p.reporter_id])])]
  const names = await db.select({
    id: users.id, name: users.name
  }).from(users).where(inArray(users.id, nameIds))
  
  const byId = new Map(names.map((u)=>[u.id ,u.name]))
  const ids = disputes.map((d) => d.id);

  const [evidence, offers] = await Promise.all([
    ids.length
      ? db.query.disputeEvidence.findMany({ where: inArray(disputeEvidence.dispute_id, ids) })
      : [],
    ids.length
      ? db.query.disputeOffer.findMany({ where: inArray(disputeOffer.dispute_id, ids) })
      : [],
  ]);

  const evidenceByDispute = new Map<string, typeof evidence>();
  for (const e of evidence) {
    const list = evidenceByDispute.get(e.dispute_id) ?? [];
    list.push(e);
    evidenceByDispute.set(e.dispute_id, list);
  }

  const offersByDispute = new Map<string, typeof offers>();
  for (const o of offers) {
    const list = offersByDispute.get(o.dispute_id) ?? [];
    list.push(o);
    offersByDispute.set(o.dispute_id, list);
  }

  return disputes.map((d) => ({
    ...d,
    reporter_name:byId.get(d.reporter_id)?? null,
    reported_name:byId.get(d.reported_id)?? null,
    evidence: evidenceByDispute.get(d.id) ?? [],
    offers: offersByDispute.get(d.id) ?? [],
  
  }));
}

export const resolveDisputeService = async (
  disputeId: string,
  resolution: string,
  options: { note?: string; force?: boolean; adminId?: string } = {},
) => {
  const { note, force = false, adminId } = options;

  if (resolution === "refund_payer") {
    if (!force) {
      return await db.transaction(async (tx) => {
        const dis = await tx.query.dispute.findFirst({ where: eq(dispute.id, disputeId) });
        if (!dis) throw new AppError(404, "Dispute not found");
        if (dis.status === "Resolved" || dis.status === "Closed") {
          throw new AppError(400, "Dispute is already resolved");
        }
        const esc = await tx.query.escrow.findFirst({ where: eq(escrow.id, dis.escrow_id) });
        if (!esc) throw new AppError(404, "Escrow not found");
        const parties = await tx
          .select()
          .from(escrowParties)
          .where(eq(escrowParties.escrowId, esc.id));
        const payer = parties.find((p) => p.role === "payer");
        const payee = parties.find((p) => p.role === "payee");
        if (!payer) throw new AppError(500, "Escrow payer not found");

        await tx
          .update(disputeOffer)
          .set({ status: "superseded" })
          .where(and(eq(disputeOffer.dispute_id, disputeId), eq(disputeOffer.status, "pending")));

        const [offer] = await tx
          .insert(disputeOffer)
          .values({
            dispute_id: disputeId,
            offered_by: payer.userId,
            amount_cents: esc.amountCents,
            terms: note ?? "Full refund proposed by admin",
            status: "pending",
            is_counter_offer: false,
            expires_at: new Date(Date.now() + OFFER_TTL_MS),
          })
          .returning();

        await tx
          .update(dispute)
          .set({ status: "InNegotiation", resolution: "refund_payer", updatedAt: new Date() })
          .where(eq(dispute.id, disputeId));

        await insertDisputeEventMessage(
          tx,
          disputeId,
          `An admin proposed a full refund of ${(esc.amountCents / 100).toFixed(2)} ETB. Please respond to the offer.`,
        );

        if (payee?.userId) {
          await tx.insert(notification).values({
            user_id: payee.userId,
            text: `Refund Proposed. An admin proposed a full refund of ${(esc.amountCents / 100).toFixed(2)} ETB. Please respond to the offer.`,
            type: "offer",
          });
        }
        if (payer.userId) {
          await tx.insert(notification).values({
            user_id: payer.userId,
            text: "Refund Proposed. An admin proposed a full refund for your dispute. Awaiting the other party's response.",
            type: "offer",
          });
        }

        await tx.insert(disputeAuditLog).values({
          dispute_id: disputeId,
          action: "negotiation_started",
          actor_type: "admin",
          admin_id: adminId ?? null,
          new_value: "InNegotiation",
          details: { offer_id: offer.id, amount_cents: esc.amountCents },
        });

        return { disputeId, status: "InNegotiation", proposalCreated: true, offer };
      });
    }

    return applyDisputeResolution({
      disputeId,
      resolution: "refund_payer",
      note: note ?? "Forced refund by admin ruling",
      actorType: "admin",
      adminId: adminId ?? null,
    });
  }

  return applyDisputeResolution({
    disputeId,
    resolution: resolution as any,
    note,
    actorType: "admin",
    adminId: adminId ?? null,
  });
};

const DISPUTE_STATUS_TRANSITIONS: Record<string, string[]> = {
  Pending: ["Triaging", "UnderReview", "InNegotiation", "Closed"],
  Triaging: ["UnderReview", "InMediation", "InArbitration", "InNegotiation", "Closed"],
  UnderReview: ["InMediation", "InArbitration", "InNegotiation", "Closed"],
  InNegotiation: ["UnderReview", "InMediation", "InArbitration", "Closed"],
  InMediation: ["InArbitration", "UnderReview", "Closed"],
  InArbitration: ["UnderReview", "Closed"],
  AutoResolved: ["Closed"],
  Resolved: [],
  Closed: [],
};

export const updateDisputeStatusService = async (disputeId: string, status: string, adminId?: string) => {
  return await db.transaction(async (tx) => {
    const dis = await tx.query.dispute.findFirst({ where: eq(dispute.id, disputeId) });
    if (!dis) throw new AppError(404, "Dispute not found");

    const from = dis.status ?? "Pending";
    if (from === status) throw new AppError(400, "Dispute is already in this status");
    const allowed = DISPUTE_STATUS_TRANSITIONS[from] ?? [];
    if (!allowed.includes(status)) {
      throw new AppError(400, `Cannot move dispute from ${from} to ${status}`);
    }

    const [updated] = await tx
      .update(dispute)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(dispute.id, disputeId))
      .returning();

    await tx.insert(disputeAuditLog).values({
      dispute_id: disputeId,
      action: "status_changed",
      actor_type: "admin",
      admin_id: adminId ?? null,
      previous_value: from,
      new_value: status,
    });

    return updated;
  });
}

export const fetchAllTransactionsService = async()=>{
  const allEscrows = await db.select().from(escrow);

  const results = [];

  for (const esc of allEscrows) {
    const parties = await db
      .select({
        userId: escrowParties.userId,
        role: escrowParties.role,
        name: users.name,
        email: users.email,
      })
      .from(escrowParties)
      .innerJoin(users, eq(users.id, escrowParties.userId))
      .where(eq(escrowParties.escrowId, esc.id));

    const payer = parties.find((p) => p.role === "payer");
    const payee = parties.find((p) => p.role === "payee");

    results.push({
      id: esc.id,
      amountCents: esc.amountCents,
      status: esc.status,
      releaseCondition: esc.releaseCondition,
      expiresAt: esc.expiresAt,
      milestoneDetails: esc.milestoneDetails,
      txRef: esc.txRef,
      paidAt: esc.paidAt,
      createdAt: esc.createdAt,
      updatedAt: esc.updatedAt,
      payerName: payer?.name || null,
      payerEmail: payer?.email || null,
      payeeName: payee?.name || null,
      payeeEmail: payee?.email || null,
    });
  }

  return results;
}

export const getPlatformStats = async () => {
  const [feeStats] = await db
    .select({
      totalFeesCents: sql<number>`COALESCE(SUM(${transactions.amountCents}), 0)`,
      feeCount: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(eq(transactions.type, "fee"));

  const [escrowStats] = await db
    .select({
      totalEscrows: sql<number>`COUNT(*)`,
      totalVolumeCents: sql<number>`COALESCE(SUM(${escrow.amountCents}), 0)`,
    })
    .from(escrow);

  return {
    totalFeesCents: Number(feeStats?.totalFeesCents ?? 0),
    feeCount: Number(feeStats?.feeCount ?? 0),
    totalEscrows: Number(escrowStats?.totalEscrows ?? 0),
    totalVolumeCents: Number(escrowStats?.totalVolumeCents ?? 0),
  };
}
export const revokeUserAccess = async(userId:string,isActive:boolean)=>{

  const [update] = await db.update(users)
  .set({isActive:isActive, updatedAt: new Date()})
  .where(eq(users.id,userId))
  .returning()

  if(!update){
   throw new AppError(404,"Not Found");

  }
  const suspendedUser = await db.select().from(users).where(and(eq(users.id,userId),eq(users.isActive,true)))
  
  if(suspendedUser){
    throw new AppError(404,"User already suspended");
  }
  return update;
}