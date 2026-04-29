import React from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';
import { FaBell, FaMoneyBillWave, FaTrophy, FaFileAlt, FaUndoAlt, FaExclamationTriangle } from 'react-icons/fa';

const Notifications = () => {
  // Mock notification data
  const notifications = [
    {
      id: 1,
      title: 'New payment received',
      description: 'LKR 75,000 from booking',
      time: '5 minutes ago',
      icon: <FaMoneyBillWave className="me-3" size={24} color="#23AFAF" />,
      variant: 'success',
    },
    {
      id: 2,
      title: 'Booking milestone reached',
      description: '500+ bookings completed this month',
      time: '2 hours ago',
      icon: <FaTrophy className="me-3" size={24} color="#E0A70A" />,
      variant: 'warning',
    },
    {
      id: 3,
      title: 'Monthly report ready',
      description: 'December 2024 analytics report is ready',
      time: '5 hours ago',
      icon: <FaFileAlt className="me-3" size={24} color="#AA6DC9" />,
      variant: 'info',
    },
    {
      id: 4,
      title: 'Refund processed',
      description: 'LKR 35,000 refunded to customer',
      time: '1 day ago',
      icon: <FaUndoAlt className="me-3" size={24} color="#FF6B6B" />,
      variant: 'danger',
    },
    {
      id: 5,
      title: 'High traffic detected',
      description: 'Platform experiencing 2x normal traffic',
      time: '2 days ago',
      icon: <FaExclamationTriangle className="me-3" size={24} color="#FFA500" />,
      variant: 'warning',
    },
  ];

  return (
    <div className="p-4">
      <h2 className="mb-1">Notifications</h2>
      <p className="text-muted mb-4">System alerts and important updates</p>

      <Card>
        <Card.Header as="h5">Recent Alerts</Card.Header>
        <ListGroup variant="flush">
          {notifications.map((notif) => (
            <ListGroup.Item key={notif.id} className="bg-transparent text-white py-3">
              <div className="d-flex align-items-start">
                <div className="flex-shrink-0">
                  {notif.icon}
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex justify-content-between align-items-center flex-wrap">
                    <strong className="me-2">{notif.title}</strong>
                    <Badge bg={notif.variant} pill className="mb-1">
                      {notif.time}
                    </Badge>
                  </div>
                  <p className="mb-0 text-muted small">{notif.description}</p>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>
    </div>
  );
};

export default Notifications;