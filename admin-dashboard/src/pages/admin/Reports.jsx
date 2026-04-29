import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data for User Growth (monthly)
const userGrowthData = [
  { month: 'Jan', users: 120 },
  { month: 'Feb', users: 150 },
  { month: 'Mar', users: 180 },
  { month: 'Apr', users: 220 },
  { month: 'May', users: 270 },
  { month: 'Jun', users: 310 },
];

// Mock data for Booking Trends (monthly)
const bookingTrendsData = [
  { month: 'Jan', bookings: 45 },
  { month: 'Feb', bookings: 52 },
  { month: 'Mar', bookings: 61 },
  { month: 'Apr', bookings: 78 },
  { month: 'May', bookings: 95 },
  { month: 'Jun', bookings: 112 },
];

// Mock data for Content Activity (uploaded codes per month)
const contentActivityData = [
  { month: 'Jan', codes: 23 },
  { month: 'Feb', codes: 28 },
  { month: 'Mar', codes: 35 },
  { month: 'Apr', codes: 42 },
  { month: 'May', codes: 50 },
  { month: 'Jun', codes: 58 },
];

// Mock data for Revenue Overview (by category)
const revenueData = [
  { name: 'Booking Fees', value: 12500, color: '#0d6efd' },
  { name: 'Song Code Sales', value: 8750, color: '#198754' },
  { name: 'Subscriptions', value: 4200, color: '#ffc107' },
];

const Reports = () => {
  return (
    <div>
      <div className="mb-4">
        <h2>System Reports</h2>
        <p className="text-muted">View detailed analytics and reports</p>
      </div>

      {/* User Growth */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>User Growth</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#0d6efd" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Booking Trends */}
      <div className="card mb-4">
        <div className="card-header">
          <h5>Booking Trends</h5>
        </div>
        <div className="card-body">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bookingTrendsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#198754" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two-column layout for Content Activity and Revenue Overview */}
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5>Content Activity</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={contentActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="codes" stroke="#ffc107" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card h-100">
            <div className="card-header">
              <h5>Revenue Overview</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;