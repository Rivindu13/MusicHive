import { useState, useMemo } from 'react';

// Mock reported content
const mockContent = [
  {
    id: 1,
    type: 'song_code',
    title: 'Wonderwall Chords',
    uploader: 'OasisFan',
    reports: 3,
    status: 'pending',
    createdAt: '2025-03-20',
  },
  {
    id: 2,
    type: 'song_code',
    title: 'Shape of You',
    uploader: 'EdSheeranTribute',
    reports: 1,
    status: 'approved',
    createdAt: '2025-03-18',
  },
  {
    id: 3,
    type: 'profile',
    title: 'User Profile: john_doe',
    uploader: 'john_doe',
    reports: 2,
    status: 'pending',
    createdAt: '2025-03-22',
  },
  {
    id: 4,
    type: 'song_code',
    title: 'Bohemian Rhapsody',
    uploader: 'QueenFan',
    reports: 0,
    status: 'approved',
    createdAt: '2025-03-15',
  },
  {
    id: 5,
    type: 'profile',
    title: 'Band Profile: The Rockers',
    uploader: 'rockers_band',
    reports: 5,
    status: 'pending',
    createdAt: '2025-03-23',
  },
];

const Content = () => {
  const [content, setContent] = useState(mockContent);
  const [filter, setFilter] = useState('all'); // all, pending, approved
  const [typeFilter, setTypeFilter] = useState('all'); // all, song_code, profile

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const matchesStatus = filter === 'all' || item.status === filter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      return matchesStatus && matchesType;
    });
  }, [content, filter, typeFilter]);

  const handleApprove = (id) => {
    setContent(content.map(item =>
      item.id === id ? { ...item, status: 'approved' } : item
    ));
  };

  const handleReject = (id) => {
    if (window.confirm('Reject this content? It will be removed from the platform.')) {
      setContent(content.filter(item => item.id !== id));
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'approved') return <span className="badge bg-success">Approved</span>;
    if (status === 'pending') return <span className="badge bg-warning text-dark">Pending</span>;
    return <span className="badge bg-secondary">{status}</span>;
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2>Content Moderation</h2>
          <p className="text-muted">Review and manage all platform content</p>
        </div>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-3">
          <select
            className="form-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="song_code">Song Codes</option>
            <option value="profile">Profiles</option>
          </select>
        </div>
      </div>

      {/* Card wrapper for the table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Uploader</th>
                  <th>Reports</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => (
                  <tr key={item.id}>
                    <td>{item.type === 'song_code' ? 'Song Code' : 'Profile'}</td>
                    <td>{item.title}</td>
                    <td>{item.uploader}</td>
                    <td>
                      <span className={item.reports > 2 ? 'text-danger fw-bold' : 'text-muted'}>
                        {item.reports}
                      </span>
                    </td>
                    <td>{item.createdAt}</td>
                    <td>{getStatusBadge(item.status)}</td>
                    <td>
                      {item.status === 'pending' && (
                        <>
                          <button className="btn btn-sm btn-success me-2" onClick={() => handleApprove(item.id)}>
                            Approve
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleReject(item.id)}>
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === 'approved' && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleReject(item.id)}>
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredContent.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center">No content found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;