import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Menu, X } from "lucide-react";
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
        className={`fixed top-0 left-0 h-full z-50 lg:hidden transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <Sidebar />
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute -right-10 top-4 p-2 bg-white rounded-lg shadow-md"
        >
          <X size={20} />
        </button>
      </div>

      <main className="flex-1 flex flex-col p-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200"
        >
          <Menu size={20} />
        </button>
        <div className="lg:mt-0 mt-10 flex-1 h-full overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
