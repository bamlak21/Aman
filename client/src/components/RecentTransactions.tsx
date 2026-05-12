import { useEffect, useState } from "react";
import { escrow } from "../api/escrow.api";
import { useNavigate } from "react-router-dom";

type EscrowItem = {
  id: string;
  payer: { name: string } | null;
  payee: { name: string } | null;
  amountCents: number;
  status: string;
  myRole: string;
  updatedAt: string;
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "created":
      return "bg-yellow-100 text-yellow-700";
    case "funded":
      return "bg-blue-100 text-blue-700";
    case "released":
      return "bg-green-100 text-green-700";
    case "disputed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const RecentTransactions = () => {
  const [recent, setRecent] = useState<EscrowItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await escrow.myEscrow();
        const sorted = (res.escrows || []).sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setRecent(sorted.slice(0, 5));
      } catch (error) {
        console.error("Failed to fetch recent transactions:", error);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="flex-1 border border-gray-300 p-5 rounded-2xl min-w-[280px]">
      <div>
        <h2 className="font-semibold text-lg">Recent Transactions</h2>
        <h6 className="text-md font-light text-gray-400">
          Your latest escrow transactions
        </h6>
      </div>

      <div className="mt-3 w-full">
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No transactions yet
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {recent.map((esc) => {
              const otherParty =
                esc.myRole === "payer" ? esc.payee : esc.payer;
              const direction = esc.myRole === "payer" ? "To" : "From";
              return (
                <div
                  key={esc.id}
                  className="flex p-2 rounded justify-between border border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate("/transactions")}
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <h2 className="truncate">
                      {direction} {otherParty?.name || "Unknown"}{" "}
                      <span
                        className={`px-2 rounded-2xl text-sm ${getStatusStyle(esc.status)}`}
                      >
                        {esc.status}
                      </span>
                    </h2>
                    <p className="text-sm font-light text-gray-600 truncate">
                      Escrow #{esc.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right ml-3">
                    <h2 className="font-semibold text-sm">
                      {(esc.amountCents / 100).toFixed(0)} ETB
                    </h2>
                    <p className="font-light text-sm text-gray-600">
                      {new Date(esc.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
