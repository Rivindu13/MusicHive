// src/components/Footer.jsx
import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">
            🎵 <span>MusicHive</span>
          </div>
          <p>
            Connecting Sri Lanka&apos;s music talent with opportunities since
            2025.
          </p>
        </div>

        <div className="footer-cols">
          <div>
            <h4>Platform</h4>
            <a href="#">Find Artists</a>
            <a href="#">Pricing</a>
            <a href="#">About</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="#">Support</a>
            <a href="#">Help Center</a>
            <a href="#">Safety</a>
          </div>
          <div>
            <h4>Contact</h4>
            <p>hello@musichive.lk</p>
            <p>+94 11 234 5678</p>
            <p>Colombo, Sri Lanka</p>
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
