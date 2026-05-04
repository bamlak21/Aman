import { api } from "./main";

export type fundingData = {
    escrow_id:string,
    tx_ref: string,
    userId: string,
    amountCents:number,
    isFunded: boolean,
}
export type fundEscrow = {
  message: string;
  escrows: fundingData[];
};
export type createFund ={
  escrow_id:string,
  user_id:string,
}
export type fundResponse = {
  message?: string;
  tx_ref: string;
  checkout_url: string;
};

export const fund = {
   createFund: async(data:createFund):Promise<fundResponse> =>{
    const res = await api.patch(`api/escrow/${data.escrow_id}/fund`);
    return res.data;
   }
}