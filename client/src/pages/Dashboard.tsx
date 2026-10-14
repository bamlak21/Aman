import {
  CheckCircle,
  Clock,
  DollarSign,
  Lock,
  ShieldAlert,
  Loader2,
  type LucideProps,
} from "lucide-react";
import Cards from "../components/Cards";
import Heading from "../components/Heading";
import RecentTransactions from "../components/RecentTransactions";
import { useAuthStore } from "../store/useAuthStore";
import { escrow } from "../api/escrow.api";
import { useEffect, useState } from "react";
import Analytics from "../components/Analytics";

type CardData = {
  title: string;
  value: string | number;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  text: string;
  accent: "yellow" | "teal" | "purple" | "red"|"blue";
};

const etb = (cents: number) => `${(cents / 100).toFixed(2)} ETB`;

const Dashboard = () => {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(" ")[0] || "User";
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CardData[]>([
    {
      title: "Available",
      value: 0,
      icon: DollarSign,
      text: "Spendable balance",
      accent: "yellow",
    },
    {
      title: "In Escrow",
      value: 0,
      icon: Lock,
      text: "Held by active escrows",
      accent: "purple",
    },
    {
      title: "Active Escrows",
      value: 0,
      icon: Clock,
      text: "Pending & funded",
      accent: "blue",
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
    const fetchStats = async () => {
    try {
      
      const wallet = await escrow.myTotalEscrow();
      const balance = wallet?.balanceCents ?? 0;
      const locked = wallet?.lockedCents ?? 0;

      const res = await escrow.myEscrow();
      const escrows = res.escrows || [];

      // "Active" is anything still holding money or still waiting on the payer:
      // funded escrows are locked, created ones are owed a payment.
      const activeEscrows = escrows.filter(
        (e) => e.status === "created" || e.status === "funded"
      ).length;
      const completed = escrows.filter((e) => e.status === "released").length;
      const disputes = escrows.filter((e) => e.status === "disputed").length;

      setStats([
        {
          title: "Available",
          value: etb(balance),
          icon: DollarSign,
          text: "Spendable balance",
          accent: "yellow",
        },
        {
          title: "In Escrow",
          value: etb(locked),
          icon: Lock,
          text: locked > 0 ? "Held by active escrows" : "No funds currently locked",
          accent: "purple",
        },
        {
          title: "Active Escrows",
          value: activeEscrows,
          icon: Clock,
          text: "Pending & funded",
          accent: "blue",
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
  fetchStats()
  }, []);

  
  return (
    <div className="p-5 min-h-screen max-w-full ">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mt-6">
            {stats.map((card) => (
              <Cards {...card} key={card.title} />
            ))}
          </div>

          <div className="mt-6 flex flex-col lg:flex-row gap-4">
              {/* <QuickActions /> */}
              <Analytics/>
            <RecentTransactions />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
