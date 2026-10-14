import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { db } from "../config/db";
import { escrow, transactions, notification, platformBalance } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { automaticReleaseFund } from "../services/escrow.service";
import { creditWallet, getWallet, lockFunds, releaseLocked } from "../services/wallet.service";

/**
 * Applies the same wallet effect that confirmEscrowFunding performs, so tests can
 * reach a 'funded' state without going through Chapa verification. The escrow
 * status is written directly, but the principal MUST be locked — releaseLocked
 * will (correctly) refuse to pay out of an escrow nobody is holding.
 */
const simulateFunding = async (payerId: string, escrowId: string, amountCents: number) => {
  await db.transaction(async (tx) => {
    await tx.update(escrow).set({ status: "funded" }).where(eq(escrow.id, escrowId));
    await creditWallet(tx, payerId, amountCents);
    await lockFunds(tx, payerId, amountCents);
  });
};

const register = async (name: string, role: string) => {
  const email = `${role}_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password: "password123", role });
  expect(res.status).toBe(200);
  return { token: res.body.accessToken as string, id: res.body.user.id as string, email };
};

const createEscrow = async (
  payerToken: string,
  payeeEmail: string,
  amount: number,
  releaseCondition: string,
) => {
  const res = await request(app)
    .post("/api/escrow/create")
    .set("Authorization", `Bearer ${payerToken}`)
    .send({ payeeEmail, amount, releaseCondition });
  expect(res.status).toBe(201);
  return res.body.id as string;
};

describe("Escrow Release Flow", () => {
  it("creates, funds, and releases an escrow successfully", async () => {
    const payer = await register("Test Payer", "client");
    const payee = await register("Test Payee", "freelancer");

    const escrowId = await createEscrow(payer.token, payee.email, 100, "manual");
    expect((await db.select().from(escrow).where(eq(escrow.id, escrowId)))[0].status).toBe("created");

    await simulateFunding(payer.id, escrowId, 10000);

    // Funding moves the principal into the locked bucket, so the spendable
    // wallet is untouched even though a real payment was collected.
    const afterFunding = await getWallet(payer.id);
    expect(afterFunding.balanceCents).toBe(0);
    expect(afterFunding.lockedCents).toBe(10000);

    const releaseRes = await request(app)
      .patch(`/api/escrow/${escrowId}/release`)
      .set("Authorization", `Bearer ${payer.token}`)
      .send();

    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.message).toBe("Escrow funds released successfully");
    expect(releaseRes.body.escrow.status).toBe("released");

    const txs = await db.select().from(transactions).where(eq(transactions.escrowId, escrowId));
    const releaseTx = txs.find((t) => t.type === "release");
    expect(releaseTx).toBeDefined();
    expect(Number(releaseTx?.amountCents)).toBe(10000);
    expect(releaseTx?.fromAccount).toBe(payer.id);
    expect(releaseTx?.toAccount).toBe(payee.id);

    const feeTx = txs.find((t) => t.type === "fee");
    expect(feeTx).toBeUndefined();

    // locked -> payee wallet
    const payerAfter = await getWallet(payer.id);
    expect(payerAfter.lockedCents).toBe(0);
    expect(payerAfter.balanceCents).toBe(0);

    const payeeAfter = await getWallet(payee.id);
    expect(payeeAfter.balanceCents).toBe(10000);

    const notifs = await db.select().from(notification).where(eq(notification.escrow_id, escrowId));
    const payeeNotif = notifs.find((n) => n.user_id === payee.id);
    expect(payeeNotif).toBeDefined();
    expect(payeeNotif?.type).toBe("release-fund");
    expect(payeeNotif?.text).toContain("manually released");
  });

  it("refuses to release the same escrow twice", async () => {
    const payer = await register("Double Payer", "client");
    const payee = await register("Double Payee", "freelancer");

    const escrowId = await createEscrow(payer.token, payee.email, 50, "manual");
    await simulateFunding(payer.id, escrowId, 5000);

    const first = await request(app)
      .patch(`/api/escrow/${escrowId}/release`)
      .set("Authorization", `Bearer ${payer.token}`)
      .send();
    expect(first.status).toBe(200);

    const second = await request(app)
      .patch(`/api/escrow/${escrowId}/release`)
      .set("Authorization", `Bearer ${payer.token}`)
      .send();
    expect(second.status).toBe(400);

    // The payee was paid exactly once.
    const payeeWallet = await getWallet(payee.id);
    expect(payeeWallet.balanceCents).toBe(5000);
  });

  it("refuses to release an escrow whose principal was never locked", async () => {
    const payer = await register("Ghost Payer", "client");
    const payee = await register("Ghost Payee", "freelancer");

    const escrowId = await createEscrow(payer.token, payee.email, 25, "manual");

    // Mark funded without locking — the exact inconsistency the wallet model
    // is designed to catch.
    await db.update(escrow).set({ status: "funded" }).where(eq(escrow.id, escrowId));

    const res = await request(app)
      .patch(`/api/escrow/${escrowId}/release`)
      .set("Authorization", `Bearer ${payer.token}`)
      .send();

    expect(res.status).toBe(409);

    const payeeWallet = await getWallet(payee.id);
    expect(payeeWallet.balanceCents).toBe(0);
  });
});

describe("Automatic release", () => {
  it("pays out once even when the cron sweep runs repeatedly", async () => {
    const payer = await register("Cron Payer", "client");
    const payee = await register("Cron Payee", "freelancer");

    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);

    // createEscrow rejects a past expiry, so create a valid one and backdate it
    // to simulate time passing.
    const res = await request(app)
      .post("/api/escrow/create")
      .set("Authorization", `Bearer ${payer.token}`)
      .send({
        payeeEmail: payee.email,
        amount: 75,
        releaseCondition: "auto_after_date",
        expiresAt: future.toISOString(),
      });
    expect(res.status).toBe(201);
    const escrowId = res.body.id as string;

    await db.update(escrow).set({ expiresAt: past }).where(eq(escrow.id, escrowId));
    await simulateFunding(payer.id, escrowId, 7500);

    await automaticReleaseFund();
    await automaticReleaseFund();
    await automaticReleaseFund();

    const txs = await db.select().from(transactions).where(eq(transactions.escrowId, escrowId));
    const releaseTxs = txs.filter((t) => t.type === "release");
    expect(releaseTxs).toHaveLength(1);

    const payeeWallet = await getWallet(payee.id);
    expect(payeeWallet.balanceCents).toBe(7500);

    const payerWallet = await getWallet(payer.id);
    expect(payerWallet.lockedCents).toBe(0);
  });
});

describe("Wallet invariants", () => {
  it("never lets locked funds go negative", async () => {
    const payer = await register("Overdraw Payer", "client");
    const payee = await register("Overdraw Payee", "freelancer");

    await db.transaction(async (tx) => {
      await tx.insert(platformBalance).values({ user_id: payer.id, balance_cents: 0, locked_cents: 100 });
    });

    await expect(releaseLocked(db, payer.id, payee.id, 500)).rejects.toThrow(
      /missing or already released/i,
    );

    const wallet = await getWallet(payer.id);
    expect(wallet.lockedCents).toBe(100);
  });

  it("refuses to lock more than the wallet holds", async () => {
    const payer = await register("Broke Payer", "client");

    await db.transaction(async (tx) => {
      await tx.insert(platformBalance).values({ user_id: payer.id, balance_cents: 500, locked_cents: 0 });
    });

    await expect(lockFunds(db, payer.id, 900)).rejects.toThrow(/insufficient/i);

    const wallet = await getWallet(payer.id);
    expect(wallet.balanceCents).toBe(500);
    expect(wallet.lockedCents).toBe(0);
  });
});
