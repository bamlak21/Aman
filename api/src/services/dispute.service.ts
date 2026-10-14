import { and, desc, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "../config/db";
import { dispute, escrow, escrowParties, notification, users } from "../drizzle/schema";
import {
  assertEscrowIsLocked,
  releaseEscrowPrincipal,
} from "./wallet.service";
import { chatroom } from "../drizzle/schema/chatroom.schema";
import { message } from "../drizzle/schema/message.schema";
import { disputeEvidence } from "../drizzle/schema/disputeEvidence.schema";
import { transactions } from "../drizzle/schema/transactions.schema";
import { disputeOffer } from "../drizzle/schema/disputeOffer.schema";
import { disputeAuditLog } from "../drizzle/schema/disputeAuditLog.schema";
import { disbursementLog } from "../drizzle/schema/disbursementLog.schema";
import { AppError } from "../utils/AppError";
import { appFeeCents } from "../utils/fee";

export type DisputeResolution =
  | "refund_payer"
  | "release_payee"
  | "split"
  | "cancel"
  | "auto_refund"
  | "auto_release"
  | "admin_ruling"
  | "mediation_settlement"
  | "arbitration_ruling";

export const OFFER_TTL_MS = 72 * 60 * 60 * 1000;

const isAdminRole = (role?: string) => role === "admin" || role === "super admin";

export const insertDisputeEventMessage = async (tx: any, disputeId: string, text: string) => {
  try {
    const chat = await tx.query.chatroom.findFirst({
      where: eq(chatroom.disputeId, disputeId),
    });
    if (!chat) return;
    const [msg] = await tx
      .insert(message)
      .values({
        chatroomId: chat.id,
        senderId: disputeId,
        senderRole: "system",
        message: text,
      })
      .returning();
    try {
      const { getIO } = await import("../socket");
      getIO()
        .to(`dispute:${disputeId}`)
        .emit("new-message", {
          id: msg.id,
          senderId: msg.senderId,
          senderRole: "system",
          senderName: "System",
          message: msg.message,
          createdAt: msg.createdAt,
        });
    } catch {
      // Socket layer not initialized (e.g. tests); skip live emit.
    }
  } catch {
    // Best-effort: never fail the offer action because a chat event could not be written.
  }
};

type Party = {
  escrowId: string;
  userId: string;
  role: "payer" | "payee";
};

type DisbursementPlan = {
  txns: any[];
  logs: any[];
  notifs: { user_id?: string | null; title: string; message: string; type: any }[];
  fees: { user_id: string; amount_cents: number }[];
  credits: { user_id: string; amount_cents: number }[];
  escrowStatus: "released" | "cancelled";
};

const buildDisbursement = (
  esc: { id: string; amountCents: number },
  payer: Party | undefined,
  payee: Party | undefined,
  disputeId: string,
  resolution: DisputeResolution,
  refundAmountCents?: number,
): DisbursementPlan => {
  const txns: any[] = [];
  const logs: any[] = [];
  const notifs: DisbursementPlan["notifs"] = [];
  const fees: DisbursementPlan["fees"] = [];
  const fmt = (n: number) => (n / 100).toFixed(2);

  if (resolution === "cancel") {
    return {
      txns,
      logs,
      notifs,
      fees,
      credits: payer ? [{ user_id: payer.userId, amount_cents: esc.amountCents }] : [],
      escrowStatus: "cancelled",
    };
  }

  if (resolution === "release_payee") {
    txns.push({
      escrowId: esc.id,
      type: "release",
      amountCents: esc.amountCents,
      fromAccount: payer?.userId ?? null,
      toAccount: payee?.userId ?? null,
    });
    logs.push({
      dispute_id: disputeId,
      escrow_id: esc.id,
      from_user_id: payer?.userId ?? null,
      to_user_id: payee?.userId ?? null,
      amount_cents: esc.amountCents,
      type: "release",
    });
    notifs.push(
      {
        user_id: payee?.userId,
        title: "Dispute Resolved — Funds Released",
        message: `The dispute was resolved in your favor. ${fmt(esc.amountCents)} ETB has been released to you.`,
        type: "release",
      },
      {
        user_id: payer?.userId,
        title: "Dispute Resolved",
        message: "The dispute was resolved by releasing the escrow funds to the payee.",
        type: "dispute",
      },
    );
    return {
      txns,
      logs,
      notifs,
      fees,
      credits: payee ? [{ user_id: payee.userId, amount_cents: esc.amountCents }] : [],
      escrowStatus: "released",
    };
  }

  const isFullRefund =
    resolution === "refund_payer" &&
    (refundAmountCents === undefined || refundAmountCents >= esc.amountCents);

  if (isFullRefund) {
    txns.push({
      escrowId: esc.id,
      type: "refund",
      amountCents: esc.amountCents,
      fromAccount: payee?.userId ?? null,
      toAccount: payer?.userId ?? null,
    });
    logs.push({
      dispute_id: disputeId,
      escrow_id: esc.id,
      from_user_id: payee?.userId ?? null,
      to_user_id: payer?.userId ?? null,
      amount_cents: esc.amountCents,
      type: "refund",
    });
    notifs.push(
      {
        user_id: payer?.userId,
        title: "Dispute Resolved — Refund",
        message: `The dispute was resolved in your favor. ${fmt(esc.amountCents)} ETB has been refunded to you.`,
        type: "refund",
      },
      {
        user_id: payee?.userId,
        title: "Dispute Resolved",
        message: "The dispute was resolved by refunding the escrow funds to the payer.",
        type: "dispute",
      },
    );
    return {
      txns,
      logs,
      notifs,
      fees,
      credits: payer ? [{ user_id: payer.userId, amount_cents: esc.amountCents }] : [],
      escrowStatus: "cancelled",
    };
  }

  const refundShare = resolution === "split" ? Math.floor(esc.amountCents / 2) : refundAmountCents!;
  const releaseShare = esc.amountCents - refundShare;
  const refundFee = appFeeCents(refundShare);
  const releaseFee = appFeeCents(releaseShare);

  if (payer && refundShare > 0) {
    txns.push(
      {
        escrowId: esc.id,
        type: "refund",
        amountCents: refundShare - refundFee,
        fromAccount: payee?.userId ?? null,
        toAccount: payer.userId,
      },
      { escrowId: esc.id, type: "fee", amountCents: refundFee, fromAccount: payer.userId, toAccount: null },
    );
    logs.push(
      {
        dispute_id: disputeId,
        escrow_id: esc.id,
        from_user_id: payee?.userId ?? null,
        to_user_id: payer.userId,
        amount_cents: refundShare - refundFee,
        type: "refund",
      },
      {
        dispute_id: disputeId,
        escrow_id: esc.id,
        from_user_id: payer.userId,
        to_user_id: null,
        amount_cents: refundFee,
        type: "fee",
      },
    );
    fees.push({ user_id: payer.userId, amount_cents: refundFee });
  }

  if (payee && releaseShare > 0) {
    txns.push(
      {
        escrowId: esc.id,
        type: "release",
        amountCents: releaseShare - releaseFee,
        fromAccount: payer?.userId ?? null,
        toAccount: payee.userId,
      },
      { escrowId: esc.id, type: "fee", amountCents: releaseFee, fromAccount: payee.userId, toAccount: null },
    );
    logs.push(
      {
        dispute_id: disputeId,
        escrow_id: esc.id,
        from_user_id: payer?.userId ?? null,
        to_user_id: payee.userId,
        amount_cents: releaseShare - releaseFee,
        type: "release",
      },
      {
        dispute_id: disputeId,
        escrow_id: esc.id,
        from_user_id: payee.userId,
        to_user_id: null,
        amount_cents: releaseFee,
        type: "fee",
      },
    );
    fees.push({ user_id: payee.userId, amount_cents: releaseFee });
  }

  notifs.push(
    {
      user_id: payer?.userId,
      title: "Dispute Resolved — Settlement",
      message: `The dispute was settled: ${fmt(refundShare)} ETB refunded to you (after fees).`,
      type: "refund",
    },
    {
      user_id: payee?.userId,
      title: "Dispute Resolved — Settlement",
      message: `The dispute was settled: ${fmt(releaseShare)} ETB released to you (after fees).`,
      type: "release",
    },
  );

  const credits: DisbursementPlan["credits"] = [];
  if (payer) credits.push({ user_id: payer.userId, amount_cents: refundShare - refundFee });
  if (payee) credits.push({ user_id: payee.userId, amount_cents: releaseShare - releaseFee });

  return { txns, logs, notifs, fees, credits, escrowStatus: "released" };
};

const logAudit = async (
  tx: any,
  input: {
    dispute_id: string;
    action: any;
    actor_type: string;
    actor_id?: string | null;
    admin_id?: string | null;
    previous_value?: string | null;
    new_value?: string | null;
    details?: Record<string, unknown>;
  },
) => {
  await tx.insert(disputeAuditLog).values({
    dispute_id: input.dispute_id,
    action: input.action,
    actor_type: input.actor_type,
    actor_id: input.actor_id ?? null,
    admin_id: input.admin_id ?? null,
    previous_value: input.previous_value ?? null,
    new_value: input.new_value ?? null,
    details: input.details,
  });
};

const getDisputeContext = async (tx: any, disputeId: string) => {
  const dis = await tx.query.dispute.findFirst({ where: eq(dispute.id, disputeId) });
  if (!dis) throw new AppError(404, "Dispute not found");
  const esc = await tx.query.escrow.findFirst({ where: eq(escrow.id, dis.escrow_id) });
  if (!esc) throw new AppError(404, "Escrow not found");
  const parties = (await tx.select().from(escrowParties).where(eq(escrowParties.escrowId, esc.id))) as {
    escrowId: string;
    userId: string;
    role: "payer" | "payee";
  }[];
  const payer = parties.find((p) => p.role === "payer");
  const payee = parties.find((p) => p.role === "payee");
  return { dis, esc, payer, payee };
};

const executeResolution = async (
  tx: any,
  input: {
    disputeId: string;
    resolution: DisputeResolution;
    refundAmountCents?: number;
    note?: string;
    actorType?: "admin" | "system" | "user";
    actorId?: string | null;
    adminId?: string | null;
  },
) => {
  const { dis, esc, payer, payee } = await getDisputeContext(tx, input.disputeId);

  if (dis.status === "Resolved" || dis.status === "Closed") {
    throw new AppError(400, "Dispute is already resolved");
  }
  if (esc.status === "released" || esc.status === "cancelled") {
    throw new AppError(400, "Escrow is already finalized");
  }

  const plan = buildDisbursement(esc, payer, payee, dis.id, input.resolution, input.refundAmountCents);

  for (const txn of plan.txns) await tx.insert(transactions).values(txn);
  for (const log of plan.logs) await tx.insert(disbursementLog).values(log);
  for (const notif of plan.notifs) {
    if (notif.user_id) {
      await tx.insert(notification).values({
        user_id: notif.user_id,
        text: `${notif.title}. ${notif.message}`,
        type: notif.type,
      });
    }
  }

  // Release the full principal from the payer's locked bucket exactly once, then
  // hand each share to whoever won it. The shares net to esc.amountCents because
  // the resolution fees are already deducted inside buildDisbursement.
  if (esc.status === "disputed" && payer) {
    const totalCredit = plan.credits.reduce((sum, c) => sum + c.amount_cents, 0);
    const totalFee = plan.fees.reduce((sum, f) => sum + f.amount_cents, 0);
    const principal = totalCredit + totalFee;

    if (principal !== esc.amountCents) {
      throw new AppError(500, "Resolution does not reconcile with the escrowed principal");
    }

    await releaseEscrowPrincipal(tx, payer.userId, principal, plan.credits);
  }

  await tx
    .update(escrow)
    .set({ status: plan.escrowStatus, updatedAt: new Date() })
    .where(eq(escrow.id, esc.id));

  await tx
    .update(dispute)
    .set({
      status: "Resolved",
      resolution: input.resolution,
      resolution_notes: input.note ?? null,
      resolved_at: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(dispute.id, dis.id));

  const action =
    input.resolution === "refund_payer"
      ? "funds_refunded"
      : input.resolution === "release_payee"
        ? "funds_released"
        : input.resolution === "split"
          ? "funds_split"
          : "admin_ruling";

  await logAudit(tx, {
    dispute_id: dis.id,
    action,
    actor_type: input.actorType ?? "admin",
    actor_id: input.actorId ?? null,
    admin_id: input.adminId ?? null,
    new_value: input.resolution,
    details: input.refundAmountCents ? { refund_amount_cents: input.refundAmountCents } : undefined,
  });

  return { disputeId: dis.id, status: "Resolved", resolution: input.resolution, escrowStatus: plan.escrowStatus };
};

export const applyDisputeResolution = (input: {
  disputeId: string;
  resolution: DisputeResolution;
  refundAmountCents?: number;
  note?: string;
  actorType?: "admin" | "system" | "user";
  actorId?: string | null;
  adminId?: string | null;
}) => db.transaction(async (tx) => executeResolution(tx, input));

type disputeData = {
  escrow_id: string;
  reporter_id: string;
  reported_id: string;
  dispute_type: "non_delivery" | "quality_issue" | "fraud" | "breach_of_terms" | "other";
  reason: string;
  evidence_url: string[];
};

export const createDispute = async (input: disputeData) => {
  const { escrow_id, reported_id, reporter_id, dispute_type, reason, evidence_url } = input;

  if (reported_id === reporter_id) {
    throw new AppError(400, "reporter can report itself");
  }
  if (!escrow_id) {
    throw new AppError(400, "escrow not found");
  }
  const [esc] = await db.select().from(escrow).where(eq(escrow.id, escrow_id));
  if (!esc) {
    throw new AppError(404, "Escrow not found");
  }
  if (esc.status === "released") {
    throw new AppError(409, "escrow contract already closed");
  }
  if (esc.status !== "funded") {
    throw new AppError(400, "Only funded escrows can be disputed");
  }

  const existingDispute = await db
    .select()
    .from(dispute)
    .where(
      and(
        eq(dispute.escrow_id, escrow_id),
        eq(dispute.reporter_id, reporter_id),
        eq(dispute.reason, reason),
        ne(dispute.status, "Resolved"),
      ),
    );

  if (existingDispute.length > 0) {
    throw new AppError(400, "An active dispute already exists for this escrow");
  }

  const createdDispute = await db.transaction(async (tx) => {
    const negotiationDate = new Date(Date.now() + 1209600000); // 14 days
    const arbitrationDate = new Date(Date.now() + 5184000000); // 60 days

    const [newDispute] = await tx
      .insert(dispute)
      .values({
        escrow_id,
        reporter_id,
        reported_id,
        dispute_type,
        reason,
        negotiation_deadline: negotiationDate,
        arbitration_deadline: arbitrationDate,
      })
      .returning();

    await tx.insert(chatroom).values({
      disputeId: newDispute.id,
    });

    await tx
      .update(escrow)
      .set({ status: "disputed", updatedAt: new Date() })
      .where(eq(escrow.id, escrow_id));

    // No wallet movement here. The principal was already moved into the payer's
    // locked bucket when the escrow was funded, and a dispute does not change
    // where the money sits — only who is entitled to it once it is resolved.
    const parties = await tx.select().from(escrowParties).where(eq(escrowParties.escrowId, escrow_id));
    const payer = parties.find((p) => p.role === "payer");
    if (payer) {
      // Guard against disputes on an escrow whose principal is not actually held.
      await assertEscrowIsLocked(tx, payer.userId, esc.amountCents);
    }

    if (evidence_url.length > 0) {
      await tx.insert(disputeEvidence).values(
        evidence_url.map((url) => ({
          dispute_id: newDispute.id,
          uploaded_by: reporter_id,
          evidence_url: [url],
        })),
      );
    }

    await tx.insert(notification).values({
      user_id: reported_id,
      text: `You've been reported in a dispute - ${reason.slice(0, 50)}...`,
      type: "dispute",
    });

    await logAudit(tx, {
      dispute_id: newDispute.id,
      action: "dispute_created",
      actor_type: "user",
      actor_id: reporter_id,
      new_value: dispute_type,
      details: { reason },
    });

    await logAudit(tx, {
      dispute_id: newDispute.id,
      action: "funds_locked",
      actor_type: "system",
      details: { amount_cents: esc.amountCents, escrow_id },
    });

    return newDispute;
  });
  return createdDispute;
};

export const myDisputes = async (userId: string) => {
  return await db
    .select()
    .from(dispute)
    .where(or(eq(dispute.reporter_id, userId), eq(dispute.reported_id, userId)))
    .orderBy(desc(dispute.createdAt));
};

export const listDisputeOffers = async (disputeId: string, viewerId: string, role?: string) => {
  const dis = await db.query.dispute.findFirst({ where: eq(dispute.id, disputeId) });
  if (!dis) throw new AppError(404, "Dispute not found");

  const esc = await db.query.escrow.findFirst({ where: eq(escrow.id, dis.escrow_id) });
  let parties: { userId: string; role: string }[] = [];
  if (esc) {
    parties = await db.select().from(escrowParties).where(eq(escrowParties.escrowId, esc.id));
  }
  const isParty = parties.some((p) => p.userId === viewerId);
  if (!isAdminRole(role) && !isParty) throw new AppError(403, "Unauthorized to view these offers");

  const offers = await db.query.disputeOffer.findMany({
    where: eq(disputeOffer.dispute_id, disputeId),
    orderBy: (o, { asc }) => [asc(o.createdAt)],
  });

  const ids = [...new Set(offers.map((o) => o.offered_by))];
  const foundUsers = ids.length
    ? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, ids))
    : [];
  const byId = new Map(foundUsers.map((u) => [u.id, u]));

  return offers.map((o) => ({
    ...o,
    offered_by_name: byId.get(o.offered_by)?.name ?? null,
  }));
};

