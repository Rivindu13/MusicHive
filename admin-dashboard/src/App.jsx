import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/admin.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Artists from "./pages/Artists";
import Bookings from "./pages/Bookings";
import Payments from "./pages/Payments";
import Chords from "./pages/Chords";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";

import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtectedRoute from "./components/RoleProtectedRoute";

function App() {
  const savedAdmin = localStorage.getItem("adminUser");
  const adminUser = savedAdmin ? JSON.parse(savedAdmin) : null;

  let defaultRedirect = "/dashboard";

  if (adminUser?.role === "manager") {
    defaultRedirect = "/bookings";
  }

  if (adminUser?.role === "accountant") {
    defaultRedirect = "/payments";
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to={defaultRedirect} replace />} />

          <Route
            path="dashboard"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <Dashboard />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="users"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <Users />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="artists"
            element={
              <RoleProtectedRoute allowedRoles={["admin"]}>
                <Artists />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="bookings"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "manager"]}>
                <Bookings />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="payments"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "accountant"]}>
                <Payments />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="chords"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "manager"]}>
                <Chords />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="reviews"
            element={
              <RoleProtectedRoute allowedRoles={["admin", "manager"]}>
                <Reviews />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="settings"
            element={
              <RoleProtectedRoute
                allowedRoles={["admin", "manager", "accountant"]}
              >
                <Settings />
              </RoleProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;