import { useState, useEffect } from "react";
import { ArrowLeft, Upload, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/main";
import toast from "react-hot-toast";
import axios from "axios";


type ResError = {
  error: string;
  message: string;
};

const disputeTypes = [
  { value: "non_delivery", label: "Non-Delivery" },
  { value: "quality_issue", label: "Quality Issue" },
  { value: "fraud", label: "Fraud" },
  { value: "breach_of_terms", label: "Breach of Terms" },
  { value: "other", label: "Other" },
] as const;

const Report = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [selectedType, setSelectedType] = useState<string>("");
  const [reason, setReason] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const escrowId = searchParams.get("escrow_id") || "";
  const reportedId = searchParams.get("reported_id") || "";
  useEffect(() => {
    if (!escrowId || !reportedId) {
      toast.error("Missing dispute context. Please select an escrow first.");
      navigate("/disputes");
    }
  }, [escrowId, reportedId,navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEvidenceFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setEvidenceFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType) {
      toast.error("Please select a dispute type");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }
  
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("escrow_id", escrowId);
      formData.append("reported_id", reportedId);
      formData.append("dispute_type", selectedType);
      formData.append("reason", reason.trim());
      evidenceFiles.forEach((file) => {
        formData.append("evidence", file);
      });

      await api.post("api/disputes/create", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Dispute submitted successfully");
      navigate("/disputes");
    } catch (error) {
      if (axios.isAxiosError<ResError>(error)) {
        toast.error(error?.response?.data?.message || "Failed to submit dispute");
      } else {
        toast.error("Failed to submit dispute");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button
        onClick={() => navigate("/disputes")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Disputes
      </button>

      <h1 className="text-2xl font-bold mb-2">Report a Dispute</h1>
      <p className="text-gray-600 mb-8">
        Provide details about the issue with this escrow transaction.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Dispute Type <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
            required
          >
            <option value="">Select a type</option>
            {disputeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={5}
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black resize-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Evidence (optional)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">Click to upload files</p>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
              id="evidence-upload"
            />
            <label
              htmlFor="evidence-upload"
              className="inline-block px-4 py-2 bg-black text-white rounded-xl cursor-pointer text-sm"
            >
              Choose Files
            </label>
          </div>

          {evidenceFiles.length > 0 && (
            <div className="mt-3 space-y-2">
              {evidenceFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-black text-white p-3 rounded-xl font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Dispute"}
        </button>
      </form>
    </div>
  );
};

export default Report;
