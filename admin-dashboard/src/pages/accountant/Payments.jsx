import React, { useState } from 'react';
import { Card, Button, Form, Table, Badge, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const Payments = () => {
  const [search, setSearch] = useState('');

  const payments = [
    { id: 1, txid: 'TXN-2025-0001', user: 'John Doe', event: 'Summer Fest', amount: 125000, date: '2025-04-01', status: 'Completed' },
    { id: 2, txid: 'TXN-2025-0002', user: 'Jane Smith', event: 'Jazz Night', amount: 75000, date: '2025-04-02', status: 'Pending' },
    { id: 3, txid: 'TXN-2025-0003', user: 'Mike Lee', event: 'Rock Concert', amount: 200000, date: '2025-04-03', status: 'Processing' },
  ];

  const filtered = payments.filter(p => 
    p.txid.toLowerCase().includes(search.toLowerCase()) ||
    p.user.toLowerCase().includes(search.toLowerCase()) ||
    p.event.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const map = { Completed: 'success', Pending: 'warning', Processing: 'info', Refunded: 'danger' };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="mb-1">Payment Management</h2>
          <p className="text-muted">Process and manage all platform payments</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-light">Filter</Button>
          <Button variant="primary">Export</Button>
        </div>
      </div>

      <Card>
        <Card.Body>
          <InputGroup className="mb-4">
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by transaction id, user or artist..."
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
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>{p.txid}</td>
                    <td>{p.user}</td>
                    <td>{p.event}</td>
                    <td>{p.amount.toLocaleString()}</td>
                    <td>{p.date}</td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td><Button size="sm" variant="outline-primary">View</Button></td>
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

export default Payments;