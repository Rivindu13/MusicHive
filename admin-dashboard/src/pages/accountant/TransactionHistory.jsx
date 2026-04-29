import React, { useState } from 'react';
import { Card, Table, Badge, Form, InputGroup } from 'react-bootstrap';
import { FaSearch } from 'react-icons/fa';

const TransactionHistory = () => {
  const [search, setSearch] = useState('');

  const transactions = [
    { id: 1, txid: 'TXN-2025-1001', user: 'John Doe', type: 'Payment', amount: 25000, datetime: '2025-04-15 10:30', method: 'Card', status: 'Completed' },
    { id: 2, txid: 'TXN-2025-1002', user: 'Jane Smith', type: 'Refund', amount: -5000, datetime: '2025-04-15 11:45', method: 'Bank Transfer', status: 'Processed' },
    { id: 3, txid: 'TXN-2025-1003', user: 'MusicHive', type: 'Platform Fee', amount: 1500, datetime: '2025-04-15 14:20', method: 'Card', status: 'Completed' },
  ];

  const filtered = transactions.filter(t =>
    t.txid.toLowerCase().includes(search.toLowerCase()) ||
    t.user.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const map = { Completed: 'success', Processed: 'info', Pending: 'warning', Failed: 'danger' };
    return <Badge bg={map[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Transaction History</h2>
          <p className="text-muted">Complete record of all financial transactions</p>
        </div>
      </div>

      <Card>
        <Card.Body>
          <InputGroup className="mb-4">
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search by transaction ID or user..."
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
                  <th>Type</th>
                  <th>Amount LKR</th>
                  <th>Date & Time</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id}>
                    <td>{t.txid}</td>
                    <td>{t.user}</td>
                    <td>{t.type}</td>
                    <td className={t.amount < 0 ? 'text-danger' : ''}>{t.amount.toLocaleString()}</td>
                    <td>{t.datetime}</td>
                    <td>{t.method}</td>
                    <td>{getStatusBadge(t.status)}</td>
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

export default TransactionHistory;