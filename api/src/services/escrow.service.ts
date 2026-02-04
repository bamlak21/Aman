import { and, eq } from "drizzle-orm";
import { db } from "../config/db";
import { escrow, escrowParties, transactions } from "../drizzle/schema";
import { AppError } from "../utils/AppError";

type CreateEscrowInput = {
  payerId: string;
  payeeId: string;
  amountCents: number;
  releaseCondition: "manual" | "auto_after_date" | "milestone";
  expiresAt?: Date;
};

export const createEscrow = async (input: CreateEscrowInput) => {
  const { payerId, payeeId, amountCents, releaseCondition, expiresAt } = input;

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
  const rows = await db
    .select({
      escrow: escrow,
      role: escrowParties.role,
    })
    .from(escrowParties)
    .innerJoin(escrow, eq(escrow.id, escrowParties.escrowId))
    .where(eq(escrowParties.userId, userId));

  return rows.map((row) => ({ ...row.escrow, myRole: row.role }));
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
