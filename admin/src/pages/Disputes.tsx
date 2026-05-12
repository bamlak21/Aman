import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Eye,
  FileText,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { admin } from "../api/admin.api";
import toast from "react-hot-toast";
import axios from "axios";
import ConfirmModal from "../components/ConfirmModal";

const apiUrl = import.meta.env.VITE_BASE_API_URL || "";

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
};

type ResolutionType = "refund_payer" | "release_payee" | "split" | "cancel";

const DisputesPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [disputes, setDisputes] = useState<DisputeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<DisputeData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionType>("refund_payer");
  const [resolving, setResolving] = useState(false);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const data = await admin.fetchDispute();
      setDisputes(data || []);
    } catch (error) {
      console.error("Failed to load disputes:", error);
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const resolveDispute = async (disputeId: string, resolution: ResolutionType) => {
    setResolving(true);
    try {
      await admin.resolveDispute(disputeId, resolution);
      toast.success("Dispute resolved successfully");
      setShowResolveModal(false);
      setSelectedDispute(null);
      loadDisputes();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to resolve dispute");
      } else {
        toast.error("Failed to resolve dispute");
      }
    } finally {
      setResolving(false);
    }
  };

  const updateDisputeStatus = async (disputeId: string, status: string) => {
    try {
      await admin.updateDisputeStatus(disputeId, status);
      toast.success("Dispute status updated");
      loadDisputes();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Failed to update status");
      } else {
        toast.error("Failed to update status");
      }
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.reason.toLowerCase().includes(search.toLowerCase()) ||
      d.dispute_type.toLowerCase().includes(search.toLowerCase()) ||
      d.id.slice(0, 8).toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status.toLowerCase() === statusFilter.toLowerCase();
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const pendingCount = disputes.filter((d) => d.status === "Pending").length;
  const negotiatingCount = disputes.filter((d) => d.status === "Negotiating").length;
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
          <p className="text-gray-500 mt-1">Manage and resolve escrow disputes</p>
        </div>
        <button
          onClick={loadDisputes}
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
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <AlertTriangle className="text-yellow-500" size={28} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Negotiating</p>
              <p className="text-2xl font-bold text-blue-600">{negotiatingCount}</p>
            </div>
            <MessageSquare className="text-blue-500" size={28} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
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
            {["all", "Pending", "Negotiating", "Resolved"].map((status) => (
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
              {filteredDisputes.length} dispute{filteredDisputes.length !== 1 ? "s" : ""}
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Dispute Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedDispute.status)}`}>
                  {selectedDispute.status}
                </span>
                <span className="px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">
                  {getTypeLabel(selectedDispute.dispute_type)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <User size={16} className="text-gray-500" />
                  <span className="text-gray-500">Escrow:</span>
                  <span className="font-medium">{selectedDispute.escrow_id.slice(0, 8)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{formatDate(selectedDispute.createdAt)}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Reason</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
                  {selectedDispute.reason}
                </p>
              </div>

              {selectedDispute.evidence_url && selectedDispute.evidence_url.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FileText size={16} />
                    Evidence
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedDispute.evidence_url.map((url, i) => {
                        const fullUrl = url.startsWith("http") ? url : `${apiUrl}${url}`;
                        return (
                          <a
                            key={i}
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                          >
                            Evidence {i + 1}
                          </a>
                        );
                      })}
                  </div>
                </div>
              )}

              {selectedDispute.resolution && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Resolution</h3>
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">
                    {getResolutionLabel(selectedDispute.resolution)}
                  </span>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              {selectedDispute.status !== "Resolved" && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowResolveModal(true);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Resolve Dispute
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Resolve Dispute</h2>
              <p className="text-sm text-gray-500 mt-1">Choose how to resolve this dispute</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "refund_payer", label: "Refund to Payer", desc: "Return funds to the payer" },
                  { value: "release_payee", label: "Release to Payee", desc: "Release funds to payee" },
                  { value: "split", label: "Split Funds", desc: "Divide between both parties" },
                  { value: "cancel", label: "Cancel Escrow", desc: "Cancel the escrow entirely" },
                ] as const).map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedResolution(option.value)}
                    className={`p-4 rounded-xl border-2 text-left transition ${
                      selectedResolution === option.value
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{option.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowResolveModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => resolveDispute(selectedDispute.id, selectedResolution)}
                disabled={resolving}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
              >
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
