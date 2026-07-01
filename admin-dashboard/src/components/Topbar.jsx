import { useNavigate } from "react-router-dom";

const Topbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  return (
    <header className="admin-topbar">
      <div>
        <h2>Admin Panel</h2>
        <p>Manage MusicHive users, artists, bookings, chords, and reviews</p>
      </div>

      <button onClick={handleLogout}>Logout</button>
    </header>
  );
};

export default Topbar;