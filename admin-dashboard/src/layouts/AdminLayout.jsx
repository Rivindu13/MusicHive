import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

const AdminLayout = () => {
  return (
    <div className="admin-layout">
      <Sidebar />

      <main className="admin-main">
        <Topbar />

        <div className="admin-content">
          <div className="admin-content-shell">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;