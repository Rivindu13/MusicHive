import React from 'react';
import { Card, Row, Col, Button, Form, Table } from 'react-bootstrap';

const PaymentsSummary = () => {
  const transactions = [
    { date: '2025-04-01', description: 'Booking #1234 - Kamal Silva', amount: 25000, method: 'Credit Card', status: 'Completed' },
    { date: '2025-04-02', description: 'Booking #1235 - Nadeeka Guruge', amount: 18000, method: 'Bank Transfer', status: 'Pending' },
    { date: '2025-04-03', description: 'Platform fee - April', amount: 5000, method: 'Credit Card', status: 'Completed' },
    { date: '2025-04-04', description: 'Refund - Booking #1220', amount: -3500, method: 'Credit Card', status: 'Refunded' },
    { date: '2025-04-05', description: 'Booking #1240 - Saman Perera', amount: 32000, method: 'Digital Wallet', status: 'Processing' },
  ];

  const summaryMetrics = [
    { label: 'Total Payments', value: 'LKR 5,662,000' },
    { label: 'Completed', value: 'LKR 4,850,000' },
    { label: 'Pending', value: 'LKR 512,000' },
    { label: 'Refunds', value: 'LKR 300,000' },
  ];

  const getStatusBadge = (status) => {
    const color = {
      Completed: 'success',
      Pending: 'warning',
      Processing: 'info',
      Refunded: 'danger',
    }[status] || 'secondary';
    return <span className={`badge bg-${color}`}>{status}</span>;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Payment Summary</h2>
          <p className="text-muted">Track all platform transactions and payments</p>
        </div>
        <div className="d-flex gap-3 align-items-center">
          <Form.Select style={{ width: '150px' }} className="bg-dark text-white">
            <option>March 2025</option>
            <option>April 2025</option>
            <option>May 2025</option>
          </Form.Select>
          <Button variant="primary">Export</Button>
        </div>
      </div>

      <Row className="g-4 mb-5">
        {summaryMetrics.map((metric, idx) => (
          <Col md={3} key={idx}>
            <Card className="text-center p-2 h-100">
              <Card.Body>
                <h6 className="text-muted">{metric.label}</h6>
                <h4 className="fw-bold mb-0">{metric.value}</h4>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Card.Header as="h5">Transaction History</Card.Header>
        <Card.Body className="p-0">
          <Table hover responsive className="mb-0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Amount LKR</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => (
                <tr key={idx}>
                  <td>{tx.date}</td>
                  <td>{tx.description}</td>
                  <td className={tx.amount < 0 ? 'text-danger' : ''}>
                    {tx.amount.toLocaleString()}
                  </td>
                  <td>{tx.method}</td>
                  <td>{getStatusBadge(tx.status)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default PaymentsSummary;