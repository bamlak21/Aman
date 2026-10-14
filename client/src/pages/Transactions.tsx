import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  DollarSign,
  Download,
  FileText,
  User,
  XIcon,
} from "lucide-react";
import Heading from "../components/Heading";
import { escrow, type Txn } from "../api/escrow.api";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import toast from "react-hot-toast";
const h = {
  heading: "Transactions",
  subheading: "Manage and monitor your escrow transactions",
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusBadge = (status: string) => {
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
      return "bg-red-100 text-gray-700";
    case "refund":
      return "bg-yellow-100 text-yellow-700";
    case "release":
      return "bg-green-100 text-green-700";
    case "deposit":
      return "bg-red-100 text-red-700";
    case "fee":
      return "bg-blue-300 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const Transactions = () => {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedTxn, setSelectedTxn] = useState<Txn>();
  const [showTxn, setShowTxn] = useState(false);
  const [isAsc, setIsAsc] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [startDate, setStartDate] = useState<string>();
  const [endDate, setEndDate] = useState<string>();
  const [sortKey, setSortKey] = useState<"date" | "amount">("date");

  useEffect(() => {
    const fetchTxns = async () => {
      try {
        const data = await escrow.myTxn();
        setTxns(data?.fetchTxn || []);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTxns();
  }, []);

  const handleTxn = (esc: Txn) => {
    setSelectedTxn(esc);
    setShowTxn(true);
  };

  const handleoffTxn = () => {
    setShowTxn(false);
  };

  const sortedTxns = useMemo(() => {
    return [...txns].sort((a, b) => {
      if (sortKey === "amount") {
        const diff = a.amountCents - b.amountCents;
        return isAsc ? diff : -diff;
      }
      const diff =
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return isAsc ? diff : -diff;
    });
  }, [txns, sortKey, isAsc]);

  const toggleSort = (key: "date" | "amount") => {
    if (sortKey === key) {
      setIsAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setIsAsc(true);
    }
  };

  if (loading) {
    return (
      <div className="p-5">
        <Heading heading={h.heading} subheading={h.subheading} />
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  if (txns.length === 0) {
    return (
      <div className="p-5">
        <Heading heading={h.heading} subheading={h.subheading} />
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No transactions found</p>
        </div>
      </div>
    );
  }

  const handleExport = () => {
    const from = startDate ? new Date(startDate + "T00:00:00").getTime() : null;
    const to = endDate ? new Date(endDate + "T23:59:59").getTime() : null;

    if (from !== null && to !== null && from > to) {
      return toast.error("End date must be after start date");
    }

    const filtered = txns
      .filter((e) => {
        const t = new Date(e.createdAt).getTime();
        if (from !== null && t < from) return false;
        if (to !== null && t > to) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

    if (filtered.length === 0) {
      return toast.error("No transactions found in the selected date range");
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Escrow Transactions", 14, 16);
    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString()}  |  ${
        from !== null ? `From: ${startDate}` : "From: All"
      }  |  ${to !== null ? `To: ${endDate}` : "To: All"}`,
      14,
      22,
    );

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Txn", "Payer", "Payee", "Amount (ETB)", "Status"]],
      body: filtered.map((e) => [
        formatDate(e.createdAt),
        e.txRef ? `#${e.txRef}` : "-",
        e.payer?.name || "N/A",
        e.payee?.name || "N/A",
        (e.amountCents / 100).toFixed(2),
        e.type,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [75, 85, 99], textColor: 255 },
    });

    doc.save("Escrow Transactions.pdf");
    setShowDate(false);
  };

  const conditionLabel =
    selectedTxn?.releaseCondition === "milestone"
      ? "Milestone for release"
      : selectedTxn?.releaseCondition === "auto_after_date"
        ? "Auto release after date"
        : "Manual release by payer";

  const conditionDetail =
    selectedTxn?.releaseCondition === "milestone"
      ? selectedTxn.milestoneDetails || "No milestone details provided"
      : selectedTxn?.releaseCondition === "auto_after_date"
        ? `Auto-release on ${selectedTxn.expiresAt ? formatDate(selectedTxn.expiresAt) : "N/A"}`
        : "Funds are released manually by the payer";

  return (
    <div className="flex gap-5 p-5 min-h-screen">
      <div className={`flex flex-col min-w-0 ${showTxn ? "flex-1" : "w-full"}`}>
        <Heading heading={h.heading} subheading={h.subheading} />
        <div className="flex justify-end">
          <button
            onClick={() => setShowDate(true)}
            className="inline-flex items-center border p-2 rounded-2xl text-white bg-black hover:shadow-md/30 shadow-gray-500 border-gray-900"
          >
            Export
            <Download className="h-3.5 w-3.5 ml-1" />
          </button>
        </div>

        <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden mt-3 shadow-lg/30 shadow-gray-300">
          <div className="overflow-x-auto">
            <table className="w-full ">
              <thead>
                <tr className="bg-gray-300 text-left font-semibold text-xs uppercase tracking-wider text-gray-500">
                  <th
                    className="px-4 py-3 inline-flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleSort("date")}
                  >
                    {sortKey === "date" ? (
                      isAsc ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                    Date
                  </th>
                  <th className="px-4 py-3">Txn</th>
                  <th className="px-4 py-3">Payer</th>
                  <th className="px-4 py-3">Payee</th>
                  <th
                    className="px-4 py-3 inline-flex items-center gap-2 cursor-pointer"
                    onClick={() => toggleSort("amount")}
                  >
                    {sortKey === "amount" ? (
                      isAsc ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )
                    ) : (
                      <ArrowUpDown className="h-4 w-4" />
                    )}
                    Amount
                  </th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="">
                {sortedTxns.map((esc) => {
                  const isSelected = showTxn && selectedTxn?.id === esc.id;
                  return (
                    <tr
                      key={esc.id}
                      onClick={() => handleTxn(esc)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-200" : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {formatDate(esc.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800 text-center">
                        {esc.txRef ? <span>#</span> : <span>-</span>}
                        {esc.txRef}
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-800">
                        {esc.payer.name ?? "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-semibold capitalize`}
                        >
                          {esc.payee.name ?? "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold whitespace-nowrap">
                        {(esc.amountCents / 100).toFixed(2)}{" "}
                        <span className="font-normal text-gray-400">ETB</span>
                      </td>
                      <td
                        className={`px-4 py-3 text-sm font-semibold text-center`}
                      >
                        <span
                          className={`font-normal text-gray-400 ${getStatusBadge(esc.type)} p-2 rounded-2xl`}
                        >
                          {esc.type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* for desktop */}
      {showTxn && selectedTxn && (
        <div className="hidden lg:block md:w-76 md:shrink-0">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm h-fit lg:sticky lg:top-5 overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-gray-100 text-white bg-linear-to-tr from-gray-700 to-black">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Escrow
                </p>
                <h2 className="font-semibold text-lg mt-1">
                  #{selectedTxn.id.slice(0, 12)}
                </h2>
              </div>
              <button
                onClick={handleoffTxn}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-xs font-semibold capitalize px-3 py-1.5 rounded-full ${getStatusBadge(selectedTxn.status)}`}
                >
                  {selectedTxn.status}
                </span>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <span className="text-2xl font-bold">
                    {(selectedTxn.amountCents / 100).toFixed(2)}
                  </span>
                  <span className="text-sm font-medium text-gray-500">ETB</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 text-blue-600 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">Payer</p>
                    <p className="text-sm font-medium capitalize truncate">
                      {selectedTxn.payer.name ?? "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-100 text-green-600 shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">Payee</p>
                    <p className="text-sm font-medium capitalize truncate">
                      {selectedTxn.payee.name ?? "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-gray-100">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <FileText className="h-4 w-4" />
                  Release condition
                </p>
                <p className="text-sm font-medium capitalize mt-2">
                  {conditionLabel}
                </p>
                <p className="text-sm text-gray-500 mt-1">{conditionDetail}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Created {formatDate(selectedTxn.createdAt)}</span>
              </div>

              {selectedTxn.txRef && (
                <div className="text-xs text-gray-400">
                  Ref: {selectedTxn.txRef}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* for mobile */}
      {showTxn && selectedTxn && (
        <div className="p-3 mt-10 lg:hidden fixed inset-0 -top-11 backdrop-blur-2xl bg-transparent z-0 overflow-auto">
          <div className="lg:hidden flex flex-col w-full mt-10">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm h-fit lg:sticky lg:top-5 overflow-hidden">
              <div className="flex items-start justify-between p-5 border-b border-gray-100 text-white bg-linear-to-tr from-gray-700 to-black">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Escrow
                  </p>
                  <h2 className="font-semibold text-lg mt-1">
                    #{selectedTxn.id.slice(0, 12)}
                  </h2>
                </div>
                <button
                  onClick={handleoffTxn}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold capitalize px-3 py-1.5 rounded-full ${getStatusBadge(selectedTxn.status)}`}
                  >
                    {selectedTxn.status}
                  </span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-5 w-5 text-gray-500" />
                    <span className="text-2xl font-bold">
                      {(selectedTxn.amountCents / 100).toFixed(2)}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      ETB
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 text-blue-600 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Payer</p>
                      <p className="text-sm font-medium capitalize truncate">
                        {selectedTxn.payer.name ?? "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-green-100 text-green-600 shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">Payee</p>
                      <p className="text-sm font-medium capitalize truncate">
                        {selectedTxn.payee.name ?? "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-gray-100">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <FileText className="h-4 w-4" />
                    Release condition
                  </p>
                  <p className="text-sm font-medium capitalize mt-2">
                    {conditionLabel}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {conditionDetail}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Created {formatDate(selectedTxn.createdAt)}</span>
                </div>

                {selectedTxn.txRef && (
                  <div className="text-xs text-gray-400">
                    Ref: {selectedTxn.txRef}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/*export modal for date range*/}

      {showDate && (
        <div className="fixed inset-0 backdrop-blur-xs bg-transparent z-0 flex items-center w-full justify-center">
          <div className="flex flex-col border rounded-2xl bg-white min-w-100 p-2 md:p-4 border-gray-300 shadow-xl/30 shadow-gray-600">
            <Heading
              heading={"Export Transactions"}
              subheading="export your data in date"
            />
            <div className="inline-flex justify-between gap-0.5 md:gap-0 mt-7">
              <input
                className="border rounded-xl p-1 md:p-1.5 border-gray-500 [&::-webkit-calendar-picker-indicator]:invert text-white bg-black shadow-xl/30 shadow-gray-400"
                type="date"
                name="start-date"
                id="start-date"
                onChange={(e) => setStartDate(e.target.value)}
              />
              <input
                className="border rounded-xl p-1 md:p-1.5 border-gray-500 shadow-xl/30 shadow-gray-400"
                type="date"
                name="end-date"
                id="end-date"
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="inline-flex gap-5 mt-7 justify-center">
              <button
                onClick={handleExport}
                className="px-5 py-2 border bg-gray-950 hover:scale-105 hover:duration-300 hover:ease-in-out hover:bg-black text-white rounded-xl p-1.5 "
              >
                Export
              </button>
              <button
                onClick={() => setShowDate(false)}
                className="border rounded-xl p-1.5 px-5 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
