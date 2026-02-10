import { api } from "./main";

export type EscrowData = {
  id: string;
  payerId: string;
  payeeId: string;
  amountCents: number;
  releaseCondition: string;
  status: string;
  expiresAt: string;
};

type Escrow = {
  message: string;
  escrows: EscrowData[];
};

export const escrow = {
  myEscrow: async (): Promise<Escrow> => {
    const res = await api.get("/escrow");
    return res.data;
  },
};
