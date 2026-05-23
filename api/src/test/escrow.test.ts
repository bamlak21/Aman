import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../app";
import { db } from "../config/db";
import { escrow, transactions, notification } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Escrow Release Flow", () => {
  it("creates, funds, and releases an escrow successfully", async () => {
    // Generate unique emails
    const payerEmail = `payer_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
    const payeeEmail = `payee_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;

    // 1. Register Payer (client)
    const regPayer = await request(app).post("/api/auth/register").send({
      name: "Test Payer",
      email: payerEmail,
      password: "password123",
      role: "client",
    });
    expect(regPayer.status).toBe(200);
    const payerToken = regPayer.body.accessToken;
    const payerId = regPayer.body.user.id;

    // 2. Register Payee (freelancer)
    const regPayee = await request(app).post("/api/auth/register").send({
      name: "Test Payee",
      email: payeeEmail,
      password: "password123",
      role: "freelancer",
    });
    expect(regPayee.status).toBe(200);
    const payeeId = regPayee.body.user.id;

    // 3. Create Escrow
    const createRes = await request(app)
      .post("/api/escrow/create")
      .set("Authorization", `Bearer ${payerToken}`)
      .send({
        payeeEmail: payeeEmail,
        amount: 100, // 100 ETB
        releaseCondition: "manual",
      });

    expect(createRes.status).toBe(201);
    const escrowId = createRes.body.id;
    expect(createRes.body.status).toBe("created");

    // Manually update escrow to 'funded' status to bypass Chapa payment verification for testing
    await db.update(escrow)
      .set({ status: "funded" })
      .where(eq(escrow.id, escrowId));

    // 4. Release Escrow
    const releaseRes = await request(app)
      .patch(`/api/escrow/${escrowId}/release`)
      .set("Authorization", `Bearer ${payerToken}`)
      .send();

    expect(releaseRes.status).toBe(200);
    expect(releaseRes.body.message).toBe("Escrow funds released successfully");
    expect(releaseRes.body.escrow.status).toBe("released");

    // 5. Verify transaction was created
    const txs = await db.select().from(transactions).where(eq(transactions.escrowId, escrowId));
    const releaseTx = txs.find(t => t.type === "release");
    expect(releaseTx).toBeDefined();
    expect(Number(releaseTx?.amountCents)).toBe(10000);
    expect(releaseTx?.fromAccount).toBe(payerId);
    expect(releaseTx?.toAccount).toBe(payeeId);

    // 6. Verify notification was created for payee
    const notifs = await db.select().from(notification).where(eq(notification.escrow_id, escrowId));
    expect(notifs.length).toBeGreaterThan(0);
    const payeeNotif = notifs.find(n => n.user_id === payeeId);
    expect(payeeNotif).toBeDefined();
    expect(payeeNotif?.type).toBe("release-fund");
    expect(payeeNotif?.text).toContain("manually released");
  });
});
