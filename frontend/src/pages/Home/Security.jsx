// src/components/Security.jsx
import React from "react";
import Reveal from "../../components/Reveal";

const Security = () => {
  const handleCardMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  };

  const handleCardLeave = (e) => {
    e.currentTarget.style.removeProperty("--mouse-x");
    e.currentTarget.style.removeProperty("--mouse-y");
  };

  return (
    <section className="security">
      {/* title block */}
      <Reveal>
        <h2>Secure &amp; Reliable</h2>
        <p className="security-sub">
          Built with industry-leading security and reliability features.
        </p>
      </Reveal>

      {/* cards – staggered like How It Works */}
      <div className="security-grid">
        <Reveal
          className="security-card"
          delay={0}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <h4>Secure Payments</h4>
          <p>Bank-level encryption for all transactions.</p>
        </Reveal>

        <Reveal
          className="security-card"
          delay={80}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <h4>Verified Profiles</h4>
          <p>All artists undergo verification process.</p>
        </Reveal>

        <Reveal
          className="security-card"
          delay={160}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <h4>24/7 Support</h4>
          <p>Round-the-clock customer assistance.</p>
        </Reveal>

        <Reveal
          className="security-card"
          delay={240}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <h4>Fair Pricing</h4>
          <p>Transparent rates with no hidden fees.</p>
        </Reveal>

        <Reveal
          className="security-card"
          delay={320}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <h4>Quality Assured</h4>
          <p>Only the best talent on our platform.</p>
        </Reveal>

        <Reveal
          className="security-card"
          delay={400}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <h4>Live Updates</h4>
          <p>Real-time notifications and booking status.</p>
        </Reveal>
      </div>
    </section>
  );
};

export default Security;
