import React, { useState } from "react";
import "../../App.css";
import Reveal from "../../components/Reveal";

import logo from "../../assets/logo.png";
import { FiMail, FiLock, FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [emailError, setEmailError] = useState("");

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  const navigate = useNavigate();

  // Toast trigger function
  const triggerToast = (message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError("Email is required");
      return false;
    } else if (!emailRegex.test(value)) {
      setEmailError("Enter a valid email address");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const handleLogin = async () => {
    if (!validateEmail(email)) return;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pw);
      const user = userCredential.user;

      const res = await fetch(`http://localhost:5000/api/users/${user.uid}`);
      const profile = await res.json();

      if (!profile || !profile.role) {
        triggerToast("User profile incomplete. Please sign up again.", "error");
        return;
      }

      triggerToast("Login successful! Redirecting...", "success");
      localStorage.setItem("profile", JSON.stringify(profile));

      setTimeout(() => {
        if (profile.role === "artist" || profile.role === "band") {
          navigate("/artist/dashboard", { state: { profile } });
        } else if (profile.role === "organizer") {
          navigate("/customer/dashboard");
        } else if (profile.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          triggerToast("Unknown role. Please contact support.", "warning");
        }
      }, 1000);
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        triggerToast("Incorrect password. Try again.", "error");
      } else if (err.code === "auth/user-not-found") {
        triggerToast("Email not found. Please sign up.", "error");
      } else {
        triggerToast(err.message, "error");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const res = await fetch(`http://localhost:5000/api/users/${user.uid}`);
      const profile = await res.json();

      if (!profile || !profile.uid) {
        triggerToast("This Google account is not registered. Please sign up first.", "warning");
        return;
      }

      triggerToast("Login successful! Redirecting...", "success");
      localStorage.setItem("profile", JSON.stringify(profile));

      setTimeout(() => {
        if (profile.role === "artist") {
          navigate("/artist/dashboard", { state: { profile } });
        } else if (profile.role === "customer") {
          navigate("/customer/dashboard", { state: { profile } });
        } else if (profile.role === "admin") {
          navigate("/admin/dashboard", { state: { profile } });
        } else {
          triggerToast("Unknown role. Please contact support.", "warning");
        }
      }, 1000);
    } catch (err) {
      triggerToast(err.message, "error");
    }
  };

  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const targetEmail = forgotEmail.trim();

    if (!targetEmail) {
      setForgotEmailError("Email is required");
      return;
    }
    if (!emailRegex.test(targetEmail)) {
      setForgotEmailError("Enter a valid email address");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setEmail(targetEmail);
      setShowForgotModal(false);
      triggerToast("Password reset email sent. Please check your inbox.", "success");
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        triggerToast("No MusicHive account found for that email.", "error");
      } else if (err.code === "auth/invalid-email") {
        setForgotEmailError("Enter a valid email address");
      } else {
        triggerToast("Unable to send reset email. Please try again.", "error");
      }
    }
  };

  return (
    <div className="login-page">
      {/* Dynamic Toast Container */}
      <div className="toast-portal-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="toast-icon-wrapper">
              {toast.type === "success" && <FiCheckCircle className="toast-icon" />}
              {toast.type === "error" && <FiAlertCircle className="toast-icon" />}
              {toast.type === "warning" && <FiAlertCircle className="toast-icon" />}
              {toast.type === "info" && <FiInfo className="toast-icon" />}
            </div>
            <div className="toast-message-content">{toast.message}</div>
            <button className="toast-dismiss-btn" onClick={() => removeToast(toast.id)}>
              <FiX />
            </button>
            <div
              className="toast-expiry-bar"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Forgot Password Modal (replacing window.prompt) */}
      {showForgotModal && (
        <div className="forgot-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="forgot-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Reset Password</h3>
            <p>Enter the email address linked to your MusicHive account:</p>
            <form onSubmit={handlePasswordResetSubmit}>
              <div className="login-input-wrapper">
                <input
                  type="email"
                  placeholder="Email"
                  value={forgotEmail}
                  onChange={(e) => {
                    setForgotEmail(e.target.value);
                    setForgotEmailError("");
                  }}
                  autoFocus
                />
                <FiMail className="input-icon" />
              </div>
              {forgotEmailError && <p className="input-error">{forgotEmailError}</p>}
              <div className="forgot-modal-actions">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="login-btn modal-submit-btn">
                  Send Reset Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logo */}
      <Reveal>
        <div className="login-logo">
          <img src={logo} alt="MusicHive Logo" />
        </div>
      </Reveal>

      {/* GLASS LOG-IN CARD */}
      <Reveal>
        <div className="login-card-wrapper">
          <div className="login-card"></div>
          <div className="login-card2">
            <h2>
              Welcome Back to <br /> MusicHive
            </h2>
            <p className="login-sub">
              Login to continue your musical journey
            </p>

            {/* Email */}
            <div className="login-input-wrapper">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
              />
              <FiMail className="input-icon" />
            </div>
            {emailError && <p className="input-error">{emailError}</p>}

            {/* Password */}
            <div className="login-input-wrapper">
              <input
                type="password"
                placeholder="Password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <FiLock className="input-icon" />
            </div>

            {/* Remember + forgot */}
            <div className="login-row">
              <label className="remember">
                <input type="checkbox" /> Remember me
              </label>
              <button
                type="button"
                className="forgot"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotEmailError("");
                  setShowForgotModal(true);
                }}
              >
                Forgot password?
              </button>
            </div>

            <button className="login-btn" onClick={handleLogin}>
              Login
            </button>

            <div className="login-divider">or continue with</div>

            <div className="login-social">
              <button className="google-login-btn" onClick={handleGoogleLogin}>
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="google-icon"
                />
                Continue with Google
              </button>
            </div>

            <div className="login-bottom-text">
              New to MusicHive? <a href="/signup">Sign up instead</a>
            </div>

            <a href="/" className="login-back">
              ← Back to Home
            </a>
          </div>
        </div>
      </Reveal>
    </div>
  );
};

export default Login;