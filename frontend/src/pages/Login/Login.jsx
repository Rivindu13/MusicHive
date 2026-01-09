import React, { useState } from "react";
import "../../App.css";
import Reveal from "../../components/Reveal";

import logo from "../../assets/logo.png";
import { FiMail, FiLock } from "react-icons/fi";
import { FaGoogle, FaSpotify, FaFacebook } from "react-icons/fa";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { useNavigate } from "react-router-dom";


const Login = () => {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();

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
      alert("User profile incomplete. Please sign up again.");
      return;
    }

    alert("Login successful!");

    localStorage.setItem("profile", JSON.stringify(profile));

    if (profile.role === "artist" || profile.role === "band") {
      navigate("/artist/dashboard", { state: { profile } });
    } else if (profile.role === "customer") {
      navigate("/customer/dashboard");
    } else if (profile.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      alert("Unknown role. Please contact support.");
    }

  } catch (err) {
    if (err.code === "auth/wrong-password") {
      alert("Incorrect password. Try again.");
    } else if (err.code === "auth/user-not-found") {
      alert("Email not found. Please sign up.");
    } else {
      alert(err.message);
    }
  }
};


  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // ✅ Fetch user profile from MongoDB (includes photoURL)
      const res = await fetch(`http://localhost:5000/api/users/${user.uid}`);
      const profile = await res.json();

      if (!profile || !profile.uid) {
        alert("This Google account is not registered. Please sign up first.");
        return;
      }

      alert("Login successful!");

      // ✅ Save for refresh safety
      localStorage.setItem("profile", JSON.stringify(profile));

      // ✅ Navigate based on role
      if (profile.role === "artist") {
        navigate("/artist/dashboard", { state: { profile } });
      } else if (profile.role === "customer") {
        navigate("/customer/dashboard", { state: { profile } });
      } else if (profile.role === "admin") {
        navigate("/admin/dashboard", { state: { profile } });
      } else {
        alert("Unknown role. Please contact support.");
      }
    } catch (err) {
      alert(err.message);
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
            <a href="#" className="forgot">
              Forgot password?
            </a>
          </div>

          <button className="login-btn" onClick={handleLogin}>Login</button>

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

          <a href="/" className="login-back">← Back to Home</a>
        
        </div>
        </div>
      </Reveal>
    </div>
  );
};

export default Login;
