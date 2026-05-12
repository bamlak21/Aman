import { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Search,
  RefreshCw,
  Eye,
  Filter,
  XCircle,
} from "lucide-react";
import { admin } from "../api/admin.api";
import ConfirmModal from "../components/ConfirmModal";

type EscrowData = {
  id: string;
  amountCents: number;
  status: string;
  releaseCondition: string;
  expiresAt: string;
  milestoneDetails: string | null;
  txRef: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  payerName: string;
  payerEmail: string;
  payeeName: string;
  payeeEmail: string;
};

const TransactionsPage = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [transactions, setTransactions] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<EscrowData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await admin.fetchTransactions();
      setTransactions(data || []);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.payerName.toLowerCase().includes(search.toLowerCase()) ||
      t.payeeName.toLowerCase().includes(search.toLowerCase()) ||
      t.id.slice(0, 8).toLowerCase().includes(search.toLowerCase()) ||
      t.payerEmail.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "created":
        return "bg-yellow-100 text-yellow-700";
      case "funded":
        return "bg-blue-100 text-blue-700";
      case "released":
        return "bg-green-100 text-green-700";
      case "disputed":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      case "expired":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getConditionLabel = (c: string) => {
    const labels: Record<string, string> = {
      manual: "Manual",
      auto_after_date: "Auto After Date",
      milestone: "Milestone",
    };
    return labels[c] || c;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalValue = transactions
    .filter((t) => t.status === "funded" || t.status === "released")
    .reduce((sum, t) => sum + t.amountCents, 0);

  const createdCount = transactions.filter((t) => t.status === "created").length;
  const fundedCount = transactions.filter((t) => t.status === "funded").length;
  const releasedCount = transactions.filter((t) => t.status === "released").length;
  const disputedCount = transactions.filter((t) => t.status === "disputed").length;

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
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">Monitor all escrow transactions across the platform</p>
        </div>
        <button
          onClick={loadTransactions}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase">Created</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{createdCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase">Funded</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fundedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase">Released</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{releasedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase">Disputed</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{disputedCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium uppercase">Total Value</p>
          <p className="text-lg font-bold text-gray-900 mt-1">{(totalValue / 100).toFixed(0)} ETB</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-0 focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter size={14} className="text-gray-400" />
            {["all", "created", "funded", "released", "disputed", "cancelled", "expired"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 text-xs rounded-lg transition capitalize ${
                    statusFilter === status
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              )
            )}
            <span className="text-xs text-gray-500 ml-2">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Escrow
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Payee
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <ArrowRightLeft size={32} />
                      <p>No transactions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <p className="font-mono text-sm text-gray-600">
                        {txn.id.slice(0, 8)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900">{txn.payerName || "N/A"}</p>
                      <p className="text-xs text-gray-500">{txn.payerEmail || "N/A"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900">{txn.payeeName || "N/A"}</p>
                      <p className="text-xs text-gray-500">{txn.payeeEmail || "N/A"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold">{(txn.amountCents / 100).toFixed(2)} ETB</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(txn.status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            txn.status === "created"
                              ? "bg-yellow-500"
                              : txn.status === "funded"
                              ? "bg-blue-500"
                              : txn.status === "released"
                              ? "bg-green-500"
                              : txn.status === "disputed"
                              ? "bg-red-500"
                              : "bg-gray-400"
                          }`}
                        />
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {getConditionLabel(txn.releaseCondition)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {formatDate(txn.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedTxn(txn);
                          setShowDetailModal(true);
                        }}
                        className="p-1.5 hover:bg-gray-200 rounded transition"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTxn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition"
                >
                  <XCircle/>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedTxn.status)}`}>
                  {selectedTxn.status}
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {(selectedTxn.amountCents / 100).toFixed(2)} ETB
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Payer</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTxn.payerName || "N/A"}</p>
                  <p className="text-xs text-gray-500">{selectedTxn.payerEmail || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Payee</p>
                  <p className="text-sm font-medium text-gray-900">{selectedTxn.payeeName || "N/A"}</p>
                  <p className="text-xs text-gray-500">{selectedTxn.payeeEmail || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Release Condition</p>
                  <p className="text-sm text-gray-900">{getConditionLabel(selectedTxn.releaseCondition)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Expires At</p>
                  <p className="text-sm text-gray-900">
                    {selectedTxn.expiresAt ? formatDateTime(selectedTxn.expiresAt) : "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Created</p>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedTxn.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Last Updated</p>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedTxn.updatedAt)}</p>
                </div>
              </div>

              {selectedTxn.paidAt && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Paid At</p>
                  <p className="text-sm text-green-600 font-medium">{formatDateTime(selectedTxn.paidAt)}</p>
                </div>
              )}

              {selectedTxn.txRef && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Transaction Reference</p>
                  <p className="text-sm font-mono text-gray-900">{selectedTxn.txRef}</p>
                </div>
              )}

              {selectedTxn.milestoneDetails && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Milestone Details</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mt-1">
                    {selectedTxn.milestoneDetails}
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
