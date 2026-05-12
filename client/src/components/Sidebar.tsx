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
  LogOut,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { auth } from "../api/auth.api";

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
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await auth.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      logout();
      navigate("/sign-in");
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="flex flex-col w-64 h-full bg-gray-100 min-h-screen rounded-2xl">
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
            <div className="mt-1" key={m.link}>
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
            <div className="mt-1" key={m.link}>
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

      <div className="mt-auto p-3 flex gap-5 border-t border-gray-300 items-center">
        <div className="rounded-full bg-gray-300 w-12 h-12 flex items-center justify-center font-medium">
          {initials}
        </div>
        <div className="flex flex-col flex-1">
          <p className="text-sm">{user?.name || "User"}</p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <User2Icon size={16} />
            {user?.role || "User"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
