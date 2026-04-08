import React from "react";
import logo from "../assets/logo.png";
import { useLocation, useNavigate, Link } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
      return;
    }

    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="MusicHive Logo" className="navbar-logo" />
      </div>

      <nav className="navbar-links">
        <button
          type="button"
          className="navbar-linkBtn"
          onClick={() => scrollToSection("home")}
        >
          Home
        </button>

        <button
          type="button"
          className="navbar-linkBtn"
          onClick={() => scrollToSection("about")}
        >
          About
        </button>

        <button
          type="button"
          className="navbar-linkBtn"
          onClick={() => scrollToSection("contact")}
        >
          Contact Us
        </button>

        <Link to="/login">Login</Link>
      </nav>

      <button
        className="btn btn-primary btn-animate btn-cta"
        onClick={() => navigate("/signup")}
        type="button"
      >
        Get Started
      </button>
    </header>
  );
};

export default Navbar;