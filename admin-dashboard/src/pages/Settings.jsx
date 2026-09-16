import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Database,
  Server,
  UserCog,
  Palette,
  Lock,
} from "lucide-react";
import { getAdminProfile } from "../services/adminApi";

const Settings = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAdminProfile = async () => {
    try {
      setLoading(true);
      const data = await getAdminProfile();
      setAdmin(data);
    } catch (error) {
      console.error("Admin profile error:", error.message);

      const savedAdmin = localStorage.getItem("adminUser");
      if (savedAdmin) {
        setAdmin(JSON.parse(savedAdmin));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminProfile();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="admin-page-title">Settings</h1>
        <p className="admin-page-subtitle">
          Manage admin profile, system information, security, and dashboard
          appearance.
        </p>
      </div>

      <div className="settings-grid">
        <div className="admin-card settings-profile-card">
          <div className="settings-icon">
            <UserCog size={26} />
          </div>

          <h2>Admin Profile</h2>

          {loading ? (
            <p className="muted-text">Loading admin profile...</p>
          ) : (
            <div className="settings-info-list">
              <div>
                <span>Name</span>
                <strong>{admin?.name || "MusicHive Admin"}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{admin?.email || "admin@musichive.com"}</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>{admin?.role || "admin"}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong className="settings-active">Active</strong>
              </div>
            </div>
          )}
        </div>

        <div className="admin-card settings-card">
          <div className="settings-card-header">
            <div className="settings-icon small">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2>Security</h2>
              <p>Admin routes are protected using JWT authentication.</p>
            </div>
          </div>

          <div className="settings-badge-row">
            <span className="settings-badge">JWT Enabled</span>
            <span className="settings-badge">Protected Routes</span>
          </div>
        </div>

        <div className="admin-card settings-card">
          <div className="settings-card-header">
            <div className="settings-icon small">
              <Database size={22} />
            </div>
            <div>
              <h2>Database</h2>
              <p>Connected to MusicHive MongoDB Atlas database.</p>
            </div>
          </div>

          <div className="settings-info-list compact">
            <div>
              <span>Database</span>
              <strong>musichive</strong>
            </div>
            <div>
              <span>Collections</span>
              <strong>Users, Bookings, Chords, Reviews</strong>
            </div>
          </div>
        </div>

        <div className="admin-card settings-card">
          <div className="settings-card-header">
            <div className="settings-icon small">
              <Server size={22} />
            </div>
            <div>
              <h2>Backend API</h2>
              <p>Admin dashboard is connected to backend API services.</p>
            </div>
          </div>

          <div className="settings-info-list compact">
            <div>
              <span>Base URL</span>
              <strong>http://localhost:5000/api</strong>
            </div>
            <div>
              <span>Status</span>
              <strong className="settings-active">Running</strong>
            </div>
          </div>
        </div>

        <div className="admin-card settings-card">
          <div className="settings-card-header">
            <div className="settings-icon small">
              <Palette size={22} />
            </div>
            <div>
              <h2>Theme</h2>
              <p>
                Use the Dark/Light button in the top bar. Your preference is
                saved on this device.
              </p>
            </div>
          </div>

          <div className="theme-preview">
            <div className="theme-dot purple"></div>
            <div className="theme-dot blue"></div>
            <div className="theme-dot green"></div>
            <div className="theme-dot dark"></div>
          </div>
        </div>

        <div className="admin-card settings-card">
          <div className="settings-card-header">
            <div className="settings-icon small">
              <Lock size={22} />
            </div>
            <div>
              <h2>Admin Access</h2>
              <p>Admin accounts are created securely using backend seed utility.</p>
            </div>
          </div>

          <div className="settings-badge-row">
            <span className="settings-badge">No Public Signup</span>
            <span className="settings-badge">Encrypted Password</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;