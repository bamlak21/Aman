import { CheckCircle, Clock, DollarSign, ShieldAlert } from "lucide-react";
import Cards from "../components/Cards";
import Heading from "../components/Heading";
import QuickActions from "../components/QuickActions";
import RecentTransactions from "../components/RecentTransactions";

const cardData = [
  {
    title: "Total Value",
    value: 7500,
    icon: DollarSign,
    text: "Across 2 transactions",
  },
  {
    title: "Active Escrows",
    value: 1,
    icon: Clock,
    text: "Pending & funded",
  },
  {
    title: "Completed",
    value: 0,
    icon: CheckCircle,
    text: "Successfully released",
  },
  {
    title: "Disputes",
    value: 1,
    icon: ShieldAlert,
    text: "Need resolution",
  },
];

const greetings = {
  heading: "Welcome Back, Jane McAliter.",
  subheading: " Manage Your secure escrow transactions",
};

const Dashboard = () => {
  return (
    <>
      <Heading heading={greetings.heading} subheading={greetings.subheading} />
      <div className="flex items-center justify-between mt-5">
        {cardData.map((card, i) => {
          return <Cards {...card} key={i} />;
        })}
      </div>
      <div className="mt-5 flex gap-2">
        <QuickActions />
        <RecentTransactions />
      </div>
    </>
  );
};

export default Dashboard;
