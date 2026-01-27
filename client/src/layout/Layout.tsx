import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const Layout = () => {
  return (
    <div className="flex gap-1">
      <Sidebar />
      <main className="flex-2 flex flex-col p-3">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