export const createDisputeOffer = async (
  disputeId: string,
  offeredBy: string | undefined,
  amountCents: number,
  terms?: string,
) => {
  if (!offeredBy) throw new AppError(401, "Unauthorized");

  return await db.transaction(async (tx) => {
    const { dis, esc, payer, payee } = await getDisputeContext(tx, disputeId);

    if (dis.status === "Resolved" || dis.status === "Closed") {
      throw new AppError(400, "Dispute is already resolved");
    }
    if (esc.status === "released" || esc.status === "cancelled") {
      throw new AppError(400, "Escrow is already finalized");
    }
    if (offeredBy !== payer?.userId && offeredBy !== payee?.userId) {
      throw new AppError(403, "Only dispute parties can submit offers");
    }
    if (!Number.isFinite(amountCents) || amountCents <= 0 || amountCents > esc.amountCents) {
      throw new AppError(400, "Offer amount must be between 1 and the escrow amount");
    }

    await tx
      .update(disputeOffer)
      .set({ status: "superseded" })
      .where(and(eq(disputeOffer.dispute_id, disputeId), eq(disputeOffer.status, "pending")));

    const [offer] = await tx
      .insert(disputeOffer)
      .values({
        dispute_id: disputeId,
        offered_by: offeredBy,
        amount_cents: amountCents,
        terms: terms ?? null,
        status: "pending",
        is_counter_offer: false,
        expires_at: new Date(Date.now() + OFFER_TTL_MS),
      })
      .returning();

    const other = offeredBy === payer?.userId ? payee : payer;
    if (other?.userId) {
      await tx.insert(notification).values({
        user_id: other.userId,
        text: `Settlement Offer. A refund settlement of ${(amountCents / 100).toFixed(2)} ETB has been proposed for your dispute.`,
        type: "offer",
      });
    }

    await insertDisputeEventMessage(
      tx,
      disputeId,
      `A settlement offer of ${(amountCents / 100).toFixed(2)} ETB was submitted.`,
    );

    await logAudit(tx, {
      dispute_id: disputeId,
      action: "offer_submitted",
      actor_type: "user",
      actor_id: offeredBy,
      new_value: String(amountCents),
      details: { amount_cents: amountCents },
    });

    return offer;
  });
};

