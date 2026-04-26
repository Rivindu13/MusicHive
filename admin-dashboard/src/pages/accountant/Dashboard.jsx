import React from 'react';
import { Card, Row, Col, Button, Table, Badge } from 'react-bootstrap'; // Added Badge
import { FaDollarSign, FaCheckCircle, FaUndoAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const userName = user?.name || user?.email?.split('@')[0] || 'Accountant';

    const metrics = {
        pendingPayments: { count: 24, amount: 1200000 },
        completedPayments: { count: 458, amount: 18200000 },
        refundPayments: { count: 12, amount: 200000 },
    };

    const recentPayments = [
        { id: 1, event: 'Dilshan Events', txid: 'TXN-2025-0154', status: 'Processed', amount: 75000 },
        { id: 2, event: 'Crystal Music', txid: 'TXN-2025-0155', status: 'Pending', amount: 120000 },
    ];

    const refundRequests = [
        { id: 1, user: 'Roshan Fernando', txid: 'TXN-2025-0154', status: 'Review' },
        { id: 2, user: 'Ayesha Silva', txid: 'TXN-2025-0155', status: 'Review' },
    ];

    const todaySummary = {
        received: 425000,
        processed: 425000,
        pending: 425000,
        refunds: 425000,
    };

    const formatLKR = (amount) => `LKR ${(amount / 1000).toFixed(0)}K`;

    return (
        <div className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1">Welcome Back, {userName}</h2>
                    <p className="text-muted">Manage payments, refunds, and financial transactions</p>
                </div>
            </div>

            {/* Top metrics row */}
            <Row className="g-4 mb-5">
                <Col md={4}>
                    <div className="card h-100">
                        <div className="card-body d-flex flex-column align-items-start">
                            <div className="rounded d-flex align-items-center justify-content-center mb-3" style={{ backgroundColor: '#E0A70A', width: '60px', height: '60px' }}>
                                <FaDollarSign size={32} color="#fff" />
                            </div>
                            <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>{metrics.pendingPayments.count}</h2>
                            <h5 className="card-title text-white-50 mb-0">Pending Payments</h5>
                            <span className="text-muted small">{formatLKR(metrics.pendingPayments.amount)}</span>
                        </div>
                    </div>
                </Col>
                <Col md={4}>
                    <div className="card h-100">
                        <div className="card-body d-flex flex-column align-items-start">
                            <div className="rounded d-flex align-items-center justify-content-center mb-3" style={{ backgroundColor: '#18A8A8', width: '60px', height: '60px' }}>
                                <FaCheckCircle size={32} color="#fff" />
                            </div>
                            <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>{metrics.completedPayments.count}</h2>
                            <h5 className="card-title text-white-50 mb-0">Completed Payments</h5>
                            <span className="text-muted small">{formatLKR(metrics.completedPayments.amount)}</span>
                        </div>
                    </div>
                </Col>
                <Col md={4}>
                    <div className="card h-100">
                        <div className="card-body d-flex flex-column align-items-start">
                            <div className="rounded d-flex align-items-center justify-content-center mb-3" style={{ backgroundColor: '#FF6B6B', width: '60px', height: '60px' }}>
                                <FaUndoAlt size={32} color="#fff" />
                            </div>
                            <h2 className="card-text mb-1 text-white" style={{ fontSize: '2rem' }}>{metrics.refundPayments.count}</h2>
                            <h5 className="card-title text-white-50 mb-0">Refund Payments</h5>
                            <span className="text-muted small">{formatLKR(metrics.refundPayments.amount)}</span>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Two column layout: Recent Pending Payments & Pending Refund Requests */}
            <Row className="g-4 mb-5">
                {/* Recent Pending Payments Card */}
                <Col md={6}>
                    <Card className="h-100 d-flex flex-column">
                        <Card.Header as="h5">Recent Pending Payments</Card.Header>
                        <Card.Body className="p-0 flex-grow-1 d-flex flex-column">
                            <div className="table-responsive">
                                <Table hover className="mb-0" style={{ minWidth: '400px' }}>
                                    <thead>
                                        <tr>
                                            <th>Event</th>
                                            <th>Transaction ID</th>
                                            <th>Status</th>
                                            <th>Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPayments.map(payment => (
                                            <tr key={payment.id} style={{ height: '55px' }}>
                                                <td className="align-middle text-truncate" style={{ maxWidth: '140px' }}>{payment.event}</td>
                                                <td className="align-middle text-nowrap">{payment.txid}</td>
                                                <td className="align-middle"><Badge bg={payment.status === 'Processed' ? 'success' : 'warning'}>{payment.status}</Badge></td>
                                                <td className="align-middle text-nowrap">LKR {payment.amount.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan="4" className="text-center align-middle" style={{ height: '50px' }}>
                                                <Button variant="link" className="text-white p-0">View all payments</Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Pending Refund Requests Card */}
                <Col md={6}>
                    <Card className="h-100 d-flex flex-column">
                        <Card.Header as="h5">Pending Refund Requests</Card.Header>
                        <Card.Body className="p-0 flex-grow-1 d-flex flex-column">
                            <div className="table-responsive">
                                <Table hover className="mb-0" style={{ minWidth: '400px' }}>
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Transaction ID</th>
                                            <th>Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {refundRequests.map(req => (
                                            <tr key={req.id} style={{ height: '55px' }}>
                                                <td className="align-middle text-truncate" style={{ maxWidth: '120px' }}>{req.user}</td>
                                                <td className="align-middle text-nowrap">{req.txid}</td>
                                                <td className="align-middle"><Badge bg="warning">{req.status}</Badge></td>
                                                <td className="align-middle">
                                                    <Button variant="outline-primary" size="sm" className="py-0 px-2" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>Review</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan="4" className="text-center align-middle" style={{ height: '50px' }}>
                                                <Button variant="link" className="text-white p-0">View all Refunds</Button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Today's Financial Summary */}
            <Card>
                <Card.Header as="h5">Today's Financial Summary</Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={3} className="text-center mb-3">
                            <h6 className="text-muted">Payments Received</h6>
                            <h4 className="fw-bold text-success">{formatLKR(todaySummary.received)}</h4>
                        </Col>
                        <Col md={3} className="text-center mb-3">
                            <h6 className="text-muted">Processed</h6>
                            <h4 className="fw-bold text-info">{formatLKR(todaySummary.processed)}</h4>
                        </Col>
                        <Col md={3} className="text-center mb-3">
                            <h6 className="text-muted">Pending</h6>
                            <h4 className="fw-bold text-warning">{formatLKR(todaySummary.pending)}</h4>
                        </Col>
                        <Col md={3} className="text-center mb-3">
                            <h6 className="text-muted">Refunds</h6>
                            <h4 className="fw-bold text-danger">{formatLKR(todaySummary.refunds)}</h4>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
};

export default Dashboard;