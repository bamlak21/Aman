import { Calendar, CreditCard, Loader2 } from "lucide-react";
import Heading from "../components/Heading";
import Placeholder from "../components/Placeholder";
import { useEffect, useState } from "react";
import { escrow, type EscrowData } from "../api/escrow.api";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

const h = {
  heading: "Fund Escrow Transactions",
  subheading: "Review and fund your pending escrow transactions",
};

const FundEscrow = () => {
  const [pendingEscrows, setPendingEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const fetchPendingEscrows = async () => {
      const res = await escrow.myEscrow();
      return res.escrows.filter(
        (e) => e.status === "created" && e.myRole === "payer"
      );
    };

    const verifyReturnedPayment = async (escrows: EscrowData[]) => {
      const txRef = searchParams.get("tx_ref");
      const status = searchParams.get("status");
      if (!txRef) return;
      setSearchParams({}, { replace: true });

      if (status && status !== "success") {
        setError(`Payment ${status}`);
        return;
      }

      const matched = escrows.find((e) => e.txRef === txRef);
      if (!matched) return;

      try {
        await escrow.verifyPayment(matched.id, txRef);
        toast.success("Payment verified - escrow funded");
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const msg = err.response?.data?.message;
          if (msg && msg.toLowerCase().includes("already funded")) {
            toast.success("Escrow already funded");
          } else {
            const errMsg = msg || "Payment verification failed";
            setError(errMsg);
            toast.error(errMsg);
          }
        }
      }
    };

    const init = async () => {
      try {
        const pending = await fetchPendingEscrows();
        setPendingEscrows(pending);
        await verifyReturnedPayment(pending);
        setPendingEscrows(await fetchPendingEscrows());
      } catch (err) {
        console.error("Failed to fetch escrows:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFund = async (escrowId: string) => {
    setError("");
    setFundingId(escrowId);

    try {
      const result = await escrow.fundEscrow(escrowId);
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = result.checkout_url;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to initialize payment");
        setFundingId(null);
      }
    }
  };
  const getFullDate = (d: string) => {
    const date = new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return date;
  };

  if (loading) {
    return (
      <>
        <Heading heading={h.heading} subheading={h.subheading} />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-gray-500" />
        </div>
      </>
    );
  }

  if (pendingEscrows.length === 0) {
    return (
      <div className="p-3 lg:p-5">
        <Heading heading={h.heading} subheading={h.subheading} />
        <div className="p-5">
          <Placeholder
            icon={CreditCard}
            heading="No Pending Transactions"
            subheading="All your escrow transactions have been funded"
            btnTxt="Create New Escrow"
            btnPath="/create-escrow"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-5 bg-white min-h-screen">
      <Heading heading={h.heading} subheading={h.subheading} />

      <div className="p-2 flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl">
            {error}
          </div>
        )}
        <div className="grid lg:grid-cols-2 gap-5 grid-cols-1 ">
          {pendingEscrows.map((esc) => (
            <div
              key={esc.id}
              className="border border-gray-300 rounded-2xl p-3 flex flex-col bg-gray-100 "
            >
              <div className="flex justify-between gap-5 flex-col md:flex-row">
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold text-lg text-wrap inline-flex">
                    Escrow #{esc.id.slice(0, 8)}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Payee: {esc.payee?.name || "Unknown"}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Condition: {esc.releaseCondition}
                  </p>
                  <p className="text-gray-500 text-sm inline-flex text-wrap gap-1">
                    <Calendar />
                    {getFullDate(esc?.createdAt)}
                  </p>
                </div>
                <div className="">
                  <p className="font-bold text-xl">
                    {(esc.amountCents / 100).toFixed(2)} ETB
                  </p>
                  <p className="text-sm text-amber-600 font-medium">
                    App fee (15%): {((esc.amountCents * 0.15) / 100).toFixed(2)} ETB
                  </p>
                  <p className="text-sm text-gray-700 font-medium">
                    Total to pay: {((esc.amountCents * 1.15) / 100).toFixed(2)} ETB
                  </p>
                  <p className="text-sm text-yellow-600 font-medium text-wrap mt-1">
                    Pending Funding
                  </p>
                  <button
                    onClick={() => handleFund(esc.id)}
                    disabled={fundingId === esc.id}
                    className="bg-black text-white px-6 py-2 mt-5 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {fundingId === esc.id ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} />
                        Fund Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FundEscrow;
