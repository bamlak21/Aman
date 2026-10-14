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

export type DisputeOffer = {
  id: string;
  dispute_id: string;
  offered_by: string;
  amount_cents: number;
  terms: string | null;
  status: "pending" | "accepted" | "rejected" | "expired" | "superseded";
  is_counter_offer: boolean;
  parent_offer_id: string | null;
  responded_at: string | null;
  expires_at: string | null;
  createdAt: string;
  offered_by_name: string | null;
};

export const dispute = {
  createDispute: async (data: DisputeInput): Promise<DisputeData> => {
    const res = await api.post("/api/dispute/create", data);
    return res.data;
  },
  listOffers: async (disputeId: string): Promise<DisputeOffer[]> => {
    const res = await api.get(`/api/dispute/${disputeId}/offers`);
    return res.data.data;
  },
  createOffer: async (disputeId: string, amountCents: number, terms?: string): Promise<DisputeOffer> => {
    const res = await api.post(`/api/dispute/${disputeId}/offers`, { amountCents, terms });
    return res.data;
  },
  acceptOffer: async (offerId: string): Promise<DisputeOffer> => {
    const res = await api.post(`/api/dispute/offers/${offerId}/accept`);
    return res.data;
  },
  rejectOffer: async (offerId: string): Promise<DisputeOffer> => {
    const res = await api.post(`/api/dispute/offers/${offerId}/reject`);
    return res.data;
  },
  counterOffer: async (offerId: string, amountCents: number, terms?: string): Promise<DisputeOffer> => {
    const res = await api.post(`/api/dispute/offers/${offerId}/counter`, { amountCents, terms });
    return res.data;
  },
};
