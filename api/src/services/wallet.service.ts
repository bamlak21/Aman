import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "../config/db";
import { platformBalance } from "../drizzle/schema";
import { AppError } from "../utils/AppError";

/**
 * Plan A — wallet model.
 *
 * platform_balance holds two independent buckets per user:
 *   balance_cents -> spendable wallet
 *   locked_cents  -> principal currently held by a funded/disputed escrow
 *
 * The invariant that makes this safe:
 *   locked_cents == SUM(escrow.amount_cents) for every escrow the user is the
 *   payer of, where status IN ('funded', 'disputed')
 *
 * Money only ever moves in pairs, and always via the helpers below:
 *   lockFunds       wallet  -> locked   (escrow funded)
 *   releaseLocked   locked -> wallet   (escrow released / refunded / split)
 *   creditWallet    external -> wallet  (Chapa payout, dispute settlement credit)
 *
 * Never clamp with GREATEST(x - y, 0). A clamp hides an over-debit and silently
 * destroys the ledger, which is exactly how 544,300 cents went missing before.
 */

/**
 * Accepts either a transaction or the root `db` client, so the helpers below can
 * be used from a transaction (preferred) or standalone.
 */
type Tx = Omit<typeof db, "$client" | "transaction" | "execute">;

const touch = { updatedAt: new Date() };

/** Create the wallet row on demand so callers never have to check for it. */
export const ensureWallet = async (tx: Tx, userId: string) => {
  await tx
    .insert(platformBalance)
    .values({ user_id: userId, balance_cents: 0, locked_cents: 0 })
    .onConflictDoNothing({ target: platformBalance.user_id });
};

/** Add to the spendable wallet. Used when real money arrives (Chapa, settlement). */
export const creditWallet = async (tx: Tx, userId: string, amountCents: number) => {
  if (amountCents <= 0) return;
  await ensureWallet(tx, userId);
  await tx
    .update(platformBalance)
    .set({
      balance_cents: sql`${platformBalance.balance_cents} + ${amountCents}`,
      ...touch,
    })
    .where(eq(platformBalance.user_id, userId));
};

/** wallet -> locked. Fails loudly if the payer cannot cover the escrow. */
export const lockFunds = async (tx: Tx, userId: string, amountCents: number) => {
  if (amountCents <= 0) return;
  await ensureWallet(tx, userId);

  const [updated] = await tx
    .update(platformBalance)
    .set({
      balance_cents: sql`${platformBalance.balance_cents} - ${amountCents}`,
      locked_cents: sql`${platformBalance.locked_cents} + ${amountCents}`,
      ...touch,
    })
    .where(
      and(
        eq(platformBalance.user_id, userId),
        gte(platformBalance.balance_cents, amountCents),
      ),
    )
    .returning({ balance_cents: platformBalance.balance_cents });

  if (!updated) {
    throw new AppError(400, "Insufficient available balance to fund this escrow");
  }
};

/** locked -> wallet. Unlocks the principal and hands it to `toUserId`. */
export const releaseLocked = async (
  tx: Tx,
  payerId: string,
  toUserId: string,
  amountCents: number,
) => {
  if (amountCents <= 0) return;

  await releaseEscrowPrincipal(tx, payerId, amountCents, [
    { user_id: toUserId, amount_cents: amountCents },
  ]);
};

/**
 * Unlocks an escrow's full principal from the payer, then distributes the shares
 * to the winners. Used when a single escrow pays out to more than one party
 * (splits and settlements, where resolution fees were already deducted).
 */
export const releaseEscrowPrincipal = async (
  tx: Tx,
  payerId: string,
  principalCents: number,
  shares: { user_id: string; amount_cents: number }[],
) => {
  if (principalCents <= 0) return;
  await ensureWallet(tx, payerId);

  const [updated] = await tx
    .update(platformBalance)
    .set({
      locked_cents: sql`${platformBalance.locked_cents} - ${principalCents}`,
      ...touch,
    })
    .where(
      and(
        eq(platformBalance.user_id, payerId),
        gte(platformBalance.locked_cents, principalCents),
      ),
    )
    .returning({ locked_cents: platformBalance.locked_cents });

  if (!updated) {
    throw new AppError(409, "Escrowed funds are missing or already released");
  }

  for (const share of shares) {
    await creditWallet(tx, share.user_id, share.amount_cents);
  }
};

/**
 * Verify the payer is genuinely holding this escrow's principal. A dispute can be
 * raised on a stale escrow row, and resolving it would otherwise pay out of
 * thin air.
 */
export const assertEscrowIsLocked = async (
  tx: Tx,
  userId: string,
  amountCents: number,
) => {
  const [row] = await tx
    .select({ lockedCents: platformBalance.locked_cents })
    .from(platformBalance)
    .where(eq(platformBalance.user_id, userId))
    .limit(1);

  if (!row || row.lockedCents < amountCents) {
    throw new AppError(409, "Escrow principal is not held for this payer");
  }
};

export const getWallet = async (userId: string) => {
  const [row] = await db
    .select({
      balanceCents: platformBalance.balance_cents,
      lockedCents: platformBalance.locked_cents,
    })
    .from(platformBalance)
    .where(eq(platformBalance.user_id, userId))
    .limit(1);

  const balanceCents = row?.balanceCents ?? 0;
  const lockedCents = row?.lockedCents ?? 0;

  return { balanceCents, lockedCents, totalCents: balanceCents + lockedCents };
};

/**
 * Audit helper: compare stored locked_cents against the escrows that should back
 * it. Any drift means a money path bypassed wallet.service.ts.
 */
export const reconcileWallet = async (userId: string) => {
  const { escrow, escrowParties } = await import("../drizzle/schema");

  const [expected] = await db
    .select({ total: sql<number>`coalesce(sum(${escrow.amountCents}), 0)::bigint` })
    .from(escrow)
    .innerJoin(escrowParties, eq(escrowParties.escrowId, escrow.id))
    .where(
      and(
        eq(escrowParties.userId, userId),
        eq(escrowParties.role, "payer"),
        sql`${escrow.status} in ('funded','disputed')`,
      ),
    );

  const wallet = await getWallet(userId);
  const expectedCents = Number(expected?.total ?? 0);

  return {
    ...wallet,
    expectedLockedCents: expectedCents,
    driftCents: wallet.lockedCents - expectedCents,
    inSync: wallet.lockedCents === expectedCents,
  };
};
