import {
  Calendar,
  DollarSign,
  Eye,
  FileText,
  MessageSquare,
  ShieldAlert,
  User,
} from "lucide-react";
import Heading from "../components/Heading";
import { escrow, type EscrowData } from "../api/escrow.api";
import { useEffect, useState } from "react";
import { currencyUnitConverter } from "../utils/converter";
import ConfirmModal from "../components/ConfirmModal";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { chat, type MyChatItem } from "../api/chat.api";

const h = {
  heading: "Manage Disputes",
  subheading: "Manage and Report escrow issues",
};

const Dispute = () => {
  const [txns, setTxns] = useState<EscrowData[]>([]);
  const [myChats, setMyChats] = useState<MyChatItem[]>([]);
  const [openModal,setOpenModal] = useState<boolean>(false);
  const [selectedId,setSelectedId] = useState<string|null>(null);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  useEffect(() => {
    const fetchTxns = async () => {
      try {
        const data = await escrow.myEscrow();
        setTxns(data?.escrows.filter((e)=>e.status!=='released'));
      } catch (error) {
        console.log(error);
      }
    };
    fetchTxns();
  }, []);

  useEffect(() => {
    chat.getMyChats().then(setMyChats).catch(() => {});
  }, []);

  const activeChats = myChats.filter((c) => c.chatroom);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Negotiating": return "bg-blue-100 text-blue-700";
      case "Resolved": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />

      {activeChats.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">My Dispute Chats</h3>
          <div className="space-y-3">
            {activeChats.map((c) => (
              <div
                key={c.dispute.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {c.dispute.dispute_type.replace(/_/g, " ")}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full ${getStatusBadge(c.dispute.status)}`}>
                      {c.dispute.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                    {c.dispute.reason}
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/chat/${c.dispute.id}`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-sm font-medium"
                >
                  <MessageSquare size={16} />
                  Open Chat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-3">Escrow Transactions</h3>
      {txns.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No escrows to display</p>
        </div>
      ) : (
        txns.map((esc) => {
          const isDisputed = esc.status === "disputed";
          return (
            <div className="mt-5 p-5 flex flex-col gap-10 border border-gray-300 rounded-xl"
            key={esc.id}
            >
            <div className="flex justify-between">
              <div className="flex flex-col">
                <h2 className="font-semibold">
                  Escrow: <span className="font-light mr-1">{esc.id}</span>
                  <span className="bg-blue-100 text-blue-700 rounded-2xl text-sm px-2 py-1 font-medium">
                    {esc.status}
                  </span>
                  <p className="mt-1 font-light text-sm text-gray-600">
                    Created on {esc?.createdAt ? new Date(esc.createdAt).toLocaleTimeString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }) : "N/A"}
                  </p>
                </h2>
              </div>
              <div>
                <h3 className="font-semibold text-xl">
                  ${currencyUnitConverter(esc.amountCents)}
                </h3>
                <p className="font-light text-sm text-gray-600">
                  Last updated: {esc?.updatedAt ? new Date(esc.updatedAt).toLocaleTimeString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }) : "N/A"}
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center w-1/2">
              <div className="flex flex-col gap-1.5 justify-center">
                <h2 className="flex gap-1 items-center text-sm">
                  <User />
                  <strong>Payer:</strong>
                  {esc.payer?.name}
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
                  {esc?.createdAt ? new Date(esc.createdAt).toLocaleTimeString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }) : "N/A"}
                </h2>
                <p className="flex gap-1 text-sm">
                  <DollarSign />
                  <strong>Amount: </strong> $
                  {currencyUnitConverter(esc.amountCents)}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start">
              <h2 className="flex gap-1 text-lg font-bold">
                <FileText />
                Conditions {esc.releaseCondition === "milestone" ? "for release": esc?.releaseCondition === "auto_after_date"? "for auto-release": "for manual release"  }
              </h2>
              <p className="text-gray-600 font-semibold">
                {esc.releaseCondition === "milestone"
                  ? esc?.milestoneDetails: esc?.releaseCondition === "auto_after_date"? new Date(esc?.expiresAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }): esc?.releaseCondition === "manual"? "Manual release by payer": "Unknown condition"}
              </p>
            </div>
            <div className="flex gap-5">
              {!isDisputed ? (
                <button className="flex gap-1 bg-red-500 text-white p-2 rounded-xl cursor-pointer"
                onClick={()=>{ setSelectedId(esc.id)
                  setOpenModal(true)
                }}
                >
                  <ShieldAlert />
                  Raise Dispute
                </button>
              ) : (
                <span className="flex gap-1 bg-gray-200 text-gray-500 p-2 rounded-xl cursor-not-allowed">
                  <ShieldAlert />
                  Dispute Raised
                </span>
              )}
              <button className="flex gap-1 p-2 rounded-xl border border-gray-300 cursor-pointer">
                <Eye />
                View Audit Trail
              </button>
            </div>
          </div>
        );
        })
      )}
    <ConfirmModal
     isOpen={openModal}
     title="Report user"
     message="Are you sure you want to report the selected user?"
     confirmText="Report"
     cancelText="Cancel"
      onConfirm={()=>{
        if (selectedId) {
          setOpenModal(false);
          const esc = txns.find(e => e.id === selectedId);
          const reportedId = esc?.payer?.id === user?.id ? esc?.payee?.id : esc?.payer?.id;
          navigate(`/report?escrow_id=${selectedId}&reported_id=${reportedId}`);
        }
      }}
     onCancel={()=> setOpenModal(false)}
    />
    </>
  );
};

export default Dispute;
