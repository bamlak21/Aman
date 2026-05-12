import {
  Calendar,
  DollarSign,
  Eye,
  FileText,
  ShieldAlert,
  User,
} from "lucide-react";
import Heading from "../components/Heading";
import { escrow, type EscrowData } from "../api/escrow.api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const h = {
  heading: "Transactions",
  subheading: "Manage and monitor your escrow transactions",
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status: string) => {
  switch (status) {
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
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Transactions = () => {
  const [txns, setTxns] = useState<EscrowData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTxns = async () => {
      try {
        const data = await escrow.myEscrow();
        setTxns(data?.escrows || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTxns();
  }, []);

  if (loading) {
    return (
      <>
        <Heading heading={h.heading} subheading={h.subheading} />
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </>
    );
  }

  if (txns.length === 0) {
    return (
      <>
        <Heading heading={h.heading} subheading={h.subheading} />
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No transactions found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />
      {txns.map((esc) => {
        return (
          <div
            className="mt-5 p-5 flex flex-col gap-10 border border-gray-300 rounded-xl"
            key={esc.id}
          >
            <div className="flex justify-between">
              <div className="flex flex-col">
                <h2 className="font-semibold">
                  Escrow: <span className="font-light mr-1">{esc.id.slice(0, 8)}...</span>
                  <span className={`${getStatusColor(esc.status)} rounded-2xl text-sm px-2 py-1 font-medium ml-2`}>
                    {esc.status}
                  </span>
                  <p className="mt-1 font-light text-sm text-gray-600">
                    Created on {esc.createdAt ? formatDate(esc.createdAt) : "N/A"}
                  </p>
                </h2>
              </div>
              <div>
                <h3 className="font-semibold text-xl">
                  {(esc.amountCents / 100).toFixed(2)} ETB
                </h3>
                <p className="font-light text-sm text-gray-600">
                  Last updated: {esc.updatedAt ? formatDate(esc.updatedAt) : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center w-1/2">
              <div className="flex flex-col gap-1.5 justify-center">
                <h2 className="flex gap-1 items-center text-sm">
                  <User />
                  <strong>Payer:</strong>
                  {esc.payer?.name || "N/A"}
                </h2>
                <h2 className="flex gap-1 items-center text-sm">
                  <User />
                  <strong>Payee:</strong>
                  {esc.payee?.name ?? "N/A"}
                </h2>
              </div>

              <div className="flex flex-col gap-1.5 justify-center">
                <h2 className="flex gap-1 text-sm">
                  <Calendar />
                  <strong>Created:</strong>
                  {esc.createdAt ? formatDate(esc.createdAt) : "N/A"}
                </h2>
                <p className="flex gap-1 text-sm">
                  <DollarSign />
                  <strong>Amount: </strong>
                  {(esc.amountCents / 100).toFixed(2)} ETB
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start">
              <h2 className="flex gap-1 text-lg font-bold">
                <FileText />
                Conditions {esc.releaseCondition === "milestone" ? "for release" : esc.releaseCondition === "auto_after_date" ? "for auto-release" : "for manual release"}
              </h2>
              <p className="text-gray-600 font-semibold">
                {esc.releaseCondition === "milestone"
                  ? esc.milestoneDetails || "No milestone details provided"
                  : esc.releaseCondition === "auto_after_date"
                  ? `Auto-release on ${esc.expiresAt ? formatDate(esc.expiresAt) : "N/A"}`
                  : "Manual release by payer"}
              </p>
            </div>
            <div className="flex gap-5">
              <button
                className="flex gap-1 bg-red-500 text-white p-2 rounded-xl cursor-pointer"
                onClick={() => navigate("/disputes")}
              >
                <ShieldAlert />
                Raise Dispute
              </button>
              <button className="flex gap-1 p-2 rounded-xl border border-gray-300 cursor-pointer">
                <Eye />
                View Audit Trail
              </button>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default Transactions;
