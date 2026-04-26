import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'admin'; // fallback
  const panelTitle = userRole === 'admin' ? 'Admin Panel' : 'Manager Panel';
  const displayName = user?.name || user?.email?.split('@')[0] || userRole || 'User';

  return (
    <header className="header d-flex justify-content-between align-items-center">
      <h5 className="mb-0">{panelTitle}</h5>
      <div className="d-flex align-items-center">
        {/* Optional notification icon – can be added later */}
        <div className="me-3">
          <i className="bi bi-bell" style={{ fontSize: '1.5rem', color: '#fff' }}></i>
        </div>
        <div className="d-flex align-items-center">
          <div className="rounded-circle bg-secondary me-2" style={{ width: '40px', height: '40px', backgroundColor: '#D9D9D9' }}></div>
          <span className="text-white">{displayName}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;