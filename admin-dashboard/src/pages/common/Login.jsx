import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [role, setRole] = useState('admin');
  const { login } = useAuth();

  const handleLogin = () => {
    login(role);
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h3 className="text-center">MusicHive Login</h3>
              <select className="form-select mb-3" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
              <button className="btn btn-primary w-100" onClick={handleLogin}>
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;