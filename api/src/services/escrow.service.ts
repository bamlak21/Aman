import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "../config/db";
import { escrow, escrowParties, platformBalance, transactions, users } from "../drizzle/schema";
import { AppError } from "../utils/AppError";
import { notification } from "../drizzle/schema/notification.schema";

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
  const rows = await db
    .select({ amountCents: transactions.amountCents })
    .from(transactions)
    .innerJoin(escrow, eq(escrow.id, transactions.escrowId))
    .where(
      and(
        eq(transactions.toAccount, userId),
        eq(transactions.type, "release"),
        eq(escrow.status, "released"),
      ),
    );

  const totalAmount = rows.reduce((sum, row) => sum + Number(row.amountCents), 0);

  return totalAmount;
}
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

export const confirmEscrowFunding = async (escrowId: string, tx_ref: string,userId:string) => {
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
    const user = await tx.select().from(escrowParties).
    where(and(
      eq(escrowParties.userId,userId),
      eq(escrowParties.role,'payer')
   ) )

    if(user){
      await tx.insert(platformBalance).values({
        user_id:userId,
        balance_cents:escrowRecord.amountCents
      })
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
    const [balance]  = await db.insert(platformBalance).values({
      user_id:userId,
      balance_cents:escrowData.amount
    }).returning(); 

    console.log(txn);
    console.log(balance);
    

    return updatedEscrow;
  });
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
    if (!entry.payerId || !entry.payeeId) continue

    await db.transaction(async (tx) => {
      await tx.update(escrow)
        .set({ status: 'released', updatedAt: new Date() })
        .where(eq(escrow.id, entry.escrow.id))

      await tx.insert(transactions).values({
        escrowId: entry.escrow.id,
        amountCents: entry.escrow.amountCents,
        type: 'release',
        fromAccount: entry.payerId,
        toAccount: entry.payeeId,
      })

      await tx.insert(notification).values({
        escrow_id: entry.escrow.id,
        user_id: entry.payeeId,
        text: `payment of ${entry.escrow.amountCents / 100} ETB has been automatically released`,
        isRead: false,
        type: 'release-fund',
      })
      await tx.insert(notification).values({
        escrow_id: entry.escrow.id,
        user_id: entry.payerId,
        text: `payment of ${entry.escrow.amountCents / 100} ETB has been automatically released`,
        isRead: false,
        type: 'release-fund',
      })
    })
  }
}
    