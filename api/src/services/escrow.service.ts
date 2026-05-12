import { and, eq, inArray } from "drizzle-orm";
import { db } from "../config/db";
import { escrow, escrowParties, transactions, users } from "../drizzle/schema";
import { AppError } from "../utils/AppError";

type CreateEscrowInput = {
  payerId: string;
  payeeId: string;
  amountCents: number;
  releaseCondition: "manual" | "auto_after_date" | "milestone";
  expiresAt?: Date;
  milestoneDetails?: string;
};

export const createEscrow = async (input: CreateEscrowInput) => {
  const { payerId, payeeId, amountCents, releaseCondition, expiresAt, milestoneDetails } = input;

  if (payeeId === payerId)
    throw new AppError(400, "Payer and payee cannot be the same user");

  if (amountCents <= 0) {
    throw new AppError(400, "Amount must be greater than zero");
  }

  if (expiresAt && expiresAt <= new Date()) {
    throw new AppError(400, "Expiration date must be in the future");
  }

  return await db.transaction(async (tx) => {
    const [createEscrow] = await tx
      .insert(escrow)
      .values({
        amountCents,
        releaseCondition,
        expiresAt,
        milestoneDetails,
      })
      .returning();

    await tx.insert(escrowParties).values([
      {
        escrowId: createEscrow.id,
        userId: payerId,
        role: "payer",
      },
      {
        escrowId: createEscrow.id,
        userId: payeeId,
        role: "payee",
      },
    ]);

    return createEscrow;
  });
};

export const fetchEscrow = async (id: string, userId: string) => {
  const [esc] = await db.select().from(escrow).where(eq(escrow.id, id));
  if (!esc) throw new AppError(404, "Escrow not found");
  const parties = await db
    .select()
    .from(escrowParties)
    .where(eq(escrowParties.escrowId, esc.id));

  const isParticipant = parties.some((party) => party.userId === userId);

  if (!isParticipant)
    throw new AppError(403, "You are not allowed to access this escrow");

  return {
    id: esc.id,
    amount: esc.amountCents,
    releaseConditions: esc.releaseCondition,
    status: esc.status,
    expiresAt: esc.expiresAt,
    parties,
  };
};

export const fetchEscrows = async (userId: string) => {
  const userEscrowIds = await db
    .select({ escrowId: escrowParties.escrowId })
    .from(escrowParties)
    .where(eq(escrowParties.userId, userId));

  if (userEscrowIds.length === 0) {
    return [];
  }

  const escrowIds = userEscrowIds.map((e) => e.escrowId);

  const rows = await db
    .select({
      escrow: escrow,
      role: escrowParties.role,
      user: {
        id: users.id,
        name: users.name,
      },
    })
    .from(escrowParties)
    .innerJoin(escrow, eq(escrow.id, escrowParties.escrowId))
    .innerJoin(users, eq(users.id, escrowParties.userId))
    // .innerJoin(fund,eq(fund.userId,escrowParties.userId))
    .where(inArray(escrow.id, escrowIds));

  const grouped = new Map();

  for (const row of rows) {
    const escrowId = row.escrow.id;

    if (!grouped.has(escrowId)) {
      grouped.set(escrowId, {
        ...row.escrow,
        payer: null,
        payee: null,
        myRole: null,
      });
    }

    const entry = grouped.get(escrowId);

    if (row.role === "payer") {
      entry.payer = row.user;
    }

    if (row.role === "payee") {
      entry.payee = row.user;
    }

    if (row.user.id === userId) {
      entry.myRole = row.role;
    }
  }

  return Array.from(grouped.values());
};

export const initializeEscrowFunding = async (escrowId: string, userId: string) => {
  const escrowData = await fetchEscrow(escrowId, userId);

  if (escrowData.status !== "created") {
    throw new AppError(400, "Escrow is not in created status");
  }

  const payer = escrowData.parties.find(
    (party) => party.userId === userId && party.role === "payer",
  );
  if (!payer) throw new AppError(403, "Only the payer can fund escrow");

  const tx_ref = `escrow_${escrowId}`;

  await db
    .update(escrow)
    .set({ txRef: tx_ref })
    .where(eq(escrow.id, escrowId));

  const { initializePayment } = await import("../utils/chapa");
  const paymentResult = await initializePayment({
    tx_ref,
    amount: escrowData.amount / 100,
    escrow_id: escrowId,
  });

  if (!paymentResult) {
    throw new AppError(500, "Failed to initialize payment");
  }

  return {
    tx_ref,
    checkout_url: paymentResult.checkout_url,
  };
};

export const confirmEscrowFunding = async (escrowId: string, tx_ref: string) => {
  const [escrowRecord] = await db
    .select()
    .from(escrow)
    .where(eq(escrow.id, escrowId));

  if (!escrowRecord) {
    throw new AppError(404, "Escrow not found");
  }

  if (escrowRecord.status !== "created") {
    throw new AppError(400, "Escrow is not in created status");
  }

  if (escrowRecord.txRef !== tx_ref) {
    throw new AppError(400, "Transaction reference mismatch");
  }

  const { verifyPayment } = await import("../utils/chapa");
  const verification = await verifyPayment(tx_ref);

  if (!verification || verification.data?.status !== "success") {
    throw new AppError(400, "Payment verification failed");
  }

  return await db.transaction(async (tx) => {
    const [updatedEscrow] = await tx
      .update(escrow)
      .set({ status: "funded", paidAt: new Date(), updatedAt: new Date() })
      .where(and(eq(escrow.id, escrowId), eq(escrow.status, "created")))
      .returning({
        id: escrow.id,
        amount: escrow.amountCents,
        status: escrow.status,
        releaseCondition: escrow.releaseCondition,
        expiresAt: escrow.expiresAt,
        updatedAt: escrow.updatedAt
      });

    if (!updatedEscrow) {
      throw new AppError(409, "Escrow already funded");
    }

    const parties = await tx
      .select()
      .from(escrowParties)
      .where(eq(escrowParties.escrowId, escrowId));

    const payer = parties.find((p) => p.role === "payer");

    if (payer) {
      await tx.insert(transactions).values({
        escrowId,
        amountCents: escrowRecord.amountCents,
        type: "deposit",
        fromAccount: payer.userId,
        toAccount: null,
      });
    }

    return updatedEscrow;
  });
};

export const fundEscrow = async (escrowId: string, userId: string) => {
  const escrowData = await fetchEscrow(escrowId, userId);

  return await db.transaction(async (tx) => {
    const payer = escrowData.parties.find(
      (party) => party.userId === userId && party.role === "payer",
    );
    if (!payer) throw new AppError(403, "Only the payer can fund escrow");

    const [updatedEscrow] = await tx
      .update(escrow)
      .set({ status: "funded" })
      .where(and(eq(escrow.id, escrowId), eq(escrow.status, "created")))
      .returning({
        id: escrow.id,
        amount: escrow.amountCents,
        status: escrow.status,
        releaseCondition: escrow.releaseCondition,
        expiresAt: escrow.expiresAt,
      });

    if (!updatedEscrow) {
      throw new AppError(409, "Escrow already funded");
    }

    const [txn] = await tx
      .insert(transactions)
      .values({
        escrowId: escrowData.id,
        amountCents: escrowData.amount,
        type: "deposit",
        fromAccount: payer.id,
        toAccount: null,
      })
      .returning();

    console.log(txn);

    return updatedEscrow;
  });
};
