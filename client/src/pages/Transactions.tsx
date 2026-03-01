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

const h = {
  heading: "Transactions",
  subheading: "Manage and monitor your escrow transactions",
};

const Transactions = () => {
  const [txns, setTxns] = useState<EscrowData[]>([]);
  useEffect(() => {
    const fetchTxns = async () => {
      try {
        const data = await escrow.myEscrow();
        setTxns(data?.escrows);
      } catch (error) {
        console.log(error);
      }
    };
    fetchTxns();
  }, []);

  console.log(txns);

  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />
      {txns.map((esc) => {
        return (
          <div className="mt-5 p-5 flex flex-col gap-10 border border-gray-300 rounded-xl">
            <div className="flex justify-between">
              <div className="flex flex-col">
                <h2 className="font-semibold">
                  Escrow: <span className="font-light mr-1">{esc.id}</span>
                  <span className="bg-blue-100 text-blue-700 rounded-2xl text-sm px-2 py-1 font-medium">
                    {esc.status}
                  </span>
                  <p className="mt-1 font-light text-sm text-gray-600">
                    Created on Jan 15, 2026, 01:00PM
                  </p>
                </h2>
              </div>
              <div>
                <h3 className="font-semibold text-xl">
                  ${currencyUnitConverter(esc.amountCents)}
                </h3>
                <p className="font-light text-sm text-gray-600">
                  Last updated: Jan 25, 2026, 05:30PM
                </p>
              </div>
            </div>
            <div className="flex justify-between items-center w-1/2">
              <div className="flex flex-col gap-1.5 justify-center">
                <h2 className="flex gap-1 items-center text-sm">
                  <User />
                  <strong>Payer:</strong>
                  {esc.payer.name}
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
                  Jan 15 2026, 01:00PM
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
                Conditions
              </h2>
              <p className="text-gray-600 font-semibold">
                Website Development completion
              </p>
            </div>
            <div className="flex gap-5">
              <button className="flex gap-1 bg-red-500 text-white p-2 rounded-xl cursor-pointer">
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
