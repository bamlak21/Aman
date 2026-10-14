import { useEffect, useState } from "react";
import { escrow } from "../api/escrow.api";
import { Square } from "lucide-react";

const Analytics = () => {
  const [Escrows, setEscrow] = useState({
    totalEscrow: 0,
    activeEscrow: 0,
    fundedEscrow: 0,
    completedEscrow: 0,
    cancelledEscrow: 0,
    disputedEscrow: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await escrow.myEscrow();
        const escrows = res.escrows || [];
        setEscrow({
          totalEscrow: escrows.length,
          activeEscrow: escrows.filter((e) => e.status === "created").length,
          fundedEscrow: escrows.filter((e) => e.status === "funded").length,
          completedEscrow: escrows.filter((e) => e.status === "released")
            .length,
          disputedEscrow: escrows.filter((e) => e.status === "disputed").length,
          cancelledEscrow: escrows.filter((e) => e.status === "cancelled")
            .length,
        });
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };
    fetchStats();
  }, []);

  const pct = (n: number) =>
    Escrows.totalEscrow ? Math.round((n / Escrows.totalEscrow) * 100) : 0;

  const activePct = pct(Escrows.activeEscrow);
  const fundedPct = pct(Escrows.fundedEscrow);
  const releasedPct = pct(Escrows.completedEscrow);
  const disputedPct = pct(Escrows.disputedEscrow);
  const cancelledPct = pct(Escrows.cancelledEscrow);

  // Conic gradient using distinct labeled status colors
  const circleFill = Escrows.totalEscrow
    ? `conic-gradient(#60a5fa 0 ${activePct}%, #3b82f6 ${activePct}% ${
        activePct + fundedPct
      }%, #4ade80 ${activePct + fundedPct}% ${
        activePct + fundedPct + releasedPct
      }%, #f87171 ${activePct + fundedPct + releasedPct}% ${
        activePct + fundedPct + releasedPct + disputedPct
      }%, #9ca3af ${activePct + fundedPct + releasedPct + disputedPct}% 100%)`
    : "conic-gradient(#e5e7eb 0 100%)";

  return (
    <div className="flex flex-1 flex-col min-w-70 bg-linear-to-br from-white to-gray-200 justify-center rounded-2xl border-gray-100 border">
      <div className="flex flex-col mb-8">
        <h1 className="p-3">Escrow Transaction</h1>
      </div>

      {/* Circular chart */}
      <div className="flex justify-center items-center transition-all duration-1000 ease-out chart-fade">
        <div className="relative flex items-center justify-center w-32 h-32">
          {/* Donut Chart Background (Mask applied ONLY here) */}
          <div
            className="absolute inset-0 rounded-full ring-animate"
            style={{
              background: circleFill,
              mask: "radial-gradient(circle, transparent 55%, #000 56%)",
              WebkitMask: "radial-gradient(circle, transparent 55%, #000 56%)",
            }}
          />

          {/* Center Text Layer (Unmasked) */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-bold">
              {Escrows.totalEscrow || 0}
            </span>
            <span className="text-xs">Escrows</span>
          </div>
        </div>
      </div>

      {/* Legend */}

      <div className="flex justify-center border-b-2 border-gray-100">
        <div className="grid grid-cols-3 md:grid-cols-5 items-center justify-end gap-1 text-sm font-normal">
          <span className="inline-flex items-center gap-1">
            <Square className="h-2 w-2 bg-blue-400 text-blue-400 rounded-xs" />
            Active
          </span>
          <span className="inline-flex items-center gap-1">
            <Square className="h-2 w-2 bg-blue-600 text-blue-600 rounded-xs" />
            Funded
          </span>
          <span className="inline-flex items-center gap-1">
            <Square className="h-2 w-2 bg-green-400 text-green-400 rounded-xs" />
            Released
          </span>
          <span className="inline-flex items-center gap-1">
            <Square className="h-2 w-2 bg-red-400 text-red-400 rounded-xs" />
            Disputed
          </span>
          <span className="inline-flex gap-1 items-center">
            <Square className="h-2 w-2 bg-gray-400 text-gray-400 rounded-xs" />
            Cancelled
          </span>
          
        </div>
      </div>

      {/* Bottom Status & Progress Bars */}
      <div className="flex flex-col bg-white p-2 rounded-2xl gap-2 text-sm m-2">
        <div className="inline-flex justify-between">
          <span>Active</span>
          {activePct}%
        </div>
        <div className="w-full h-1.5 rounded-2xl bg-gray-200 overflow-hidden">
          <div
            className="bg-blue-400 h-full rounded-2xl bar-animate"
            style={{ width: `${activePct}%` }}
          ></div>
        </div>
        {/* Funded */}
        <div className="inline-flex justify-between">
          <span>Funded</span>
          {fundedPct}%
        </div>
        <div className="w-full h-1.5 rounded-2xl bg-gray-200 overflow-hidden">
          <div
            className="bg-blue-600 h-full rounded-2xl bar-animate"
            style={{ width: `${fundedPct}%` }}
          ></div>
        </div>

        {/* Released */}
        <div className="inline-flex justify-between">
          <span>Released</span>
          {releasedPct}%
        </div>
        <div className="w-full h-1.5 rounded-2xl bg-gray-200 overflow-hidden">
          <div
            className="bg-green-400 h-full rounded-2xl bar-animate"
            style={{ width: `${releasedPct}%` }}
          ></div>
        </div>

        {/* Disputed */}
        <div className="inline-flex justify-between">
          <span>Disputed</span>
          {disputedPct}%
        </div>
        <div className="w-full h-1.5 rounded-2xl bg-gray-200 overflow-hidden">
          <div
            className="bg-red-400 h-full rounded-2xl bar-animate"
            style={{ width: `${disputedPct}%` }}
          ></div>
        </div>

        {/* Cancelled */}
        <div className="inline-flex justify-between">
          <span>Cancelled</span>
          {cancelledPct}%
        </div>
        <div className="w-full h-1.5 rounded-2xl bg-gray-200 overflow-hidden">
          <div
            className="bg-gray-400 h-full rounded-2xl bar-animate"
            style={{ width: `${cancelledPct}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
