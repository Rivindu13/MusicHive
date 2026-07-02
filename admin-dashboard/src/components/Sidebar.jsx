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
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    name: "Users",
    path: "/users",
    icon: Users,
    roles: ["admin"],
  },
  {
    name: "Artists",
    path: "/artists",
    icon: Mic2,
    roles: ["admin"],
  },
  {
    name: "Bookings",
    path: "/bookings",
    icon: CalendarCheck,
    roles: ["admin", "manager"],
  },
  {
    name: "Chords",
    path: "/chords",
    icon: Music,
    roles: ["admin"],
  },
  {
    name: "Reviews",
    path: "/reviews",
    icon: Star,
    roles: ["admin"],
  },
  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
    roles: ["admin", "manager"],
  },
];

const Sidebar = () => {
  const savedAdmin = localStorage.getItem("adminUser");
  const adminUser = savedAdmin ? JSON.parse(savedAdmin) : null;

  const role = adminUser?.role || "manager";

  const allowedMenuItems = menuItems.filter((item) =>
    item.roles.includes(role)
  );

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
          <p className="admin-brand-subtitle">
            {role === "manager" ? "Manager Panel" : "Admin Panel"}
          </p>
        </div>
      </div>

      <nav className="admin-menu">
        {allowedMenuItems.map((item) => {
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