export const acceptDisputeOffer = async (offerId: string, userId: string | undefined, role?: string) => {
  if (!userId) throw new AppError(401, "Unauthorized");

  return await db.transaction(async (tx) => {
    const offer = await tx.query.disputeOffer.findFirst({ where: eq(disputeOffer.id, offerId) });
    if (!offer) throw new AppError(404, "Offer not found");
    if (offer.status !== "pending") throw new AppError(400, "Offer is no longer pending");
    if (offer.expires_at && offer.expires_at < new Date()) {
      await tx
        .update(disputeOffer)
        .set({ status: "expired", responded_at: new Date() })
        .where(eq(disputeOffer.id, offerId));
      throw new AppError(400, "Offer has expired");
    }

    const { dis, esc, payer, payee } = await getDisputeContext(tx, offer.dispute_id);
    if (dis.status === "Resolved" || dis.status === "Closed") {
      throw new AppError(400, "Dispute is already resolved");
    }

    const isAdmin = isAdminRole(role);
    const isCounterparty =
      (payer?.userId === userId || payee?.userId === userId) && userId !== offer.offered_by;
    if (!isAdmin && !isCounterparty) throw new AppError(403, "Only the other party or an admin can accept this offer");

    await tx
      .update(disputeOffer)
      .set({ status: "accepted", responded_at: new Date() })
      .where(eq(disputeOffer.id, offerId));
    await tx
      .update(disputeOffer)
      .set({ status: "superseded" })
      .where(and(eq(disputeOffer.dispute_id, offer.dispute_id), eq(disputeOffer.status, "pending")));
    
    const resolution: DisputeResolution = offer.amount_cents >= esc.amountCents ? "refund_payer" : "split";

    await executeResolution(tx, {
      disputeId: offer.dispute_id,
      resolution,
      refundAmountCents: offer.amount_cents,
      note: `Settlement accepted via offer ${offer.id}`,
      actorType: isAdmin ? "admin" : "user",
      actorId: isAdmin ? null : userId,
      adminId: isAdmin ? userId : null,
    });

    await insertDisputeEventMessage(
      tx,
      offer.dispute_id,
      `The settlement offer of ${(offer.amount_cents / 100).toFixed(2)} ETB was accepted. The dispute has been resolved.`,
    );

    await logAudit(tx, {
      dispute_id: offer.dispute_id,
      action: "offer_accepted",
      actor_type: isAdmin ? "admin" : "user",
      actor_id: isAdmin ? null : userId,
      admin_id: isAdmin ? userId : null,
      new_value: offer.id,
      details: { amount_cents: offer.amount_cents },
    });

    return { accepted: true, offerId: offer.id, resolution };
  });
};

