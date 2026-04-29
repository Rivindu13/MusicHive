import { NavLink } from 'react-router-dom';
import { 
  FaHome, FaUsers, FaMusic, FaShieldAlt, FaChartLine, FaCog, 
  FaUser, FaSignOutAlt, FaMoneyBillWave, FaBell, FaUndoAlt, FaHistory 
} from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.role;

  // Admin menu
  const adminMenu = [
    { path: '/', name: 'Dashboard', icon: <FaHome className="me-2" /> },
    { path: '/users', name: 'Users', icon: <FaUsers className="me-2" /> },
    { path: '/content', name: 'Content', icon: <FaMusic className="me-2" /> },
    { path: '/roles', name: 'Roles & Permissions', icon: <FaShieldAlt className="me-2" /> },
    { path: '/reports', name: 'Reports', icon: <FaChartLine className="me-2" /> },
    { path: '/settings', name: 'Settings', icon: <FaCog className="me-2" /> },
  ];

  // Manager menu
  const managerMenu = [
    { path: '/', name: 'Dashboard', icon: <FaHome className="me-2" /> },
    { path: '/payments-summary', name: 'Payments Summary', icon: <FaMoneyBillWave className="me-2" /> },
    { path: '/reports', name: 'Reports', icon: <FaChartLine className="me-2" /> },
    { path: '/notifications', name: 'Notifications', icon: <FaBell className="me-2" /> },
  ];

  // Accountant menu
  const accountantMenu = [
    { path: '/', name: 'Dashboard', icon: <FaHome className="me-2" /> },
    { path: '/payments', name: 'Payments', icon: <FaMoneyBillWave className="me-2" /> },
    { path: '/refund-requests', name: 'Refund Requests', icon: <FaUndoAlt className="me-2" /> },
    { path: '/transaction-history', name: 'Transaction History', icon: <FaHistory className="me-2" /> },
  ];

  let menuItems = [];
  if (role === 'admin') menuItems = adminMenu;
  else if (role === 'manager') menuItems = managerMenu;
  else if (role === 'accountant') menuItems = accountantMenu;
  else menuItems = adminMenu; // fallback

  return (
    <div className="sidebar d-flex flex-column justify-content-between p-3">
      <div>
        <h4 className="text-white mb-4">MusicHive</h4>
        <ul className="nav flex-column">
          {menuItems.map((item) => (
            <li className="nav-item mb-2" key={item.path}>
              <NavLink to={item.path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {item.icon} {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <hr className="text-white-50" />
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <NavLink to="/profile" className="nav-link">
              <FaUser className="me-2" /> Profile
            </NavLink>
          </li>
          <li className="nav-item">
            <button className="nav-link btn text-white" onClick={logout}>
              <FaSignOutAlt className="me-2" /> Log out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;