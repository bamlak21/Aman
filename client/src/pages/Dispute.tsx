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
import { currencyUnitConverter } from "../utils/converter";
import ConfirmModal from "../components/ConfirmModal";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const h = {
  heading: "Manage Disputes",
  subheading: "Manage and Report escrow issues",
};

const Dispute = () => {
  const [txns, setTxns] = useState<EscrowData[]>([]);
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

  // console.log(txns);

  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />
      {txns.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No escrows to display</p>
        </div>
      ) : (
        txns.map((esc) => {
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
                  {/* Jan 15 2026, 01:00PM */}
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
                {/* Website Development completion */}
                {esc.releaseCondition === "milestone"
                  ? esc?.milestoneDetails: esc?.releaseCondition === "auto_after_date"? new Date(esc?.expiresAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  }): esc?.releaseCondition === "manual"? "Manual release by payer": "Unknown condition"}
              </p>
            </div>
            <div className="flex gap-5">
              <button className="flex gap-1 bg-red-500 text-white p-2 rounded-xl cursor-pointer"
              onClick={()=>{ setSelectedId(esc.id)
                setOpenModal(true)
              }}
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
