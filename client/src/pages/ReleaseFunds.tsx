import { CheckCircle, Loader2 } from "lucide-react";
import Heading from "../components/Heading";
import Placeholder from "../components/Placeholder";
import { useEffect, useState } from "react";
import { escrow, type EscrowData } from "../api/escrow.api";
import toast from "react-hot-toast";

const h = {
  heading: "Release Escrow Funds",
  subheading: "Review completed work and release funds to payees",
};

const ReleaseFunds = () => {
  const [fundedEscrows, setFundedEscrows] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasingId, setReleasingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFundedEscrows();
  }, []);

  const fetchFundedEscrows = async () => {
    try {
      const res = await escrow.myEscrow();
      const funded = res.escrows.filter(
        (e) => e.status === "funded" && e.myRole === "payer"
      );
      setFundedEscrows(funded);
    } catch (err) {
      console.error("Failed to fetch funded escrows:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRelease = async (escrowId: string) => {
    setError("");
    setReleasingId(escrowId);

    try {
      toast.success("Funds released successfully");
      await fetchFundedEscrows();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to release funds");
    } finally {
      setReleasingId(null);
    }
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

  if (fundedEscrows.length === 0) {
    return (
      <>
        <Heading heading={h.heading} subheading={h.subheading} />
        <div className="p-5">
          <Placeholder
            icon={CheckCircle}
            heading="No funded transactions"
            subheading="You don't have any funded escrow transactions ready for release"
            btnTxt="Fund Escrow"
            btnPath="/fund-escrow"
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

        {fundedEscrows.map((esc) => (
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
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-xl">
                  {(esc.amountCents / 100).toFixed(2)} ETB
                </p>
                <p className="text-sm text-green-600 font-medium">
                  Ready to Release
                </p>
              </div>
              <button
                onClick={() => handleRelease(esc.id)}
                disabled={releasingId === esc.id}
                className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 hover:bg-green-700"
              >
                {releasingId === esc.id ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Releasing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Release Funds
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

export default ReleaseFunds;
