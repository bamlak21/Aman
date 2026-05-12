import { DollarSign, FileText, User, Calendar, ListChecks, Hand } from "lucide-react";
import Heading from "../components/Heading";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { escrow } from "../api/escrow.api";
import toast from "react-hot-toast";

const h = {
  heading: "Create New Escrow",
  subheading: "Set up a secure escrow transaction with clear conditions",
};

type Condition = "manual" | "auto_after_date" | "milestone";

const conditionOptions: { value: Condition; label: string; icon: typeof Hand; description: string }[] = [
  {
    value: "manual",
    label: "Manual Release",
    icon: Hand,
    description: "Funds released when payer manually approves",
  },
  {
    value: "auto_after_date",
    label: "Auto After Date",
    icon: Calendar,
    description: "Funds automatically released after a set date",
  },
  {
    value: "milestone",
    label: "Milestone Based",
    icon: ListChecks,
    description: "Funds released when milestones are completed",
  },
];

const CreateEscrow = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payeeEmail, setPayeeEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [releaseCondition, setReleaseCondition] = useState<Condition>("manual");
  const [milestoneDetails, setMilestoneDetails] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!payeeEmail || !amount || parseFloat(amount) <= 0) {
      setError("Please fill in all required fields with valid values");
      return;
    }

    if (releaseCondition === "auto_after_date" && !expiresAt) {
      setError("Please set an expiration date for auto-release");
      return;
    }

    if (releaseCondition === "milestone" && !milestoneDetails.trim()) {
      setError("Please describe the milestones for this escrow");
      return;
    }

    setLoading(true);

    try {
      await escrow.createEscrow({
        payeeEmail,
        amount: parseFloat(amount),
        releaseCondition,
        milestoneDetails: releaseCondition === "milestone" ? milestoneDetails : undefined,
        expiresAt: releaseCondition === "auto_after_date" ? expiresAt : undefined,
      });
      toast.success("Escrow created successfully");
      navigate("/fund-escrow");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create escrow");
      setError(err.response?.data?.message || "Failed to create escrow");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Heading heading={h.heading} subheading={h.subheading} />

      <div className="flex gap-10 p-10">
        <form onSubmit={handleSubmit} className="flex-1 border border-gray-300 rounded-2xl py-5 px-10">
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
              value={payeeEmail}
              onChange={(e) => setPayeeEmail(e.target.value)}
              placeholder="recipient@example.com"
              required
            />
            <p className="text-sm text-gray-700">
              The person who will receive the funds when conditions are met.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-1">
            <label className="flex gap-2 items-center text-sm">
              <DollarSign size={20} />
              Escrow Amount
            </label>
            <input
              className="rounded bg-gray-200 p-2 placeholder:text-gray-500"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="99999"
              placeholder="0.00"
              required
            />
            <p className="text-sm text-gray-700">
              Amount in ETB (maximum 99,999)
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <label className="flex gap-2 items-center text-sm">
              <FileText size={20} />
              Release Condition
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {conditionOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = releaseCondition === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReleaseCondition(opt.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-gray-100 hover:border-gray-400"
                    }`}
                  >
                    <Icon size={20} className="mb-2" />
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isSelected ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {releaseCondition === "manual" && (
            <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex gap-3">
                <Hand size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-800">Manual Release</p>
                  <p className="text-xs text-blue-600 mt-1">
                    You will need to manually approve and release the funds to the payee once the work is completed to your satisfaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {releaseCondition === "auto_after_date" && (
            <div className="mt-5 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex gap-3">
                  <Calendar size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-amber-800">Auto-Release After Date</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Funds will be automatically released to the payee after the specified date, even without manual approval.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="flex gap-2 items-center text-sm">
                  <Calendar size={20} />
                  Release Date
                </label>
                <input
                  className="rounded bg-gray-200 p-2"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
                <p className="text-sm text-gray-700">
                  Funds will be auto-released on or after this date.
                </p>
              </div>
            </div>
          )}

          {releaseCondition === "milestone" && (
            <div className="mt-5 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="flex gap-3">
                  <ListChecks size={20} className="text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-green-800">Milestone-Based Release</p>
                    <p className="text-xs text-green-600 mt-1">
                      Describe the milestones that must be completed. Funds will be released when all milestones are verified.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="flex gap-2 items-center text-sm">
                  <ListChecks size={20} />
                  Milestone Details
                </label>
                <textarea
                  rows={6}
                  className="rounded bg-gray-200 p-2 placeholder:text-gray-500"
                  value={milestoneDetails}
                  onChange={(e) => setMilestoneDetails(e.target.value)}
                  placeholder={`Example:\n1. Design mockups delivered - 30%\n2. Frontend development complete - 40%\n3. Testing and deployment - 30%`}
                  required
                />
                <p className="text-sm text-gray-700">
                  Be specific about each milestone and its associated deliverable.
                </p>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-5 flex items-center gap-2 w-full">
            <button
              type="submit"
              disabled={loading}
              className="bg-black text-white p-2 rounded-xl w-full font-medium disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Escrow"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/fund-escrow")}
              className="border border-gray-300 p-2 rounded-xl w-1/3 font-medium"
            >
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
                    Transfer funds to secure escrow account
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
                    Funds released when conditions are satisfied
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
