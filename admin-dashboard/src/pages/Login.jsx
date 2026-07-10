import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiEye, FiEyeOff } from "react-icons/fi";
import { adminLogin } from "../services/adminApi";

const FRONTEND_LOGIN_URL = "http://localhost:3000/login";

const Login = () => {
  const [email, setEmail] = useState("admin@musichive.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!value) return "Admin email is required.";
    if (!emailRegex.test(value)) return "Enter a valid admin email address.";

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);

    if (emailError) {
      setError(emailError);
      return;
    }

    if (!password) {
      setError("Admin password is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await adminLogin(email, password);

      localStorage.setItem("adminToken", response.token);
      localStorage.setItem("adminUser", JSON.stringify(response.admin));
      localStorage.setItem("rememberAdmin", rememberMe ? "true" : "false");

      if (response.admin.role === "manager") {
        navigate("/bookings");
      } else if (response.admin.role === "accountant") {
        navigate("/payments");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Invalid admin email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-brand">
        <img src="/musichive-logo.png" alt="MusicHive Logo" />
      </div>

      <div className="admin-login-card">
        <div className="admin-login-glow"></div>

        <div className="admin-login-inner">
          <h1>
            Welcome Back to <br /> MusicHive Admin
          </h1>

          <p className="admin-login-subtitle">
            Login to manage users, artists, bookings, chords, and reviews.
          </p>

          {error && <div className="admin-login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="admin-login-input-group">
              <input
                type="email"
                placeholder="Admin Email"
                value={email}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
              />
              <FiMail className="admin-login-icon" />
            </div>

            <div className="admin-login-input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Admin Password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="admin-login-row">
              <label>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>

              <span>Secure admin access</span>
            </div>

            <button className="admin-login-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="admin-login-divider">
            <span></span>
            <p>MusicHive administration portal</p>
            <span></span>
          </div>

          <a href={FRONTEND_LOGIN_URL} className="admin-login-back">
            ← Back to Main Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;