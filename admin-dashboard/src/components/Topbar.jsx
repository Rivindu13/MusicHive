import { useLocation, useNavigate } from "react-router-dom";

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
  "/settings": {
    title: "Admin Settings",
    subtitle: "System information, security, and dashboard preferences",
    badge: "System",
  },
};

const Topbar = () => {
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

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
};

export default Topbar;