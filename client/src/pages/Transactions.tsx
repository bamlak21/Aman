import {
  Calendar,
  DollarSign,
  Eye,
  FileText,
  ShieldAlert,
  User,
} from "lucide-react";
import Heading from "../components/Heading";

const h = {
  heading: "Transactions",
  subheading: "Manage and monitor your escrow transactions",
};

const Transactions = () => {
  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />
      <div className="mt-5 p-5 flex flex-col gap-10 border border-gray-300 rounded-xl">
        <div className="flex justify-between">
          <div className="flex flex-col">
            <h2 className="font-semibold">
              Escrow #1{" "}
              <span className="bg-blue-100 text-blue-700 rounded-2xl text-sm px-2 py-1 font-medium">
                Funded
              </span>
              <p className="mt-1 font-light text-sm text-gray-600">
                Created on Jan 15, 2026, 01:00PM
              </p>
            </h2>
          </div>
          <div>
            <h3 className="font-semibold text-xl">$5000.00</h3>
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
              John Business
            </h2>
            <h2 className="flex gap-1 items-center text-sm">
              <User />
              <strong>Payee:</strong>
              Jane McAliter
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
              <strong>Amount: </strong> $5000.00
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
    </>
  );
};

export default Transactions;
