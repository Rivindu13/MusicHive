import { FaUsers, FaDollarSign, FaCalendarAlt } from 'react-icons/fa';

const Dashboard = () => {
  const activities = [
    { id: 1, text: "Kamal Silva joined as an artist", time: "2 minutes ago" },
    { id: 2, text: "Review received 3 reports", time: "15 minutes ago" },
    { id: 3, text: "Manager updated system settings", time: "20 minutes ago" },
    { id: 4, text: "New song code uploaded by The Beatles", time: "1 hour ago" },
  ];

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p className="text-muted mb-3">Welcome back! Here's what's happening with MusicHive today.</p>

      <div className="row mb-4">
        {/* Total Users Card */}
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body d-flex flex-column align-items-start">
              <div className="rounded d-flex align-items-center justify-content-center mb-3" 
                   style={{ backgroundColor: '#E0A70A', width: '60px', height: '60px' }}>
                <FaUsers size={32} color="#fff" />
              </div>
              <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>5,662</h2>
              <h5 className="card-title text-white-50 mb-0">Total Users</h5>
            </div>
          </div>
        </div>

        {/* Active Users / Revenue Card */}
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body d-flex flex-column align-items-start">
              <div className="rounded d-flex align-items-center justify-content-center mb-3" 
                   style={{ backgroundColor: '#18A8A8', width: '60px', height: '60px' }}>
                <FaDollarSign size={32} color="#fff" />
              </div>
              <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>LKR 25.4 M</h2>
              <h5 className="card-title text-white-50 mb-0">Active Users</h5>
            </div>
          </div>
        </div>

        {/* Total Bookings Card */}
        <div className="col-md-4 mb-3">
          <div className="card h-100">
            <div className="card-body d-flex flex-column align-items-start">
              <div className="rounded d-flex align-items-center justify-content-center mb-3" 
                   style={{ backgroundColor: '#7308B1', width: '60px', height: '60px' }}>
                <FaCalendarAlt size={32} color="#fff" />
              </div>
              <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>2,543</h2>
              <h5 className="card-title text-white-50 mb-0">Total Bookings</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Recent User Activity Card */}
      <div className="card">
        <div className="card-header">
          <h5>Recent User Activity</h5>
        </div>
        <div className="card-body">
          {activities.length === 0 ? (
            <p>No recent activity.</p>
          ) : (
            <ul className="list-group list-group-flush">
              {activities.map((activity) => (
                <li key={activity.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {activity.text}
                  <span className="badge bg-secondary rounded-pill">{activity.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;