import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/manager/Dashboard';
import Users from '../pages/manager/Users';
import Content from '../pages/manager/Content';
import Reports from '../pages/manager/Reports';

const ManagerRoutes = () => {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="users" element={<Users />} />
      <Route path="content" element={<Content />} />
      <Route path="reports" element={<Reports />} />
    </Routes>
  );
};

export default ManagerRoutes;