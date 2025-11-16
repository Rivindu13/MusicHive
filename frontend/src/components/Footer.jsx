import React from "react";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { FaFacebook, FaInstagram, FaTwitter } from "react-icons/fa";
import logo from "../assets/logo.png";


const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        
        {/* LEFT BRAND SECTION */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img src={logo} alt="MusicHive Logo" className="footer-logo-img" />
          </div>
          <p>
            Connecting Sri Lanka&apos;s music talent with opportunities since 2025.
          </p>
        </div>

        {/* PLATFORM LINKS */}
        <div className="footer-col">
          <h4>Platform</h4>
          <a href="#">Find Artists</a>
          <a href="#">Pricing</a>
          <a href="#">About</a>
        </div>

        {/* SUPPORT LINKS */}
        <div className="footer-col">
          <h4>Support</h4>
          <a href="#">Support</a>
          <a href="#">Help Center</a>
          <a href="#">Safety</a>
        </div>

        {/* CONTACT SECTION */}
        <div className="footer-col contact-col">
          <h4>Contact</h4>

          <div className="footer-contact-item">
            <FiMail /> <span>hello@musichive.lk</span>
          </div>

          <div className="footer-contact-item">
            <FiPhone /> <span>+94 11 234 5678</span>
          </div>

          <div className="footer-contact-item">
            <FiMapPin /> <span>Colombo, Sri Lanka</span>
          </div>

          {/* SOCIAL ICONS */}
          <div className="footer-social">
            <FaFacebook />
            <FaInstagram />
            <FaTwitter />
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2025 MusicHive. All rights reserved.</span>

        <div className="footer-bottom-links">
          <a href="#">Terms</a>
          <a href="#">Privacy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
