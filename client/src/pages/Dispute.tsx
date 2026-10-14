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
    chat.getMyChats().then(setMyChats).catch(() => {});
  }, []);

  const activeChats = myChats.filter((c) => c.chatroom);
  
  useEffect(() => {
    const fetchTxns = async () => {
      try {
        const data = await escrow.myEscrow();
        const filtered = data?.escrows.filter(
          (e) => e.status !== "released" && e.status !== "cancelled",
        );
        setTxns(filtered);
      } catch (error) {
        console.log(error);
      }
    };
    fetchTxns();
  }, []);



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
      return "bg-yellow-200 text-yellow-700";
    case "funded":
      return "bg-blue-300 text-blue-700 ";
    case "released":
      return "bg-green-300 text-green-700 ";
    case "disputed":
      return "bg-red-300 text-red-700";
    case "cancelled":
      return "bg-gray-300 text-gray-700 ";
    default:
      return "bg-gray-300 text-gray-700";
  }
};
  return (
    <div className="p-5 overflow-x-hidden">
      <Heading heading={h.heading} subheading={h.subheading} />

      {/* {activeChats.length > 0 && (
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
                    {c.dispute.escrow_id}
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
      )} */}

     
      {txns.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No escrows to display</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 max-w-full">
        {txns.map((esc) => {
          const isDisputed = esc.status === "disputed";
          const disputeChat = activeChats.find(c => c.dispute.escrow_id === esc.id);
          return (
           <div
                       className={`bg-gray-100 border-gray-300 border mt-5 p-5 flex flex-col gap-5 rounded-xl  hover:delay-100 hover:ease-in-out hover:bg-linear-to-bl from-transparent to-gray-300  hover:shadow-2xl/30`}
                       key={esc.id}
                     >
                       <div className="flex justify-between">
                         <div className="flex flex-col">
                           <h2 className="font-semibold">
                             Escrow: <span className="font-light text-sm md:text-lg mr-1">{esc.id.slice(0, 8)}...</span>
                             {/* <span className={`${getStatusColor(esc.status)} rounded-2xl text-sm px-2 py-1 font-medium ml-2`}>
                               {esc.status}
                             </span> */}
                             <p className="flex items-center mt-2 font-light text-xs md:text-md text-gray-600">
                              <Calendar className="h-5 w-5 mr-2"/>{disputeChat?.dispute.createdAt ? formatDate(disputeChat.dispute.createdAt) : formatDate(esc.createdAt)}
                             </p>
                           </h2>
                         </div>
                         <div className="flex flex-col items-center">
                           <span className={`${getStatusColor(esc.status)} capitalize rounded-2xl text-center text-xs md:text-md px-2 py-2 font-medium md:ml-2 ml-6`}>
                               {esc.status}
                             </span>
                           <h3 className="font-semibold text-md md:text-xl w-full inline-flex items-center mt-1.5 lg:mt-1 ml-5">
                             <DollarSign className="h-5 w-5"/> {(esc.amountCents / 100).toFixed(2)} ETB
                           </h3>
                           <p className="font-light text-xs text-gray-600 mt-2">
                             {/* Last updated: {esc.updatedAt ? formatDate(esc.updatedAt) : "N/A"} */}
                           </p>
                         </div>
                       </div>
                       <div className="flex justify-between items-center w-3/2">
                         <div className="flex flex-col gap-4 justify-center">
                           <h2 className="flex gap-1 items-center text-sm capitalize">
                             <User />
                             <strong className="text-sm md:text-md">Payer:</strong>
                             {esc.payer.name ??"N/A"}
                           </h2>
                           <h2 className="flex gap-1 items-center text-sm capitalize">
                             <User />
                             <strong>Payee:</strong>
                             {esc.payee.name ??"N/A"}
                           </h2>
                         </div>
           
                       </div>
                       <div className="flex flex-col items-start">
                         <span className="flex gap-1 text-sm md:text-md font-bold capitalize">
                           <FileText />
                           Conditions {esc.releaseCondition === "milestone" ? "for release" : esc.releaseCondition === "auto_after_date" ? "for auto-release" : "for manual release"}
                         </span>
                         <p className="text-gray-600 font-semibold text-xs md:text-sm ml-7  ">
                           {esc.releaseCondition === "milestone"
                             ? esc.milestoneDetails || "No milestone details provided"
                             : esc.releaseCondition === "auto_after_date"
                             ? `Auto-release on ${esc.expiresAt ? formatDate(esc.expiresAt) : "N/A"}`
                             : "Manual release by payer"}
                         </p>
                       </div>
            <div className="flex gap-5 justify-between text-sm md:text-md">
              <div className="inline-flex items-center gap-2.5 md:gap-5">
              {!isDisputed ? (
                <button className="flex gap-1 bg-red-500 text-white p-2 items-center rounded-xl cursor-pointer"
                onClick={()=>{ setSelectedId(esc.id)
                  setOpenModal(true)
                }}
                >
                  <ShieldAlert />
                  Raise Dispute
                </button>
              ) : (
                <span className="flex gap-1 bg-gray-200  text-gray-500  p-2 rounded-xl cursor-not-allowed">
                  <ShieldAlert />
                  Dispute Raised 
                </span>
              )}
              <button className="flex gap-1 p-2 rounded-xl border border-gray-300 cursor-pointer bg-black text-white">
                <Eye />
                View Audit Trail
              </button>
              </div>
              <div className="inline-flex items-center"> 
              {isDisputed && disputeChat &&(
                             
               <button
                  data-tooltip-id="my-tooltip" data-tooltip-content="open chat" 
                  onClick={() => navigate(`/chat/${disputeChat?.dispute.id}`)}
                  className="items-center gap-1.5 px-2 py-2 bg-transparent text-black rounded-lg transition text-sm font-medium shadow-gray-900 shadow-sm/30"
                >
                  <MessageSquare size={16} />
                 
                </button>
              )}
              </div>
            </div>
          </div>
        );
        })}
        </div>
      )}
    <ConfirmModal
     isOpen={openModal}
     icon={"ShieldAlert"}
     color="red-600"
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
    </div>
  );
};

export default Dispute;
