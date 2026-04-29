import React, { useState } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const RefundRequests = () => {
  const [search, setSearch] = useState('');

  const requests = [
    { id: 1, txid: 'TXN-2025-0101', user: 'Roshan Fernando', event: 'Wedding Gig', amount: 35000, reason: 'Cancelled by artist', requestDate: '2025-04-10', status: 'Pending' },
    { id: 2, txid: 'TXN-2025-0102', user: 'Ayesha Silva', event: 'Corporate Event', amount: 50000, reason: 'Duplicate charge', requestDate: '2025-04-11', status: 'Approved' },
    { id: 3, txid: 'TXN-2025-0103', user: 'Nuwan Perera', event: 'Concert', amount: 120000, reason: 'Customer request', requestDate: '2025-04-12', status: 'Review' },
  ];

  const filtered = requests.filter(r => 
    r.txid.toLowerCase().includes(search.toLowerCase()) ||
    r.user.toLowerCase().includes(search.toLowerCase()) ||
    r.event.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const map = { Pending: 'warning', Approved: 'success', Rejected: 'danger', Review: 'info' };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Refund Requests</h2>
          <p className="text-muted">Review and process refund requests</p>
        </div>
      </div>

      <Card>
        <Card.Body>
          <InputGroup className="mb-4">
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by transaction ID, user, or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>

          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>Amount LKR</th>
                  <th>Reason</th>
                  <th>Request Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>{r.txid}</td>
                    <td>{r.user}</td>
                    <td>{r.event}</td>
                    <td>{r.amount.toLocaleString()}</td>
                    <td>{r.reason}</td>
                    <td>{r.requestDate}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td><Button size="sm" variant="outline-primary">Review</Button></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default RefundRequests;