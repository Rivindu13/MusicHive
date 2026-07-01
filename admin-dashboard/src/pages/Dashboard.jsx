import { useEffect, useState } from "react";
import StatCard from "../components/StatCard";
import { getDashboardStats } from "../services/adminApi";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalArtists: 0,
    totalBands: 0,
    totalOrganizers: 0,
    totalBookings: 0,
    totalChords: 0,
    totalReviews: 0,
    activeUsers: 0,
    blockedUsers: 0,
    recentUsers: [],
    recentBookings: [],
  });

  const [loading, setLoading] = useState(true);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Dashboard stats error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardStats();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Dashboard Overview</h1>
        <p className="admin-page-subtitle">
          Live overview of MusicHive users, artists, bookings, chords, and reviews.
        </p>
      </div>

      {loading ? (
        <div className="admin-card">
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard title="Total Users" value={stats.totalUsers} />
            <StatCard title="Artists" value={stats.totalArtists} />
            <StatCard title="Bands" value={stats.totalBands} />
            <StatCard title="Organizers" value={stats.totalOrganizers} />
            <StatCard title="Bookings" value={stats.totalBookings} />
            <StatCard title="Chords" value={stats.totalChords} />
            <StatCard title="Reviews" value={stats.totalReviews} />
            <StatCard title="Blocked Users" value={stats.blockedUsers} />
          </div>

          <div className="dashboard-grid">
            <div className="admin-card">
              <h2 className="section-title">Recent Users</h2>

              {stats.recentUsers.length === 0 ? (
                <p className="muted-text">No recent users found.</p>
              ) : (
                <div className="mini-list">
                  {stats.recentUsers.map((user) => (
                    <div className="mini-list-item" key={user._id}>
                      <div>
                        <strong>{user.name || "N/A"}</strong>
                        <p>{user.email}</p>
                      </div>
                      <span className="status-badge active">{user.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-card">
              <h2 className="section-title">Recent Bookings</h2>

              {stats.recentBookings.length === 0 ? (
                <p className="muted-text">No recent bookings found.</p>
              ) : (
                <div className="mini-list">
                  {stats.recentBookings.map((booking) => (
                    <div className="mini-list-item" key={booking._id}>
                      <div>
                        <strong>Booking</strong>
                        <p>
                          {booking.createdAt
                            ? new Date(booking.createdAt).toLocaleDateString()
                            : "Date not available"}
                        </p>
                      </div>
                      <span className="status-badge pending">
                        {booking.status || "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;