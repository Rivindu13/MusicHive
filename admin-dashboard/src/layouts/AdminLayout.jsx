import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useEffect, useState } from "react";

const AdminLayout = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("adminTheme") || "light"
  );

  useEffect(() => {
    document.documentElement.dataset.adminTheme = theme;
    localStorage.setItem("adminTheme", theme);
  }, [theme]);

  return (
    <div className={`admin-layout admin-theme-${theme}`}>
      <Sidebar />

      <main className="admin-main">
        <Topbar theme={theme} onThemeChange={setTheme} />

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