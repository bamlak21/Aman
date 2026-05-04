import {
  Users,
  ShieldAlert,
  CheckCircle,
  DollarSign,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
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

  const stats = [
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
  ];

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
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 text-center text-gray-500">
          No recent activity to display
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
