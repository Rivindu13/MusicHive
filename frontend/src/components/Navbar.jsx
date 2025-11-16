// src/components/Navbar.jsx
import React from "react";
import logo from "../assets/logo.png";


const Navbar = () => {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="MusicHive Logo" className="navbar-logo" />
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
