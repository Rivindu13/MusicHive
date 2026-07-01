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
      <div className="admin-logo">MusicHive</div>

      <nav className="admin-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink key={item.path} to={item.path}>
              <Icon size={18} style={{ marginRight: "10px" }} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;