import {
  Shield,
  Users,
  AlertTriangle,
  ArrowRightLeft,
  LayoutDashboard,
  User2Icon,
  LogOutIcon,
  type LucideProps,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useState } from "react";
import ConfirmModal from "./ConfirmModal";

const elements = {
  main: [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      link: "/dashboard",
    },
    {
      name: "Users",
      icon: Users,
      link: "/users",
    },
    {
      name: "Transactions",
      icon: ArrowRightLeft,
      link: "/transactions",
    },
    {
      name: "Disputes",
      icon: AlertTriangle,
      link: "/disputes",
    },
  ],
};

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const getInitials = (name?: string) => name?.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col w-full h-full bg-gray-900 text-white rounded-r-xl">
      <div className="w-full flex items-center gap-3 p-4 mt-2">
        <div className="bg-gray-700 rounded-xl w-10 h-10 flex items-center justify-center">
          <Shield stroke="#fff" size={24} />
        </div>
        <div className="flex flex-col">
          <h2 className="font-bold text-lg">Aman Admin</h2>
          <p className="text-sm text-gray-400">Admin Portal</p>
        </div>
      </div>

      <div className="p-3 mt-4">
        <h2 className="text-xs uppercase text-gray-500 font-semibold tracking-wider">Main</h2>
        {elements.main.map((m) => {
          const isActive = pathname === m.link;
          const Icon = m.icon as React.ForwardRefExoticComponent<
            Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
          >;
          return (
            <div key={m.name} className="mt-1">
              <h4
                onClick={() => navigate(m.link)}
                className={`flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-colors duration-200 ${
                  isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon size={18} />
                {m.name}
              </h4>
            </div>
          );
        })}
      </div>

      <div className="mt-auto p-4 flex gap-3 border-t border-gray-700 items-center cursor-pointer hover:bg-gray-800 duration-200">
        <div className="rounded-full bg-gray-700 w-10 h-10 flex items-center justify-center font-semibold text-sm">
          {getInitials(admin?.name) || "AD"}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium">{admin?.name || "Admin"}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <User2Icon size={14} />
            {admin?.role || "Admin"}
          </p>
        </div>
        <div className="ml-auto">
          <button onClick={() => setShowLogoutConfirm(true)}>
            <LogOutIcon size={18} />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutConfirm}
        title={"Confirm Logout"}
        message={"Are you sure you want to log out?"}
        confirmText={"Logout"}
        cancelText={"Cancel"}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
          navigate("/login");
        }}
      />
    </div>
  );
};

export default Sidebar;
