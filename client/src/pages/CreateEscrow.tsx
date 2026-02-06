import { DollarSign, FileText, User } from "lucide-react";
import Heading from "../components/Heading";

const h = {
  heading: "Create New Escrow",
  subheading: "Set up a secure escrow transaction with clear conditions",
};

const CreateEscrow = () => {
  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />

      <div className="flex gap-10 p-10">
        <form className="flex-2 border border-gray-300 rounded-2xl py-5 px-10">
          <div>
            <h2 className="font-medium text-xl">Escrow Details</h2>
            <p className="font-light text-lg text-zinc-500">
              Enter the transaction details and conditions
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-1">
            <label className="flex gap-2 items-center text-sm">
              <User size={20} />
              Payee Email Address
            </label>
            <input
              className="rounded bg-gray-200 p-2 placeholder:text-gray-500"
              type="email"
              id="email"
              placeholder="recipient@example.com"
            />
            <p className="text-sm text-gray-700">
              The person who will receive the funds when conditions are met
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-1">
            <label className="flex gap-2 items-center text-sm">
              <DollarSign size={20} />
              Escrow Account
            </label>
            <input
              className="rounded bg-gray-200 p-2 placeholder:text-gray-500"
              type="number"
              min="1"
              max="99999"
              placeholder="0.00"
            />
            <p className="text-sm text-gray-700">
              Amount in USD (maximum $99,999)
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-1">
            <label className="flex gap-2 items-center text-sm">
              <FileText size={20} />
              Escrow Details
            </label>
            <textarea
              rows={6}
              className="rounded bg-gray-200 p-2 placeholder:text-gray-500"
              placeholder="Describe the conditions that must be met for funds to be released... "
            />
            <p className="text-sm text-gray-700">
              Be specific about what needs to be delivered or completed (minimum
              10 characters)
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2 w-full">
            <button className="bg-black text-white p-2 rounded-xl w-1/1 font-medium">
              Create Escrow
            </button>
            <button className="border border-gray-300 p-2 rounded-xl w-1/3 font-medium">
              Fund Next
            </button>
          </div>
        </form>
        <div className="flex-1">
          <div className="flex flex-col border border-gray-300 p-5 gap-5 rounded-2xl">
            <h2 className="font-semibold">How Escrow Works</h2>
            <div className="flex flex-col gap-3 px-5">
              <div className="flex gap-2">
                <div className="rounded-full w-6 h-6 bg-black text-white text-sm flex justify-center items-center">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Create Escrow</h3>
                  <p className="text-sm font-light text-gray-600">
                    Setup transaction with clear conditions
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="rounded-full w-7 h-6 bg-black text-white text-sm flex justify-center items-center">
                  2
                </div>
                <div>
                  <h3>Fund Escrow</h3>
                  <p className="text-sm font-light text-gray-600">
                    Fund Escrow Transfer funds to secure escrow account
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="rounded-full w-6 h-6 bg-black text-white text-sm flex justify-center items-center">
                  3
                </div>
                <div>
                  <h3>Complete Work</h3>
                  <p className="text-sm font-light text-gray-600">
                    Payee fulfills agreed conditions
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="rounded-full w-6 h-6 bg-black text-white text-sm flex justify-center items-center">
                  4
                </div>
                <div>
                  <h3>Release Funds</h3>
                  <p className="text-sm font-light text-gray-600">
                    Funds automatically released when satisfied
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-col border border-gray-300 p-5 gap-2 rounded-2xl">
            <h2 className="text-gray-600 font-semibold">Security Notes:</h2>
            <p className="text-gray-500 text-sm">
              Once created, this escrow will require funding before the payee
              can begin work. You can fund it immediately after creation.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateEscrow;
