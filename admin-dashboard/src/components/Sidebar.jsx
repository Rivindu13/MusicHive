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
import logo from "../assets/musichive-logo.png";

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
        <img src={logo} alt="MusicHive Logo" className="admin-brand-logo" />
        <span>MusicHive</span>
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