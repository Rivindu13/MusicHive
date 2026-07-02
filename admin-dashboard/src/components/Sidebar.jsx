import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Mic2,
  CalendarCheck,
  Music,
  Star,
  Settings,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Users", path: "/users", icon: Users },
  { name: "Artists", path: "/artists", icon: Mic2 },
  { name: "Bookings", path: "/bookings", icon: CalendarCheck },
  { name: "Chords", path: "/chords", icon: Music },
  { name: "Reviews", path: "/reviews", icon: Star },
  { name: "Settings", path: "/settings", icon: Settings },
];

const Sidebar = () => {
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div className="admin-brand-logo-wrap">
          <img
            src="/musichive-logo.png"
            alt="MusicHive Logo"
            className="admin-brand-logo"
          />
        </div>

        <div>
          <span className="admin-brand-title">MusicHive</span>
          <p className="admin-brand-subtitle">Admin Panel</p>
        </div>
      </div>

      <nav className="admin-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink key={item.path} to={item.path}>
              <Icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;