import {
  Users,
  ShieldAlert,
  CheckCircle,
  DollarSign,
  Receipt,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { admins } from "../api/admin.api";


type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
};

type EscrowData = {
  id: string;
  amountCents: number;
  status: string;
  releaseCondition: string;
  expiresAt: string;
  milestoneDetails: string | null;
  txRef: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
  payerName: string;
  payerEmail: string;
  payeeName: string;
  payeeEmail: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  isActive: boolean;
};

type DisputeRecord = {
  id: string;
  status: string;
};

const StatCard = ({ title, value, icon: Icon, accent }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 font-medium">{title}</p>
        <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
      </div>
      <div className="p-3 rounded-lg" style={{ backgroundColor: `${accent}15` }}>
        <Icon size={24} style={{ color: accent }} />
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { admin } = useAuthStore();
  const [recentActivity, setRecentActivity] = useState<EscrowData[]>([]);
  const [stats,setStats] = useState<StatCardProps[]>([
    {
      title: "Total Users",
      value: 0,
      icon: Users,
      accent: "#4169E1",
    },
    {
      title: "Active Disputes",
      value: 0,
      icon: ShieldAlert,
      accent: "#e52e2e",
    },
    {
      title: "Completed Transactions",
      value: 0,
      icon: CheckCircle,
      accent: "#22c55e",
    },
    {
      title: "Total Volume",
      value: "$0",
      icon: DollarSign,
      accent: "#000000",
    },
    {
      title: "Total Fees Collected",
      value: "0 ETB",
      icon: Receipt,
      accent: "#b45309",
    },
  ])
const loadStats = async () => {
  try {
    const data = await admins.fetchTransactions() as EscrowData[];
    const user = await admins.users() as AdminUser[];
    const disputes = await admins.fetchDispute() as DisputeRecord[];
    const statsRes = await admins.fetchStats() as { totalFeesCents: number; feeCount: number; totalEscrows: number; totalVolumeCents: number };
    const User = user.length;
    const activeEscrows = disputes.filter((d) => d.status !== "Resolved" && d.status !== "Closed").length;
    const completedEscrows = data.filter((f) => f.status === "released").length;
    const totalFees = (Number(statsRes.totalFeesCents ?? 0) / 100).toFixed(2) + " ETB";
    const recent = [...data]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    setRecentActivity(recent);
  setStats([
    {
      title: "Total Users",
      value: User??0,
      icon: Users,
      accent: "#4169E1",
    },
    {
      title: "Active Disputes",
      value: activeEscrows??0,
      icon: ShieldAlert,
      accent: "#e52e2e",
    },
    {
      title: "Completed Transactions",
      value:completedEscrows??0,
      icon: CheckCircle,
      accent: "#22c55e",
    },
    {
      title: "Total Fees Collected",
      value: totalFees,
      icon: Receipt,
      accent: "#b45309",
    },
  ]);
  } catch (error: unknown) {
   console.error(error)
  } 
  
  }
  
  useEffect(() => { 
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStats()
  },[])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "created":
        return "bg-yellow-100 text-yellow-700";
      case "funded":
        return "bg-blue-100 text-blue-700";
      case "released":
        return "bg-green-100 text-green-700";
      case "disputed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const timeAgo = (date: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col p-6 w-full min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {admin?.name || "Admin"}
        </h1>
        <p className="text-gray-600 mt-1">Admin dashboard overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center text-gray-500">
            No recent activity to display
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {recentActivity.map((act) => (
              <div key={act.id} className="flex items-center gap-4 px-4 py-3.5">
                <span
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(act.status)}`}
                >
                  {act.status}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {act.payerName || "Unknown"}{" "}
                    <span className="text-gray-400">{"\u2192"}</span>{" "}
                    {act.payeeName || "Unknown"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {act.txRef ? `Ref: ${act.txRef} \u00b7 ` : ""}
                    {timeAgo(act.createdAt)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                  {(act.amountCents / 100).toFixed(2)} ETB
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
