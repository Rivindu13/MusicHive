import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Reports = () => {
  const bookingStats = {
    completed: 5200,
    pending: 100,
    cancelled: 40,
  };

  const revenueBreakdown = {
    artistBookings: 200000000,
    platformFees: 100000000,
    premiumFeatures: 40000000,
  };

  // Mock data for User Engagement (daily active users over 7 days)
  const engagementData = [
    { day: 'Mon', users: 1200 },
    { day: 'Tue', users: 1350 },
    { day: 'Wed', users: 1480 },
    { day: 'Thu', users: 1620 },
    { day: 'Fri', users: 1890 },
    { day: 'Sat', users: 2100 },
    { day: 'Sun', users: 1950 },
  ];

  // Mock data for Popular Genres (pie chart)
  const genreData = [
    { name: 'Rock', value: 35, color: '#23AFAF' },
    { name: 'Pop', value: 28, color: '#E0A70A' },
    { name: 'Hip Hop', value: 20, color: '#AA6DC9' },
    { name: 'Jazz', value: 10, color: '#FF6B6B' },
    { name: 'Classical', value: 7, color: '#4D4D9F' },
  ];

  return (
    <div className="p-4">
      <h2 className="mb-1">System Reports</h2>
      <p className="text-muted mb-4">Detailed analytics and performance reports</p>

      {/* 2x2 Grid */}
      <Row className="g-4">
        {/* Card 1: Booking Statistics */}
        <Col xs={12} md={6}>
          <Card className="h-100">
            <Card.Header as="h5">Booking Statistics</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <span>Completed Bookings</span>
                <strong>{bookingStats.completed.toLocaleString()}</strong>
              </div>
              <hr className="my-3" />
              <div className="d-flex justify-content-between align-items-center">
                <span>Pending Bookings</span>
                <strong>{bookingStats.pending.toLocaleString()}</strong>
              </div>
              <hr className="my-3" />
              <div className="d-flex justify-content-between align-items-center">
                <span>Cancelled Bookings</span>
                <strong>{bookingStats.cancelled.toLocaleString()}</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 2: Revenue Breakdown */}
        <Col xs={12} md={6}>
          <Card className="h-100">
            <Card.Header as="h5">Revenue Breakdown</Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <span>Artist Bookings</span>
                <strong>LKR {(revenueBreakdown.artistBookings / 1e6).toFixed(0)} M</strong>
              </div>
              <hr className="my-3" />
              <div className="d-flex justify-content-between align-items-center">
                <span>Platform Fees</span>
                <strong>LKR {(revenueBreakdown.platformFees / 1e6).toFixed(0)} M</strong>
              </div>
              <hr className="my-3" />
              <div className="d-flex justify-content-between align-items-center">
                <span>Premium Features</span>
                <strong>LKR {(revenueBreakdown.premiumFeatures / 1e6).toFixed(0)} M</strong>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 3: User Engagement - Line Chart */}
        <Col xs={12} md={6}>
          <Card className="h-100">
            <Card.Header as="h5">User Engagement</Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="day" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16162B', borderColor: '#23AFAF', color: '#fff' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: '#fff' }} />
                  <Line type="monotone" dataKey="users" stroke="#23AFAF" name="Active Users" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-muted small text-center mt-2">Daily active users over last 7 days</div>
            </Card.Body>
          </Card>
        </Col>

        {/* Card 4: Popular Genres - Pie Chart */}
        <Col xs={12} md={6}>
          <Card className="h-100">
            <Card.Header as="h5">Popular Genres</Card.Header>
            <Card.Body>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#16162B', borderColor: '#23AFAF', color: '#fff' }}
                    formatter={(value) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-muted small text-center mt-2">Genre distribution by booking volume</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;