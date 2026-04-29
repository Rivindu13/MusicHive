import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/admin/Dashboard';
import Users from '../pages/admin/Users';
import Content from '../pages/admin/Content';
import Roles from '../pages/admin/Roles';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';

const AdminRoutes = () => {
  console.log("AdminRoutes rendered");
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="users" element={<Users />} />
      <Route path="content" element={<Content />} />
      <Route path="roles" element={<Roles />} />
      <Route path="reports" element={<Reports />} />
      <Route path="settings" element={<Settings />} />
    </Routes>
  );
};

export default AdminRoutes;