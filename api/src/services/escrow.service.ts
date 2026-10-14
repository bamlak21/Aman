import { and, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "../config/db";
import { escrow, escrowParties, transactions, users } from "../drizzle/schema";
import { AppError } from "../utils/AppError";
import { notification } from "../drizzle/schema/notification.schema";
import { appFeeCents } from "../utils/fee";
import { creditWallet, getWallet, lockFunds, releaseLocked } from "./wallet.service";
import { randomUUID } from "crypto";


type CreateEscrowInput = {
  payerId: string;
  payeeId: string;
  amountCents: number;
  releaseCondition: "manual" | "auto_after_date" | "milestone";
  expiresAt?:any;
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
    fee: appFeeCents(esc.amountCents),
    totalToPay: esc.amountCents + appFeeCents(esc.amountCents),
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
    .where(inArray(escrow.id, escrowIds));

  const grouped = new Map();

  for (const row of rows) {
    const escrowId = row.escrow.id;

    if (!grouped.has(escrowId)) {
      grouped.set(escrowId, {
        ...row.escrow,
        fee: appFeeCents(row.escrow.amountCents),
        totalToPay: row.escrow.amountCents + appFeeCents(row.escrow.amountCents),
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

export const fetchUserAmount = async (userId: string) => {
  return getWallet(userId);
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

  const tx_ref = `tx_`+ randomUUID().slice(0,15);

  const appFee = appFeeCents(escrowData.amount);
  const totalCharge = escrowData.amount + appFee;

  await db
    .update(escrow)
    .set({ txRef: tx_ref })
    .where(eq(escrow.id, escrowId));
  
  const [payerUser] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, payer.userId));

  const nameParts = payerUser?.name.split(" ") || [];
  const firstName = nameParts.shift() || "";
  const lastName = nameParts.join(" ") || "";

  const { initializePayment } = await import("../utils/chapa");
  const paymentResult = await initializePayment({
    firstName,
    lastName,
    email: payerUser?.email || "",
    tx_ref,
    amount: totalCharge / 100,
    escrow_id: escrowId,
  });

  if (!paymentResult) {
    throw new AppError(500, "Failed to initialize payment");
  }

  return {
    tx_ref,
    checkout_url: paymentResult.checkout_url,
    amount_cents: totalCharge,
    fee_cents: appFee,
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

      // Chapa collected the principal + the app fee. Only the principal belongs to
      // the payer's wallet; the fee is platform revenue.
      const appFee = appFeeCents(escrowRecord.amountCents);

      await tx.insert(transactions).values({
        escrowId,
        amountCents: appFee,
        type: "fee",
        fromAccount: payer.userId,
        toAccount: null,
      });

      // The escrow is immediately funded, so the principal moves straight from
      // the wallet into the locked bucket. Net wallet effect is zero, which is
      // correct: the payer paid real money, they just cannot spend it yet.
      await creditWallet(tx, payer.userId, escrowRecord.amountCents);
      await lockFunds(tx, payer.userId, escrowRecord.amountCents);
    }

    return updatedEscrow;
  });
};

export const confirmEscrowFundingByTxRef = async (tx_ref: string) => {
  const [escrowRecord] = await db
    .select({ id: escrow.id })
    .from(escrow)
    .where(eq(escrow.txRef, tx_ref))
    .limit(1);

  if (!escrowRecord) {
    throw new AppError(404, "Escrow not found for transaction reference");
  }

  return confirmEscrowFunding(escrowRecord.id, tx_ref);
};


export const releaseFund = async (escrowId: string, userId: string) => {
  const escrowData = await fetchEscrow(escrowId, userId);

  return await db.transaction(async (tx) => {
    const payer = escrowData.parties.find(
      (party) => party.userId === userId && party.role === "payer",
    );
    if (!payer) throw new AppError(403, "Only the payer can release escrow funds");

    const payee = escrowData.parties.find((party) => party.role === "payee");
    if (!payee) throw new AppError(404, "Payee not found for this escrow");

    if (escrowData.releaseConditions === "auto_after_date") {
      if (!escrowData.expiresAt) {
        throw new AppError(400, "Expiration date is not set for this escrow");
      }
      if (new Date() < escrowData.expiresAt) {
        throw new AppError(400, "Cannot release funds before the expiration date");
      }
    }

    const [updatedEscrow] = await tx
      .update(escrow)
      .set({ status: "released", updatedAt: new Date() })
      .where(and(eq(escrow.id, escrowId), eq(escrow.status, "funded")))
      .returning();

    if (!updatedEscrow) {
      throw new AppError(400, "Escrow must be funded to release funds");
    }

    await tx.insert(transactions).values({
      escrowId,
      amountCents: escrowData.amount,
      type: "release",
      fromAccount: payer.userId,
      toAccount: payee.userId,
    });

    await tx.insert(notification).values({
      escrow_id: escrowId,
      user_id: payee.userId,
      text: escrowData.releaseConditions === "auto_after_date"
        ? `payment is done automatically with ${escrowData.amount / 100} ETB`
        : `payment of ${escrowData.amount / 100} ETB has been manually released by the payer`,
      isRead: false,
      type: "release-fund",
    });

    // The escrow update above already proved the escrow was 'funded' inside this
    // transaction, so releaseLocked can never race a second release.
    await releaseLocked(tx, payer.userId, payee.userId, escrowData.amount);

    return updatedEscrow;
  });
};

export const notifyOverdueEscrow = async() =>{
  const over = await db.select().from(escrow)
    .leftJoin(escrowParties, eq(escrow.id, escrowParties.escrowId))
    .where(
      and(
        eq(escrow.status, 'created'),
        eq(escrow.releaseCondition, 'auto_after_date'),
        lt(escrow.expiresAt, new Date())
      )
    )

  for(const row of over){
    if(row.escrow_parties?.role === 'payer'){
      await db.insert(notification).values({
        escrow_id: row.escrow.id,
        user_id: row.escrow_parties.userId,
        text: `the due date for escrow ${row.escrow.id} has passed. please fund the escrow with ${row.escrow.amountCents / 100} ETB`,
        isRead: false,
        type: "release-fund",
      })
    }
  }
}


export const automaticReleaseFund = async () =>{
  const rows = await db.select()
    .from(escrow)
    .leftJoin(escrowParties, eq(escrow.id, escrowParties.escrowId))
    .where(
      and(
        eq(escrow.status, 'funded'),
        eq(escrow.releaseCondition, 'auto_after_date'),
        lt(escrow.expiresAt, new Date())
      )
    )

  const escrowMap = new Map<string, { escrow: typeof escrow.$inferSelect; payerId: string | null; payeeId: string | null }>()

  for (const row of rows) {
    if (!escrowMap.has(row.escrow.id)) {
      escrowMap.set(row.escrow.id, { escrow: row.escrow, payerId: null, payeeId: null })
    }
    const entry = escrowMap.get(row.escrow.id)!
    if (row.escrow_parties?.role === 'payer') {
      entry.payerId = row.escrow_parties.userId
    } else if (row.escrow_parties?.role === 'payee') {
      entry.payeeId = row.escrow_parties.userId
    }
  }

  for (const [, entry] of escrowMap) {
    const payerId = entry.payerId
    const payeeId = entry.payeeId
    if (!payerId || !payeeId) continue

    await db.transaction(async (tx) => {
      // Claim the escrow. The status guard is only useful if we check whether the
      // row was actually claimed — otherwise a concurrent cron pass falls through
      // and pays the payee twice. This is what released 1,100,000 cents twice.
      const [claimed] = await tx.update(escrow)
        .set({ status: 'released', updatedAt: new Date() })
        .where(and(eq(escrow.id, entry.escrow.id), eq(escrow.status, "funded")))
        .returning({ id: escrow.id });

      if (!claimed) return;

      await tx.insert(transactions).values({
        escrowId: entry.escrow.id,
        amountCents: entry.escrow.amountCents,
        type: 'release',
        fromAccount: payerId,
        toAccount: payeeId,
      })

      await tx.insert(notification).values({
        escrow_id: entry.escrow.id,
        user_id: payeeId,
        text: `payment of ${entry.escrow.amountCents / 100} ETB has been automatically released`,
        isRead: false,
        type: 'release-fund',
      })
      await tx.insert(notification).values({
        escrow_id: entry.escrow.id,
        user_id: payerId,
        text: `payment of ${entry.escrow.amountCents / 100} ETB has been automatically released`,
        isRead: false,
        type: 'release-fund',
      })

      await releaseLocked(tx, payerId, payeeId, entry.escrow.amountCents)
    })
  }
}
    
export const fetchTransactions = async (userId:string) => {
  
  const data = await db
    .select({
      id: transactions.id,
      escrowId: transactions.escrowId,
      type: transactions.type,
      amountCents: transactions.amountCents,
      fromAccount: transactions.fromAccount,
      toAccount: transactions.toAccount,
      createdAt: transactions.createdAt,
      status: escrow.status,
      expiresAt: escrow.expiresAt,
      txRef: escrow.txRef,
      releaseCondition: escrow.releaseCondition,
      milestoneDetails: escrow.milestoneDetails,
    })
    .from(transactions)
    .innerJoin(escrow, eq(transactions.escrowId, escrow.id))
    .where(
      or(
        eq(transactions.fromAccount, userId),
        eq(transactions.toAccount, userId),
      ),
    );
  const allUserIds:any= [
    ...new Set(
      data.flatMap((r) => [r.fromAccount, r.toAccount]),
    ),
  ];
  const usersList = allUserIds.length
    ? await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, allUserIds))
    : [];
  const userMap = new Map(usersList.map((u) => [u.id, u.name]));

  // Then flatten into Txn shape:
  const result = data.map((row) => ({
    ...row,
    payer: {
      id: row.fromAccount,
      name: row.fromAccount ? userMap.get(row.fromAccount) ?? "N/A" : "N/A",
    },
    payee: {
      id: row.toAccount,
      name: row.toAccount ? userMap.get(row.toAccount) ?? "N/A" : "N/A",
    },
  }));
  return result;
};