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
};

type Escrow = {
  message: string;
  escrows: EscrowData[];
};

type createEscrow = {
  payeeId: string
  amount: 1
  releaseConditions: string
}

export const escrow = {
  myEscrow: async (): Promise<Escrow> => {
    const res = await api.get("/escrow");
    return res.data;
  },
  createEscrow: async(data: )=>{
    const res = await api.post("/escrow/create", {

    })
  }
};
