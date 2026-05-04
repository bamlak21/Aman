import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const AdminLayout = () => (
  <div className="flex h-screen bg-gray-100">
    <div className="w-64 min-h-screen">
      <Sidebar />
    </div>
    <div className="flex-1 h-full overflow-auto">
      <Outlet />
    </div>
  </div>
);

export default AdminLayout;
