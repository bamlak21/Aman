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
  message?:string;
};

type FundEscrowResponse = {
  message: string;
  tx_ref: string;
  checkout_url: string;
};

export const escrow = {
  myEscrow: async (): Promise<Escrow> => {
    const res = await api.get("/api/escrow");
    return res.data;
  },
  createEscrow: async (data: CreateEscrowInput): Promise<CreateEscrowResponse> => {
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
};
