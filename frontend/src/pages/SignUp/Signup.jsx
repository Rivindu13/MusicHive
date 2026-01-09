// Signup.jsx (FULL FILE — only additions, nothing removed)
import React, { useState } from "react";
import "../../App.css";
import Reveal from "../../components/Reveal";
import logo from "../../assets/logo.png";

import artistImg from "../../assets/signup/artist.png";
import bandImg from "../../assets/signup/band.png";
import organizerImg from "../../assets/signup/organizer.png";

import { FiMail, FiLock, FiUser } from "react-icons/fi";
import { auth } from "../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { signInWithPopup } from "firebase/auth";
import { googleProvider } from "../../firebase";
import { FaGoogle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);

  // ✅ NEW: solo/band selection for artists
  const [artistType, setArtistType] = useState(null); // "solo" | "band"

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const roles = [
    {
      id: "artist",
      title: "Artists",
      subtitle: "Solo Performer, Vocalist or instrumentalist",
      img: artistImg,
      border: "#ff4fd8",
    },
    {
      id: "organizer",
      title: "Event Organizers",
      subtitle: "Planning events and Booking talents",
      img: organizerImg,
      border: "#52ffb8",
    },
  ];

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

  // ✅ NEW: final role mapping (band should become role)
  const getFinalRole = () => {
    if (selected === "artist") {
      return artistType === "band" ? "band" : "artist";
    }
    return selected;
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      alert("Please fill all fields");
      return;
    }
    if (!validateEmail(email)) return;

    // ✅ NEW: require solo/band if artist selected
    if (selected === "artist" && !artistType) {
      alert("Please select whether you are a solo artist or a band");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // ✅ NEW: compute role BEFORE saving
      const finalRole = getFinalRole();

      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: finalRole,
          name,
          photoURL: user.photoURL || null,
        }),
      });

      const saved = await res.json().catch(() => null);

      if (!res.ok) {
        console.log("Mongo save failed:", saved);
        alert(saved?.message || "Could not save user profile to database");
        return;
      }

      alert("Signup successful!");
      navigate("/login");
    } catch (err) {
      console.log(err);

      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Redirecting to login...");

        // Redirect after 1.5s delay
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        alert(err.message);
      }
    }
  };

  const handleGoogleSignup = async () => {
    if (!selected) {
      alert("Please select your role first.");
      return;
    }

    // ✅ NEW: require solo/band if artist selected
    if (selected === "artist" && !artistType) {
      alert("Please select whether you are a solo artist or a band");
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 1️⃣ Check if user already exists in MongoDB
      const checkRes = await fetch(
        `http://localhost:5000/api/users/${user.uid}`
      );
      const existingUser = await checkRes.json();

      if (existingUser && existingUser.uid) {
        // Already exists → redirect to login
        alert(
          "This Google account is already registered. Redirecting to login…"
        );
        setTimeout(() => {
          navigate("/login");
        }, 1500);
        return;
      }

      // ✅ NEW: compute role BEFORE saving
      const finalRole = getFinalRole();

      const googleName =
        user.displayName ||
        name || // (if you allow typing name anyway)
        (user.email ? user.email.split("@")[0] : "");

      // 2️⃣ If NOT existing → create new MongoDB user
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: finalRole,
          name: googleName,
          photoURL: user.photoURL || null,
        }),
      });

      const saved = await res.json().catch(() => null);

      if (!res.ok) {
        console.log("Mongo save failed:", saved);
        alert(saved?.message || "Could not save user profile to database");
        return;
      }

      alert("Signup successful!");
      navigate("/login");
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  return (
    <div className="signup-page">
      {/* LOGO */}
      <Reveal>
        <div className="signup-logo">
          <img src={logo} alt="MusicHive Logo" />
        </div>
      </Reveal>

      {/* ================================
          STEP 1 — ROLE SELECTION 
      ================================= */}
      {step === 1 && (
        <Reveal className="signup-card">
          <h2>Let's Get You Started</h2>
          <p className="signup-sub">Tell us who you are.</p>

          <div className="signup-role-grid">
            {roles.map((r) => (
              <div
                key={r.id}
                className={`signup-role-card ${
                  selected === r.id ? "active" : ""
                }`}
                onClick={() => {
                  setSelected(r.id);
                  // ✅ NEW: reset artistType if they switch roles
                  if (r.id !== "artist") setArtistType(null);
                }}
                style={{ borderColor: r.border }}
              >
                <img src={r.img} alt={r.title} />
                <h3>{r.title}</h3>
                <p>{r.subtitle}</p>
              </div>
            ))}
          </div>

          <button
            className="signup-next-btn"
            disabled={!selected}
            onClick={() => setStep(2)}
          >
            Next
          </button>{" "}
          <br />

          <a href="/" className="signup-back">
            ← Back to Home
          </a>
        </Reveal>
      )}

      {/* ================================
          STEP 2 — USER DETAILS FORM
          (same layout as login page)
      ================================= */}
      {step === 2 && (
        <Reveal>
          <div className="login-card-wrapper">
            <div className="login-card"></div>
            <div className="login-card2">
              <h2>Create Your Account</h2>
              <p className="login-sub">Almost there! Fill your details.</p>

              {/* ✅ NEW: Solo artist vs Band (ONLY if role is artist) */}
              {selected === "artist" && (
                <div className="artist-type-block">
                  <p className="artist-type-title">Artist type</p>

                  <div
                    className="artist-type-radioRow"
                    role="radiogroup"
                    aria-label="Artist type"
                  >
                    <button
                      type="button"
                      className={`artist-type-radio ${
                        artistType === "solo" ? "active" : ""
                      }`}
                      onClick={() => setArtistType("solo")}
                      aria-pressed={artistType === "solo"}
                    >
                      <span className="artist-type-dot" />
                      <span className="artist-type-label">Solo Artist</span>
                    </button>

                    <button
                      type="button"
                      className={`artist-type-radio ${
                        artistType === "band" ? "active" : ""
                      }`}
                      onClick={() => setArtistType("band")}
                      aria-pressed={artistType === "band"}
                    >
                      <span className="artist-type-dot" />
                      <span className="artist-type-label">Band</span>
                    </button>
                  </div>

                  <div className="artist-type-hint">
                    {artistType === "solo"
                      ? "Individual performer or vocalist."
                      : artistType === "band"
                      ? "Group or ensemble."
                      : "Select one to continue."}
                  </div>
                </div>
              )}

              {/* Name */}
              <div className="login-input-wrapper">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <FiUser className="input-icon" />
              </div>

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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FiLock className="input-icon" />
              </div>

              <button className="login-btn" onClick={handleSignup}>
                Sign Up
              </button>

              <div className="login-divider">or continue with</div>

              <div className="login-social">
                <button className="google-login-btn" onClick={handleGoogleSignup}>
                  <img
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="Google"
                    className="google-icon"
                  />
                  Continue with Google
                </button>
              </div>

              <a
                className="login-back"
                onClick={() => setStep(1)}
                style={{ cursor: "pointer" }}
              >
                ← Back
              </a>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
};

export default Signup;
