import { CreditCard, Loader2 } from "lucide-react";
import Heading from "../components/Heading";
import Placeholder from "../components/Placeholder";
import { useEffect, useState } from "react";
import { escrow, type EscrowData } from "../api/escrow.api";

const h = {
  heading: "Fund Escrow Transactions",
  subheading: "Review and fund your pending escrow transactions",
};

const FundEscrow = () => {
  const [pendingEscrows, setPendingEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [fundingId, setFundingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPendingEscrows();
  }, []);

  const fetchPendingEscrows = async () => {
    try {
      const res = await escrow.myEscrow();
      const pending = res.escrows.filter(
        (e) => e.status === "created" && e.myRole === "payer"
      );
      setPendingEscrows(pending);
    } catch (err) {
      console.error("Failed to fetch escrows:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFund = async (escrowId: string) => {
    setError("");
    setFundingId(escrowId);

    try {
      const result = await escrow.fundEscrow(escrowId);
      window.location.href = result.checkout_url;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to initialize payment");
      setFundingId(null);
    }
  };
  const getFullDate=(d:string)=>{
    const date = new Date(d).toLocaleString()
    return date;
  }

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
      <>
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
      </>
    );
  }

  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />

      <div className="p-5 flex flex-col gap-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl">
            {error}
          </div>
        )}

        {pendingEscrows.map((esc) => (
          <div
            key={esc.id}
            className="border border-gray-300 rounded-2xl p-5 flex justify-between items-center"
          >
            <div>
              <h3 className="font-semibold text-lg">
                Escrow #{esc.id.slice(0, 8)}
              </h3>
              <p className="text-gray-500 text-sm">
                Payee: {esc.payee?.name || "Unknown"}
              </p>
              <p className="text-gray-500 text-sm">
                Condition: {esc.releaseCondition}
              </p>
              <p className="text-gray-500 text-sm">Created At: {getFullDate(esc?.createdAt)  }</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-xl">
                  {(esc.amountCents / 100).toFixed(2)} ETB
                </p>
                <p className="text-sm text-yellow-600 font-medium">
                  Pending Funding
                </p>
              </div>
              <button
                onClick={() => handleFund(esc.id)}
                disabled={fundingId === esc.id}
                className="bg-black text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
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
        ))}
      </div>
    </>
  );
};

export default FundEscrow;
