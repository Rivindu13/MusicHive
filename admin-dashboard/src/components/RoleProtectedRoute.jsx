import { Navigate } from "react-router-dom";

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const savedAdmin = localStorage.getItem("adminUser");
  const adminUser = savedAdmin ? JSON.parse(savedAdmin) : null;

  if (!adminUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(adminUser.role)) {
    if (adminUser.role === "manager") {
      return <Navigate to="/bookings" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleProtectedRoute;