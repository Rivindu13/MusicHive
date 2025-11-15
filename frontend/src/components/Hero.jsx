// Hero.jsx
import React from "react";
import heroImage from "../assets/hero-bg.png";
import Reveal from "./Reveal";

const Hero = () => {
  return (
    <section
      id="home"
      className="hero"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="hero-overlay">
        <Reveal className="hero-content">
          <div className="hero-pill">
            ✨ Sri Lanka's Premier Music Platform
          </div>

          <h1 className="hero-title">Connect. Perform. Thrive.</h1>

          <p className="hero-subtitle">
            Join the ultimate platform connecting Sri Lanka&apos;s finest
            musicians, bands, and event organizers. Create your profile,
            discover opportunities, and take your music career to the next
            level.
          </p>

          <div className="hero-buttons">
            <button className="btn btn-gradient btn-animate btn-cta">
              Start Your Journey
            </button>
            <button className="btn btn-outline btn-animate">
              Browse Artists
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default Hero;
