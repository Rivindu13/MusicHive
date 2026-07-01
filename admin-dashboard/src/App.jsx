import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/admin.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Artists from "./pages/Artists";
import Bookings from "./pages/Bookings";
import Chords from "./pages/Chords";
import Reviews from "./pages/Reviews";
import Settings from "./pages/Settings";

import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
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
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="artists" element={<Artists />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="chords" element={<Chords />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;