import React, { useState } from "react";
import "../../App.css";
import Reveal from "../../components/Reveal";

import logo from "../../assets/logo.png";
import { FiMail, FiLock } from "react-icons/fi";
import { FaGoogle, FaSpotify, FaFacebook } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [emailError, setEmailError] = useState("");

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

  return (
    <div className="login-page">

      {/* Logo */}
      <Reveal>
        <div className="login-logo">
          <img src={logo} alt="MusicHive Logo" />
        </div>
      </Reveal>

      {/* GLASS LOG-IN CARD */}
      <Reveal>
        <div className="login-card">
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
            <a href="#" className="forgot">
              Forgot password?
            </a>
          </div>

          <button className="login-btn" onClick={() => validateEmail(email)}>Login</button>

          <div className="login-divider">or continue with</div>

          <div className="login-social">
            <FaGoogle className="social google" />
            <FaSpotify className="social spotify" />
            <FaFacebook className="social facebook" />
          </div>

          <div className="login-bottom-text">
            New to MusicHive? <a href="/signup">Sign up instead</a>
          </div>

          <a href="/" className="login-back">← Back to Home</a>
        </div>
      </Reveal>
    </div>
  );
};

export default Login;