export const rejectDisputeOffer = async (offerId: string, userId: string | undefined, role?: string) => {
  if (!userId) throw new AppError(401, "Unauthorized");

  return await db.transaction(async (tx) => {
    const offer = await tx.query.disputeOffer.findFirst({ where: eq(disputeOffer.id, offerId) });
    if (!offer) throw new AppError(404, "Offer not found");
    if (offer.status !== "pending") throw new AppError(400, "Offer is no longer pending");

    const { payer, payee } = await getDisputeContext(tx, offer.dispute_id);
    const isAdmin = isAdminRole(role);
    const isCounterparty =
      (payer?.userId === userId || payee?.userId === userId) && userId !== offer.offered_by;
    if (!isAdmin && !isCounterparty) throw new AppError(403, "Only the other party or an admin can reject this offer");

    await tx
      .update(disputeOffer)
      .set({ status: "rejected", responded_at: new Date() })
      .where(eq(disputeOffer.id, offerId));

    await tx
      .update(dispute)
      .set({ status: "UnderReview", updatedAt: new Date() })
      .where(eq(dispute.id, offer.dispute_id));

    const other = offer.offered_by === payer?.userId ? payee : payer;
    if (other?.userId) {
      await tx.insert(notification).values({
        user_id: other.userId,
        text: "Offer Rejected. Your settlement offer was rejected. The dispute is back under review.",
        type: "offer",
      });
    }

    await insertDisputeEventMessage(
      tx,
      offer.dispute_id,
      `The settlement offer of ${(offer.amount_cents / 100).toFixed(2)} ETB was rejected. The dispute is back under review.`,
    );

    await logAudit(tx, {
      dispute_id: offer.dispute_id,
      action: "offer_rejected",
      actor_type: isAdmin ? "admin" : "user",
      actor_id: isAdmin ? null : userId,
      admin_id: isAdmin ? userId : null,
      new_value: offer.id,
    });

    return { rejected: true, offerId: offer.id };
  });
};

