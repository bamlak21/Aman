import { api } from "./main";

type Parties = {
  id: string;
  name: string;
};

export type EscrowData = {
  id: string;
  payer: Parties;
  payee: Parties;
  amountCents: number;
  releaseCondition: string;
  status: string;
  expiresAt: string;
  txRef: string | null;
  myRole: string;
  createdAt: string;
  updatedAt: string;
  milestoneDetails: string | null;
  fee?: number;
  totalToPay?: number;
};

type Escrow = {
  message: string;
  escrows: EscrowData[];
};

type CreateEscrowInput = {
  payeeEmail: string;
  amount: number;
  releaseCondition: string;
  expiresAt?: string;
  milestoneDetails?: string;
};

type CreateEscrowResponse = {
  id: string;
  status: string;
  amount: number;
  releaseCondition: string;
  expiresAt: string;
  message?: string;
};

type FundEscrowResponse = {
  message: string;
  tx_ref: string;
  checkout_url: string;
};
export type Txn = {
  id: string;
  escrowId: string;
  type: string;
  amountCents: number;
  fromAccount: string;
  toAccount?: string;
  createdAt: string;
  status: string;
  expiresAt: string;
  txRef: string | null;
  payer: {
    id: string;
    name: string;
  }
  payee: {
    id: string; 
   name: string 
  }
  releaseCondition: string;
  milestoneDetails?: string;
};
/**
 * Mirrors platform_balance. `balanceCents` is the spendable wallet and
 * `lockedCents` is the principal currently held by a funded/disputed escrow.
 * The two are independent buckets — funding an escrow does not reduce the
 * wallet, it moves money into the locked bucket where it cannot be spent.
 */
export type Wallet = {
  balanceCents: number;
  lockedCents: number;
  totalCents: number;
};

export const escrow = {
  myEscrow: async (): Promise<Escrow> => {
    const res = await api.get("/api/escrow");
    return res.data;
  },
  createEscrow: async (
    data: CreateEscrowInput,
  ): Promise<CreateEscrowResponse> => {
    const res = await api.post("/api/escrow/create", data);
    return res.data;
  },
  fundEscrow: async (escrowId: string): Promise<FundEscrowResponse> => {
    const res = await api.patch(`/api/escrow/${escrowId}/fund`);
    return res.data;
  },
  verifyPayment: async (escrowId: string, tx_ref: string) => {
    const res = await api.get("/api/escrow/verify-payment", {
      params: { escrowId, tx_ref },
    });
    return res.data;
  },
  myTotalEscrow: async (): Promise<Wallet> => {
    const res = await api.get("/api/escrow/getAmount");
    return res.data;
  },
  releaseEscrow: async (escrowId: string) => {
    const res = await api.patch(`/api/escrow/${escrowId}/release`);
    return res.data;
  },
  myTxn: async () => {
    const res = await api.get(`/api/escrow/fetchTxn`);
    return res.data;
  },
};
