import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  FileText,
  User,
  Calendar,
  CheckCircle,
  MessageSquare,
  Filter,
  X,
  Hash,
  Clock,
  Brain,
  Paperclip,
  Tag,
  Undo2,
  Send,
  Split,
  Ban,
  Check,
  Scale,
  Loader2,
  ShieldAlert,
  Handshake,
} from "lucide-react";
import { admins } from "../api/admin.api";
import toast from "react-hot-toast";
import axios from "axios";

const apiUrl = import.meta.env.VITE_BASE_API_URL || "";

type DisputeEvidence = {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  type: string;
  evidence_url: string[];
  description: string | null;
  createdAt: string;
};

type DisputeOfferRow = {
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
};

type DisputeData = {
  id: string;
  escrow_id: string;
  reporter_id: string;
  reported_id: string;
  dispute_type: string;
  resolution: string | null;
  status: string;
  reason: string;
  evidence_url: string[];
  createdAt: string;
  updatedAt: string;
  reporter_name?: string;
  reported_name?: string;
  escrow_amount?: number;
  ai_severity_analysis?: string;
  ai_suggested_path?: string;
  ai_confidence?: number;
  evidence?: DisputeEvidence[];
  offers?: DisputeOfferRow[];
};

type ResolutionType = "refund_payer" | "release_payee" | "split" | "cancel";

const RESOLUTION_OPTIONS = [
  {
    value: "refund_payer",
    label: "Refund to Payer",
    desc: "Return funds to the payer",
    icon: Undo2,
    chip: "bg-amber-100 text-amber-700",
  },
  {
    value: "release_payee",
    label: "Release to Payee",
    desc: "Release funds to the payee",
    icon: Send,
    chip: "bg-blue-100 text-blue-700",
  },
  {
    value: "split",
    label: "Split Funds",
    desc: "Divide between both parties",
    icon: Split,
    chip: "bg-purple-100 text-purple-700",
  },
  {
    value: "cancel",
    label: "Cancel Escrow",
    desc: "Cancel the escrow entirely",
    icon: Ban,
    chip: "bg-red-100 text-red-700",
  },
] as const;

const DisputesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeData | null>(
    null,
  );
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedResolution, setSelectedResolution] =
    useState<ResolutionType>("refund_payer");
  const [resolving, setResolving] = useState(false);

  const loadDisputes = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await admins.fetchDispute();
      const list = data || [];
      setDisputes(list);
      setSelectedDispute((prev) => {
        if (!prev) return prev;
        return list.find((d) => d.id === prev.id) ?? prev;
      });
    } catch (error) {
      console.error("Failed to load disputes:", error);
      if (!silent) toast.error("Failed to load disputes");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDisputes();
  }, []);

  useEffect(() => {
    if (!showDetailModal) return;
    const interval = setInterval(() => {
      loadDisputes(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [showDetailModal]);

  const resolveDispute = async (
    disputeId: string,
    resolution: ResolutionType,
  ) => {
    setResolving(true);
    try {
      await admins.resolveDispute(disputeId, resolution);
      toast.success("Dispute resolved successfully");
      setShowResolveModal(false);
      setSelectedDispute(null);
      loadDisputes();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to resolve dispute",
        );
      } else {
        toast.error("Failed to resolve dispute");
      }
    } finally {
      setResolving(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.reason.toLowerCase().includes(search.toLowerCase()) ||
      d.dispute_type.toLowerCase().includes(search.toLowerCase()) ||
      d.id.slice(0, 8).toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      d.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "negotiating":
        return "bg-blue-100 text-blue-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      non_delivery: "Non-Delivery",
      quality_issue: "Quality Issue",
      fraud: "Fraud",
      breach_of_terms: "Breach of Terms",
      other: "Other",
    };
    return labels[type] || type;
  };

  const getResolutionLabel = (resolution: string) => {
    const labels: Record<string, string> = {
      refund_payer: "Refund to Payer",
      release_payee: "Release to Payee",
      split: "Split Funds",
      cancel: "Cancel Escrow",
    };
    return labels[resolution] || resolution;
  };

  const getSeverityColor = (severity: string) => {
    const map: Record<string, string> = {
      low: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-orange-100 text-orange-700",
      critical: "bg-red-100 text-red-700",
    };
    return map[severity] || "bg-gray-100 text-gray-600";
  };

  const getOfferStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-blue-100 text-blue-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      expired: "bg-gray-200 text-gray-600",
      superseded: "bg-gray-100 text-gray-500",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const getOfferCard = (status: string) => {
    const map: Record<string, string> = {
      pending: "border-blue-200 bg-blue-50/60",
      accepted: "border-green-200 bg-green-50/60",
      rejected: "border-red-200 bg-red-50/50",
      superseded: "border-gray-200 bg-gray-50",
      expired: "border-gray-200 bg-gray-50",
    };
    return map[status] || "border-gray-200 bg-gray-50";
  };

  const getOfferIcon = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-blue-100 text-blue-700",
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      superseded: "bg-gray-200 text-gray-500",
      expired: "bg-gray-200 text-gray-500",
    };
    return map[status] || "bg-gray-200 text-gray-500";
  };

  const offerStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <CheckCircle size={16} />;
      case "rejected":
        return <X size={16} />;
      case "pending":
        return <Clock size={16} />;
      default:
        return <Ban size={16} />;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const pendingCount = disputes.filter((d) => d.status === "Pending").length;
  const negotiatingCount = disputes.filter(
    (d) => d.status === "InNegotiation",
  ).length;
  const resolvedCount = disputes.filter((d) => d.status === "Resolved").length;

  if (loading) {
    return (
      <div className="flex flex-col p-6 w-full min-h-full">
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col p-6 w-full min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Disputes</h1>
          <p className="text-gray-500 mt-1">
            Manage and resolve escrow disputes
          </p>
        </div>
        <button
          onClick={() => loadDisputes()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingCount}
              </p>
            </div>
            <AlertTriangle className="text-yellow-500" size={28} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Negotiating</p>
              <p className="text-2xl font-bold text-blue-600">
                {negotiatingCount}
              </p>
            </div>
            <MessageSquare className="text-blue-500" size={28} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-green-600">
                {resolvedCount}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={28} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search disputes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-0 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 mr-3" />
            {["All", "Pending", "Negotiating", "Resolved"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status.toLowerCase())}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  statusFilter === status.toLowerCase()
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {status}
              </button>
            ))}
            <span className="text-sm text-gray-500 ml-2">
              {filteredDisputes.length} dispute
              {filteredDisputes.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Dispute
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertTriangle size={32} />
                      <p>No disputes found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {dispute.reason.slice(0, 50)}
                          {dispute.reason.length > 50 ? "..." : ""}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Escrow: {dispute.escrow_id.slice(0, 8)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                        {getTypeLabel(dispute.dispute_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(dispute.status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            dispute.status === "Pending"
                              ? "bg-yellow-500"
                              : dispute.status === "Negotiating"
                                ? "bg-blue-500"
                                : "bg-green-500"
                          }`}
                        />
                        {dispute.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(dispute.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedDispute(dispute);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 hover:bg-gray-200 rounded transition"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {dispute.status === "Negotiating" && (
                          <button
                            onClick={() => {
                              navigate(`/disputes/${dispute.id}/chat`);
                            }}
                            className="p-1.5 hover:bg-blue-100 text-blue-600 rounded transition"
                            title="Open Chat"
                          >
                            <MessageSquare size={16} />
                          </button>
                        )}
                        {dispute.status !== "Resolved" && (
                          <button
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setShowResolveModal(true);
                            }}
                            className="p-1.5 hover:bg-green-100 text-green-600 rounded transition"
                            title="Resolve"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative p-6 bg-linear-to-r from-gray-900 to-gray-700 overflow-hidden">
              <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/5" />
              <div className="absolute -right-2 -bottom-14 w-32 h-32 rounded-full bg-white/5" />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                    <ShieldAlert size={24} className="text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Dispute Details
                    </h2>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Escrow {selectedDispute.escrow_id.slice(0, 8)} ·{" "}
                      {getTypeLabel(selectedDispute.dispute_type)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedDispute.status)}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedDispute.status === "Pending"
                        ? "bg-yellow-500"
                        : selectedDispute.status === "Negotiating"
                          ? "bg-blue-500"
                          : "bg-green-500"
                    }`}
                  />
                  {selectedDispute.status}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                  <Tag size={12} />
                  {getTypeLabel(selectedDispute.dispute_type)}
                </span>
                {selectedDispute.resolution && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    <CheckCircle size={12} />
                    {getResolutionLabel(selectedDispute.resolution)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <FileText size={16} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                      Escrow
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedDispute.escrow_id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                      Created
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(selectedDispute.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Hash size={16} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                      Dispute ID
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedDispute.id.slice(0, 8)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Clock size={16} className="text-gray-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                      Last updated
                    </p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(selectedDispute.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Parties
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 border border-green-100 bg-green-50/60 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <User size={18} className="text-green-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-green-700 font-medium uppercase tracking-wide">
                        Reporter
                      </p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {selectedDispute.reporter_name ||
                          selectedDispute.reporter_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border border-red-100 bg-red-50/60 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <ShieldAlert size={18} className="text-red-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-red-700 font-medium uppercase tracking-wide">
                        Reported
                      </p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {selectedDispute?.reported_name ||
                          selectedDispute.reported_id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
                  <MessageSquare size={15} />
                  Reason
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {selectedDispute.reason}
                </p>
              </div>

              {selectedDispute.offers && selectedDispute.offers.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                    <Handshake size={15} />
                    Settlement Offers
                    <span className="ml-auto text-xs font-medium text-gray-400">
                      {selectedDispute.offers.length}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {[...selectedDispute.offers]
                      .sort(
                        (a, b) =>
                          new Date(a.createdAt).getTime() -
                          new Date(b.createdAt).getTime(),
                      )
                      .map((offer) => (
                        <div
                          key={offer.id}
                          className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${getOfferCard(offer.status)}`}
                        >
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getOfferIcon(offer.status)}`}
                          >
                            {offerStatusIcon(offer.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {(offer.amount_cents / 100).toFixed(2)} ETB
                              </p>
                              {offer.is_counter_offer && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                  counter
                                </span>
                              )}
                            </div>
                            {offer.terms && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {offer.terms}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {offer.offered_by.slice(0, 8)} ·{" "}
                              {formatDate(
                                offer.responded_at || offer.createdAt,
                              )}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold capitalize shrink-0 ${getOfferStatusBadge(offer.status)}`}
                          >
                            {offer.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {selectedDispute.evidence &&
                selectedDispute.evidence.length > 0 && (
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                      <Paperclip size={15} />
                      Evidence
                      <span className="ml-auto text-xs font-medium text-gray-400">
                        {selectedDispute.evidence.reduce(
                          (n, e) => n + e.evidence_url.length,
                          0,
                        )}
                      </span>
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedDispute.evidence.flatMap((ev) =>
                        ev.evidence_url.map((url, i) => {
                          const fullUrl = url.startsWith("http")
                            ? url
                            : `${apiUrl}${url}`;
                          return (
                            <a
                              key={`${ev.id}-${i}`}
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                            >
                              <FileText size={14} />
                              Evidence {i + 1}
                            </a>
                          );
                        }),
                      )}
                    </div>
                  </div>
                )}

              {(selectedDispute.ai_suggested_path ||
                selectedDispute.ai_severity_analysis) && (
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-indigo-800 mb-3">
                    <Brain size={15} />
                    AI Analysis
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedDispute.ai_severity_analysis && (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getSeverityColor(selectedDispute.ai_severity_analysis)}`}
                      >
                        <AlertTriangle size={12} />
                        {selectedDispute.ai_severity_analysis}
                      </span>
                    )}
                    {selectedDispute.ai_suggested_path && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-white border border-indigo-200 text-indigo-700 capitalize">
                        <Scale size={12} />
                        {selectedDispute.ai_suggested_path.replace(/_/g, " ")}
                      </span>
                    )}
                    {typeof selectedDispute.ai_confidence === "number" && (
                      <span className="text-xs text-gray-500 font-medium">
                        Confidence: {selectedDispute.ai_confidence}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/60 flex gap-3">
              {selectedDispute.status !== "Resolved" && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowResolveModal(true);
                  }}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium inline-flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} />
                  Resolve Dispute
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium inline-flex items-center justify-center gap-2"
              >
                <X size={16} />
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                  <Scale size={22} className="text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Resolve Dispute
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Escrow {selectedDispute.escrow_id.slice(0, 8)} · Choose how
                    to distribute the funds
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RESOLUTION_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const selected = selectedResolution === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setSelectedResolution(option.value)}
                      className={`relative p-4 rounded-xl border-2 text-left transition group ${
                        selected
                          ? "border-green-600 bg-green-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                      <div
                        className={`w-10 h-10 rounded-lg ${option.chip} flex items-center justify-center mb-2.5 transition group-hover:scale-110`}
                      >
                        <Icon size={18} />
                      </div>
                      <p className="font-semibold text-sm text-gray-900">
                        {option.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {option.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl flex gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium inline-flex items-center justify-center gap-2"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                onClick={() =>
                  resolveDispute(selectedDispute.id, selectedResolution)
                }
                disabled={resolving}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {resolving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                {resolving ? "Resolving..." : "Confirm Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputesPage;
