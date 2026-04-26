import React, { useState } from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { FaCalendarAlt, FaDollarSign, FaUsers } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const userName = user?.name || user?.email?.split('@')[0] || 'User';

  const metrics = {
    totalBookings: 5662,
    monthlyRevenue: 25400000,
    activeUsers: 2543,
  };

  const topArtists = [
    { name: 'Kamal Silva', earnings: 75000, rating: 4.9, bookings: 142 },
    { name: 'Nadeeka Guruge', earnings: 72000, rating: 4.8, bookings: 138 },
    { name: 'Samantha Perera', earnings: 68000, rating: 4.7, bookings: 121 },
    { name: 'Amal Wickremasinghe', earnings: 65000, rating: 4.9, bookings: 115 },
    { name: 'Ruwanthi Jayakody', earnings: 61000, rating: 4.6, bookings: 108 },
  ];

  // Mock monthly data for the four metrics
  const monthlyData = [
    { month: 'Jan', received: 4200000, processed: 3800000, pending: 400000, refunds: 80000 },
    { month: 'Feb', received: 4800000, processed: 4500000, pending: 300000, refunds: 60000 },
    { month: 'Mar', received: 5200000, processed: 5000000, pending: 200000, refunds: 100000 },
    { month: 'Apr', received: 6100000, processed: 5800000, pending: 300000, refunds: 70000 },
    { month: 'May', received: 7000000, processed: 6500000, pending: 400000, refunds: 120000 },
    { month: 'Jun', received: 8200000, processed: 7600000, pending: 500000, refunds: 150000 },
  ];

  // State to track which lines are visible
  const [visibleLines, setVisibleLines] = useState({
    received: true,
    processed: true,
    pending: true,
    refunds: true,
  });

  const toggleLine = (key) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatYAxis = (value) => `LKR ${value / 1000000}M`;

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Welcome Back, {userName}</h2>
          <p className="text-muted">Monitor platform performance and key metrics</p>
        </div>
        <Button variant="primary" size="sm">Export Report</Button>
      </div>

      {/* Metrics Row */}
      <Row className="mb-5">
        <Col md={4} className="mb-3">
          <div className="card h-100">
            <div className="card-body d-flex flex-column align-items-start">
              <div className="rounded d-flex align-items-center justify-content-center mb-3" 
                   style={{ backgroundColor: '#7308B1', width: '60px', height: '60px' }}>
                <FaCalendarAlt size={32} color="#fff" />
              </div>
              <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>
                {metrics.totalBookings.toLocaleString()}
              </h2>
              <h5 className="card-title text-white-50 mb-0">Total Bookings</h5>
            </div>
          </div>
        </Col>
        <Col md={4} className="mb-3">
          <div className="card h-100">
            <div className="card-body d-flex flex-column align-items-start">
              <div className="rounded d-flex align-items-center justify-content-center mb-3" 
                   style={{ backgroundColor: '#18A8A8', width: '60px', height: '60px' }}>
                <FaDollarSign size={32} color="#fff" />
              </div>
              <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>
                LKR {(metrics.monthlyRevenue / 1e6).toFixed(1)} M
              </h2>
              <h5 className="card-title text-white-50 mb-0">Monthly Revenue</h5>
            </div>
          </div>
        </Col>
        <Col md={4} className="mb-3">
          <div className="card h-100">
            <div className="card-body d-flex flex-column align-items-start">
              <div className="rounded d-flex align-items-center justify-content-center mb-3" 
                   style={{ backgroundColor: '#E0A70A', width: '60px', height: '60px' }}>
                <FaUsers size={32} color="#fff" />
              </div>
              <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>
                {metrics.activeUsers.toLocaleString()}
              </h2>
              <h5 className="card-title text-white-50 mb-0">Active Users</h5>
            </div>
          </div>
        </Col>
      </Row>

      {/* Top Performing Artists - Table */}
      <Card className="mb-5">
        <Card.Header as="h5">Top Performing Artists</Card.Header>
        <Card.Body className="p-0">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>Artist</th>
                <th>Booking Count</th>
                <th>Earnings (LKR)</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {topArtists.map((artist, idx) => (
                <tr key={idx}>
                  <td className="fw-semibold">{artist.name}</td>
                  <td>{artist.bookings}</td>
                  <td>LKR {artist.earnings.toLocaleString()}</td>
                  <td><Badge bg="warning" text="dark">★ {artist.rating}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card.Body>
      </Card>

      {/* Monthly Trends with Interactive Chart */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">Monthly Trends</h5>
          <div className="d-flex gap-2 flex-wrap">
            <Button 
              variant={visibleLines.received ? "primary" : "outline-light"} 
              size="sm"
              onClick={() => toggleLine('received')}
            >
              Payments Received
            </Button>
            <Button 
              variant={visibleLines.processed ? "primary" : "outline-light"} 
              size="sm"
              onClick={() => toggleLine('processed')}
            >
              Processed
            </Button>
            <Button 
              variant={visibleLines.pending ? "primary" : "outline-light"} 
              size="sm"
              onClick={() => toggleLine('pending')}
            >
              Pending
            </Button>
            <Button 
              variant={visibleLines.refunds ? "primary" : "outline-light"} 
              size="sm"
              onClick={() => toggleLine('refunds')}
            >
              Refunds
            </Button>
            <Button variant="primary" size="sm">Export</Button>
          </div>
        </Card.Header>
        <Card.Body>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis tickFormatter={formatYAxis} stroke="#ccc" />
              <Tooltip 
                formatter={(value) => `LKR ${value.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#16162B', borderColor: '#23AFAF', color: '#fff' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend wrapperStyle={{ color: '#fff' }} />
              {visibleLines.received && (
                <Line type="monotone" dataKey="received" stroke="#23AFAF" name="Payments Received" strokeWidth={2} dot={{ r: 4 }} />
              )}
              {visibleLines.processed && (
                <Line type="monotone" dataKey="processed" stroke="#E0A70A" name="Processed" strokeWidth={2} dot={{ r: 4 }} />
              )}
              {visibleLines.pending && (
                <Line type="monotone" dataKey="pending" stroke="#FF6B6B" name="Pending" strokeWidth={2} dot={{ r: 4 }} />
              )}
              {visibleLines.refunds && (
                <Line type="monotone" dataKey="refunds" stroke="#AA6DC9" name="Refunds" strokeWidth={2} dot={{ r: 4 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
          <div className="text-muted small text-center mt-3">
            * Click any filter button to show/hide the corresponding data line.
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;