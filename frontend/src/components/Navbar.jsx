// src/components/Navbar.jsx
import React from "react";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";


const Navbar = () => {
  const navigate = useNavigate();
  return (
    <header className="navbar">
      <div className="navbar-left">
        <img src={logo} alt="MusicHive Logo" className="navbar-logo" />
      </div>


      <nav className="navbar-links">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#contact">Contact Us</a>
        <Link to="/login">Login</Link>
      </nav>

      <button className="btn btn-primary btn-animate btn-cta" onClick={() => navigate("/signup")}>Get Started</button>
    </header>
  );
};

export default Navbar;
