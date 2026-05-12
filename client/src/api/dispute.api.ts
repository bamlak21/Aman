import { api } from "./main";

export type DisputeInput = {
  escrow_id: string;
  reported_id: string;
  dispute_type: "non_delivery" | "quality_issue" | "fraud" | "breach_of_terms" | "other";
  reason: string;
  evidence_url: string[];
};

export type DisputeData = {
  id: string;
  escrow_id: string;
  reporter_id: string;
  reported_id: string;
  dispute_type: string;
  reason: string;
  evidence_url: string[];
  status: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
};

export const dispute = {
  createDispute: async (data: DisputeInput): Promise<DisputeData> => {
    const res = await api.post("/api/dispute/create", data);
    return res.data;
  },
};
