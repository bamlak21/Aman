import {
  LayoutDashboard,
  ArrowRightLeft,
  CirclePlus,
  CreditCard,
  BanknoteArrowDown,
  ShieldAlert,
  type LucideProps,
  User2Icon,
  Shield,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const elements = {
  main: [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      link: "/dashboard",
    },
    {
      name: "Transactions",
      icon: ArrowRightLeft,
      link: "/transactions",
    },
  ],
  escrowActions: [
    {
      name: "Create Escrow",
      icon: CirclePlus,
      link: "/create-escrow",
    },
    {
      name: "Fund Escrow",
      icon: CreditCard,
      link: "/fund-escrow",
    },
    {
      name: "Release Funds",
      icon: BanknoteArrowDown,
      link: "/release-funds",
    },
    {
      name: "Manage Disputes",
      icon: ShieldAlert,
      link: "/disputes",
    },
  ],
};

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-1/6 bg-gray-100 min-h-screen rounded-2xl">
      <div className="w-full flex items-center gap-3 p-2 mt-4">
        <div className="bg-black rounded-xl w-10 h-10 flex items-center justify-center">
          <Shield stroke="#fff" size={24} />
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold">Aman Escrow</h2>
          <p className="font-light text-gray-500">Secure Transactions</p>
        </div>
      </div>

      <div className="p-3 mt-5">
        <h2 className="text-sm text-gray-500">Main</h2>
        {elements.main.map((m) => {
          const isActive = pathname === m.link;
          const Icon = m.icon as React.ForwardRefExoticComponent<
            Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
          >;
          return (
            <div className="mt-1">
              <h4
                onClick={() => navigate(m.link)}
                className={` flex items-center gap-1 p-1 cursor-pointer rounded transition-colors duration-200 ${isActive ? "bg-gray-300" : "hover:bg-gray-300"}`}
              >
                <Icon size={18} />
                {m.name}
              </h4>
            </div>
          );
        })}
      </div>
      <div className="p-3">
        <h2 className="text-sm text-gray-500">Escrow Actions</h2>
        {elements.escrowActions.map((m) => {
          const isActive = pathname === m.link;
          const Icon = m.icon as React.ForwardRefExoticComponent<
            Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
          >;
          return (
            <div className="mt-1">
              <h4
                onClick={() => navigate(m.link)}
                className={`flex items-center gap-1 p-1 cursor-pointer rounded transition-colors duration-200 ${isActive ? "bg-gray-300" : "hover:bg-gray-300"} `}
              >
                <Icon size={18} />
                {m.name}
              </h4>
            </div>
          );
        })}
      </div>

      <div className="mt-auto p-3 flex gap-5 border-t border-gray-300 items-center cursor-pointer hover:bg-gray-200 duration-200">
        <div className="rounded-full bg-gray-300 w-12 h-12 flex items-center justify-center">
          JA
        </div>
        <div className="flex flex-col">
          <p className="text-md">Jane McAliter</p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <User2Icon size={16} />
            Freelancer
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
