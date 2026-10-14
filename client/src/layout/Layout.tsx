import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import NotificationBell from "../components/NotificationBell";
import { Menu } from "lucide-react";
import { useState } from "react";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      <div className="lg:block hidden min-h-screen">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`overflow-y-auto fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar />
        {/* <button
          onClick={() => setSidebarOpen(false)}
          className="absolute left-54  top-4 p-2 bg-white rounded-lg shadow-md"
        >
          <X size={20} />
        </button> */}
      </div>

      <main className="flex-1 flex flex-col min-w-0 overflow-auto ">
        <div className="flex items-center justify-between p-3 border-b border-gray-200 shadow-gray-200 shadow-sm/30 ">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 bg-white rounded-lg shadow-md border border-gray-200"
          >
            <Menu size={20} />
          </button>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>
        <div className="flex-1 min-h-screen ">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
