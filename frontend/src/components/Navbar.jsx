// src/components/Navbar.jsx
import React from "react";

const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <span className="logo-icon">🎵</span>
        <span className="logo-text">MusicHive</span>
      </div>

      <nav className="navbar-links">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#contact">Contact Us</a>
        <a href="#login">Login</a>
      </nav>

      <button className="btn btn-primary btn-animate btn-cta">Get Started</button>
    </header>
  );
};

export default Navbar;
