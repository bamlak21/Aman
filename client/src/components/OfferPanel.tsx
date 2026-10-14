import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  Clock,
  FileText,
  Gift,
  Handshake,
  Loader2,
  RotateCcw,
  Scale,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { dispute, type DisputeOffer } from "../api/dispute.api";
import ConfirmModal from "./ConfirmModal";

type OfferPanelProps = {
  disputeId: string;
  userId: string;
  escrowAmountCents?: number;
};

const fmt = (cents: number) => (cents / 100).toFixed(2);

const OfferPanel = ({ disputeId, userId, escrowAmountCents }: OfferPanelProps) => {
  const [offers, setOffers] = useState<DisputeOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | null>(null);
  const [formOpen, setFormOpen] = useState<"propose" | "counter" | null>(null);
  const [amount, setAmount] = useState("");
  const [terms, setTerms] = useState("");
  const [activeOffer, setActiveOffer] = useState<DisputeOffer | null>(null);

  const load = useCallback(
    async (silent = false) => {
      try {
        const data = await dispute.listOffers(disputeId);
        setOffers(data);
      } catch {
        if (!silent) toast.error("Failed to load offers");
      } finally {
        setLoading(false);
      }
    },
    [disputeId],
  );

  useEffect(() => {
    if (!disputeId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const interval = setInterval(() => void load(true), 12000);
    return () => clearInterval(interval);
  }, [disputeId, load]);

  const activePending = useMemo(
    () =>
      offers
        .filter((o) => o.status === "pending")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null,
    [offers],
  );

  const history = useMemo(
    () =>
      offers
        .filter((o) => !(activePending && o.id === activePending.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [offers, activePending],
  );

  const isMine = activePending?.offered_by === userId;
  const canRespond = !!activePending && !isMine;

  const openForm = (mode: "propose" | "counter") => {
    setFormOpen(mode);
    setAmount(mode === "counter" && activePending ? String(activePending.amount_cents) : "");
    setTerms("");
  };

  const resetAndReload = async () => {
    setFormOpen(null);
    setConfirmAction(null);
    setActiveOffer(null);
    await load();
  };

  const handleSubmit = async () => {
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (escrowAmountCents && cents > escrowAmountCents) {
      toast.error(`Amount cannot exceed ${fmt(escrowAmountCents)} ETB`);
      return;
    }
    setSubmitting(true);
    try {
      if (formOpen === "counter" && activeOffer) {
        await dispute.counterOffer(activeOffer.id, cents, terms.trim() || undefined);
        toast.success("Counter offer submitted");
      } else {
        await dispute.createOffer(disputeId, cents, terms.trim() || undefined);
        toast.success("Settlement offer submitted");
      }
      await resetAndReload();
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to submit offer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!activeOffer) return;
    setSubmitting(true);
    try {
      if (confirmAction === "accept") {
        await dispute.acceptOffer(activeOffer.id);
        toast.success("Offer accepted — funds disbursed");
      } else if (confirmAction === "reject") {
        await dispute.rejectOffer(activeOffer.id);
        toast.success("Offer rejected — dispute back under review");
      }
      await resetAndReload();
    } catch (e) {
      toast.error((e as { response?: { data?: { message?: string } } }).response?.data?.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      accepted: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      expired: "bg-gray-200 text-gray-600",
      superseded: "bg-gray-100 text-gray-500",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="mb-2 rounded-2xl border border-blue-200 bg-blue-50/60 overflow-hidden ">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-100/60 border-b border-blue-200">
        <Handshake size={15} className="text-blue-700" />
        <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
          Settlement Negotiation
        </h4>
        {loading && (
          <Loader2 size={13} className="ml-auto text-blue-400 animate-spin" />
        )}
      </div>

      <div className="px-4 py-3 space-y-3">
        {activePending ? (
          <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3 min-w-69 w-full">
            <div className="flex items-start justify-between gap-3 ">
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Scale size={14} className="text-blue-600" />
                  {fmt(activePending.amount_cents)} ETB
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  offered by{" "}
                  {activePending.offered_by_name || "the other party"}
                  {activePending.is_counter_offer && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                      counter
                    </span>
                  )}
                </p>
              </div>
              {activePending.expires_at && (
                <span className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                  <Clock size={11} />
                  {new Date(activePending.expires_at).toLocaleDateString()}
                </span>
              )}
            </div>
            {activePending.terms && (
              <p className="text-xs text-gray-600 flex items-start gap-1.5">
                <FileText size={13} className="text-gray-400 mt-0.5 shrink-0" />
                {activePending.terms}
              </p>
            )}
            <div className="flex md:gap-2 gap-1 md:m-0 -ml-2.5 pt-1">
              {canRespond ? (
                <>
                  <button
                    onClick={() => {
                      setActiveOffer(activePending);
                      setConfirmAction("accept");
                    }}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <Check size={13} />
                    Accept
                  </button>
                  <button
                    onClick={() => openForm("counter")}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    Counter
                  </button>
                  <button
                    onClick={() => {
                      setActiveOffer(activePending);
                      setConfirmAction("reject");
                    }}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <X size={13} />
                    Reject
                  </button>
                </>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                  <Clock size={13} />
                  Awaiting {activePending.offered_by_name || "the other party"}
                  &apos;s response...
                </p>
              )}
            </div>
          </div>
        ) : (
          !formOpen && (
            <button
              onClick={() => openForm("propose")}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-blue-300 text-blue-700 text-xs font-medium rounded-xl hover:bg-blue-100/60 transition"
            >
              <Gift size={14} />
              Propose a settlement offer
            </button>
          )
        )}

        {formOpen && (
          <div className="bg-white border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-900">
                {formOpen === "counter"
                  ? "Submit counter offer"
                  : "Propose settlement"}
              </p>
              <button
                onClick={() => setFormOpen(null)}
                className="p-1 hover:bg-gray-100 rounded-md"
                aria-label="Close form"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                ETB
              </span>
              <input
                type="number"
                min="0"
                max={amount}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                className="w-full pl-11 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition"
              />
            </div>
            <textarea
              rows={2}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Terms / conditions (optional)"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 transition"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setFormOpen(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition disabled:opacity-50"
              >
                {submitting && <Loader2 size={13} className="animate-spin" />}
                Submit
              </button>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">
              Offer history
            </p>
            {history.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-2 bg-white/70 border border-gray-200 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800">
                    {fmt(o.amount_cents)} ETB
                    {o.is_counter_offer && (
                      <span className="text-[10px] text-purple-600 ml-1">
                        counter
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {o.offered_by_name || "User"} ·{" "}
                    {o.responded_at
                      ? new Date(o.responded_at).toLocaleDateString()
                      : new Date(o.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize shrink-0 ${statusBadge(o.status)}`}
                >
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirmAction}
        icon={confirmAction === "accept" ? "Check" : "X"}
        color={confirmAction === "accept" ? "green-600" : "red-600"}
        title={
          confirmAction === "accept"
            ? "Accept settlement offer"
            : "Reject settlement offer"
        }
        message={
          confirmAction === "accept"
            ? activeOffer
              ? `Accepting ${fmt(activeOffer.amount_cents)} ETB will disburse the escrow funds and resolve the dispute. Continue?`
              : "Continue?"
            : "Rejecting this offer returns the dispute to review. Continue?"
        }
        confirmText={confirmAction === "accept" ? "Accept" : "Reject"}
        cancelText="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default OfferPanel;
