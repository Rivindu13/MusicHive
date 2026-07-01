import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { getDashboardStats } from "../services/adminApi";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalBookings: 0,
    totalReviews: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Dashboard error:", error.message);
      }
    };

    loadStats();
  }, []);

  return (
    <div>
      <h1 className="admin-page-title">Dashboard Overview</h1>

      <div className="stat-grid">
        <StatCard title="Total Users" value={stats.totalUsers} />
        <StatCard title="Total Artists" value={stats.totalArtists} />
        <StatCard title="Total Bookings" value={stats.totalBookings} />
        <StatCard title="Total Reviews" value={stats.totalReviews} />
      </div>

      <div className="admin-card" style={{ marginTop: "24px" }}>
        <h2>Recent Activity</h2>
        <p>Recent platform activity will appear here.</p>
      </div>
    </div>
  );
};

export default Dashboard;