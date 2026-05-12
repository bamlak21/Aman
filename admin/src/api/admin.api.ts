import type { userRegData } from "../types/auth";
import { api } from "./main";


export const admin = {
  me: async () => {
    const res = await api.get("/admin/me");
    return res.data;
  },
  users: async () => {
    const res = await api.get("/api/admin/users");
    return res.data;
  },
  newUser: async (data: userRegData) => {
    const res = await api.post("/api/admin/newUser", data);
    return res.data;
  },
  fetchDispute: async () => {
    const res = await api.get("/api/admin/fetch-dispute");
    return res.data;
  },
  resolveDispute: async (disputeId: string, resolution: string) => {
    const res = await api.patch(`/api/admin/dispute/${disputeId}/resolve`, {
      resolution,
    });
    return res.data;
  },
  updateDisputeStatus: async (disputeId: string, status: string) => {
    const res = await api.patch(`/api/admin/dispute/${disputeId}/status`, {
      status,
    });
    return res.data;
  },
  fetchTransactions: async () => {
    const res = await api.get("/api/admin/transactions");
    return res.data;
  },
  suspendUser: async(userId:string,isActive:boolean)=>{
    const res  = await api.patch(`/api/admin/${userId}/revoke`,{isActive});
    res.data;
  }
};