export const counterDisputeOffer = async (
  offerId: string,
  userId: string | undefined,
  amountCents: number,
  terms?: string,
) => {
  if (!userId) throw new AppError(401, "Unauthorized");

  return await db.transaction(async (tx) => {
    const parent = await tx.query.disputeOffer.findFirst({ where: eq(disputeOffer.id, offerId) });
    if (!parent) throw new AppError(404, "Offer not found");
    if (parent.status !== "pending") throw new AppError(400, "Parent offer is no longer pending");
    if (parent.expires_at && parent.expires_at < new Date()) {
      await tx
        .update(disputeOffer)
        .set({ status: "expired", responded_at: new Date() })
        .where(eq(disputeOffer.id, offerId));
      throw new AppError(400, "Offer has expired");
    }

    const { dis, esc, payer, payee } = await getDisputeContext(tx, parent.dispute_id);
    if (dis.status === "Resolved" || dis.status === "Closed") {
      throw new AppError(400, "Dispute is already resolved");
    }

    const isCounterparty = (payer?.userId === userId || payee?.userId === userId) && userId !== parent.offered_by;
    if (!isCounterparty) throw new AppError(403, "Only the counterparty can counter this offer");
    if (!Number.isFinite(amountCents) || amountCents <= 0 || amountCents > esc.amountCents) {
      throw new AppError(400, "Counter amount must be between 1 and the escrow amount");
    }

    await tx
      .update(disputeOffer)
      .set({ status: "superseded" })
      .where(eq(disputeOffer.id, offerId));
    await tx
      .update(disputeOffer)
      .set({ status: "superseded" })
      .where(and(eq(disputeOffer.dispute_id, parent.dispute_id), eq(disputeOffer.status, "pending")));

    const [counter] = await tx
      .insert(disputeOffer)
      .values({
        dispute_id: parent.dispute_id,
        offered_by: userId,
        amount_cents: amountCents,
        terms: terms ?? null,
        status: "pending",
        is_counter_offer: true,
        parent_offer_id: parent.id,
        expires_at: new Date(Date.now() + OFFER_TTL_MS),
      })
      .returning();

    const other = userId === payer?.userId ? payee : payer;
    if (other?.userId) {
      await tx.insert(notification).values({
        user_id: other.userId,
        text: `Counter Offer. A counter offer of ${(amountCents / 100).toFixed(2)} ETB was submitted for your dispute.`,
        type: "offer",
      });
    }

    await insertDisputeEventMessage(
      tx,
      parent.dispute_id,
      `A counter offer of ${(amountCents / 100).toFixed(2)} ETB was submitted.`,
    );

    await logAudit(tx, {
      dispute_id: parent.dispute_id,
      action: "offer_submitted",
      actor_type: "user",
      actor_id: userId,
      new_value: String(amountCents),
      details: { is_counter_offer: true, parent_offer_id: parent.id },
    });

    return counter;
  });
};
