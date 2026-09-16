import { useLocation, useNavigate } from "react-router-dom";
import { Download, Moon, Sun } from "lucide-react";
import { downloadRoleBasedReport } from "../utils/adminReportPdf";

const pageDetails = {
  "/dashboard": {
    title: "Dashboard Overview",
    subtitle: "Live summary of MusicHive platform activity",
    badge: "Analytics",
  },
  "/users": {
    title: "User Management",
    subtitle: "Manage artists, bands, organizers, and customer accounts",
    badge: "Accounts",
  },
  "/artists": {
    title: "Artist & Band Management",
    subtitle: "Review performer profiles, availability, and account status",
    badge: "Performers",
  },
  "/bookings": {
    title: "Booking Management",
    subtitle: "Track booking requests, payments, and event status",
    badge: "Reservations",
  },
  "/payments": {
    title: "Payment Management",
    subtitle: "Track paid, unpaid, refunded, and PayHere payment records",
    badge: "Finance",
  },
  "/chords": {
    title: "Chord Management",
    subtitle: "Manage chord posts and uploaded music content",
    badge: "Content",
  },
  "/reviews": {
    title: "Review Management",
    subtitle: "Moderate ratings and user feedback",
    badge: "Moderation",
  },
  "/reports": {
    title: "Reports & Disputes",
    subtitle: "Review submitted reports and manage dispute statuses",
    badge: "Moderation",
  },
  "/settings": {
    title: "Admin Settings",
    subtitle: "System information, security, and dashboard preferences",
    badge: "System",
  },
};

const Topbar = ({ theme, onThemeChange }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentPage = pageDetails[location.pathname] || {
    title: "MusicHive Admin",
    subtitle: "Manage MusicHive platform operations",
    badge: "Admin",
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("rememberAdmin");
    navigate("/login");
  };

  return (
    <header className="admin-topbar">
      <div className="topbar-left">
        <div>
          <h2>{currentPage.title}</h2>
          <p>{currentPage.subtitle}</p>
        </div>

        <span className="topbar-badge">{currentPage.badge}</span>
      </div>

      <div className="topbar-actions">
        <button
          className="theme-toggle"
          onClick={() => onThemeChange(theme === "dark" ? "light" : "dark")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
        <button className="report-btn" onClick={downloadRoleBasedReport}>
          <Download size={16} />
          Download PDF
        </button>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Topbar;