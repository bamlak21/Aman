import {
  CheckCircle,
  Clock,
  DollarSign,
  ShieldAlert,
  Loader2,
  type LucideProps,
} from "lucide-react";
import Cards from "../components/Cards";
import Heading from "../components/Heading";
import QuickActions from "../components/QuickActions";
import RecentTransactions from "../components/RecentTransactions";
import { useAuthStore } from "../store/useAuthStore";
import { escrow } from "../api/escrow.api";
import { useEffect, useState } from "react";

type CardData = {
  title: string;
  value: string | number;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  text: string;
  accent: "yellow" | "teal" | "purple" | "red";
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(" ")[0] || "User";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CardData[]>([
    {
      title: "Total Value",
      value: 0,
      icon: DollarSign,
      text: "Across all transactions",
      accent: "yellow",
    },
    {
      title: "Active Escrows",
      value: 0,
      icon: Clock,
      text: "Pending & funded",
      accent: "teal",
    },
    {
      title: "Completed",
      value: 0,
      icon: CheckCircle,
      text: "Successfully released",
      accent: "purple",
    },
    {
      title: "Disputes",
      value: 0,
      icon: ShieldAlert,
      text: "Need resolution",
      accent: "red",
    },
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await escrow.myEscrow();
      const escrows = res.escrows || [];
      const totalReleased = escrows.filter((e)=> e.status==='released')
      const totalValue = totalReleased.reduce(
        (sum, e) => sum + (e.amountCents || 0),
        0
      );
      const activeEscrows = escrows.filter(
        (e) => e.status === "created" || e.status === "funded"
      ).length;
      const completed = escrows.filter((e) => e.status === "released").length;
      const disputes = escrows.filter((e) => e.status === "disputed").length;

      setStats([
        {
          title: "Total Value",
          value: `${(totalValue / 100).toFixed(0)} ETB`,
          icon: DollarSign,
          text: `Across ${escrows.length} transaction${escrows.length !== 1 ? "s" : ""}`,
          accent: "yellow",
        },
        {
          title: "Active Escrows",
          value: activeEscrows,
          icon: Clock,
          text: "Pending & funded",
          accent: "purple",
        },
        {
          title: "Completed",
          value: completed,
          icon: CheckCircle,
          text: "Successfully released",
          accent: "teal",
        },
        {
          title: "Disputes",
          value: disputes,
          icon: ShieldAlert,
          text: "Need resolution",
          accent: "red",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Heading
        heading={`Welcome Back, ${firstName}.`}
        subheading="Manage your secure escrow transactions"
      />

      {loading ? (
        <div className="flex justify-center items-center h-48 mt-8">
          <Loader2 className="animate-spin w-8 h-8 text-gray-400" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {stats.map((card) => (
              <Cards {...card} key={card.title} />
            ))}
          </div>

          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            <QuickActions />
            <RecentTransactions />
          </div>
        </>
      )}
    </>
  );
};

export default Dashboard;
