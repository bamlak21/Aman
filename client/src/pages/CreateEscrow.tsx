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

      <div className="flex">
        <form>
          <div>
            <h2>Escrow Details</h2>
            <p>Enter the transaction details and conditions</p>
          </div>
          <div className="flex flex-col">
            <label className="flex gap-1">
              <User />
              Payee Email Address
            </label>
            <input type="email" id="email" />
            <p>The person who will receive the funds when conditions are met</p>
          </div>
          <div className="flex flex-col">
            <label className="flex gap-1">
              <DollarSign />
              Escrow Account
            </label>
            <input type="email" id="email" />
            <p>Amount in USD (maximum $99,999)</p>
          </div>
          <div className="flex flex-col">
            <label className="flex gap-1">
              <FileText />
              Escrow Details
            </label>
            <input type="email" id="email" />
            <p>
              Be specific about what needs to be delivered or completed (minimum
              10 characters)
            </p>
          </div>
          <div>
            <button>Create Escrow</button>
            <button>Fund Next</button>
          </div>
        </form>
        <div className="flex flex-col">
          <h2>How Escrow Works</h2>
          <div className="flex flex-col">
            <div className="flex gap-2">
              <div className="rounded-full w-6 h-6 bg-black text-white text-sm flex justify-center items-center">
                1
              </div>
              <div>
                <h3>Create Escrow</h3>
                <p>Setup transaction with clear conditions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateEscrow;
