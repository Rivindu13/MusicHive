import React from "react";
import Reveal from "../../components/Reveal";

const HowItWorks = () => {
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
    <section className="how">
      <Reveal>
        <h2>How It Works</h2>
        <p className="how-sub">
          Get started with MusicHive in three simple steps.
        </p>
      </Reveal>

      <div className="how-cards">
        <Reveal
          className="how-card"
          delay={0}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <div className="how-icon">👤</div>
          <h3>Create Your Profile</h3>
          <p>
            Sign up and build your professional music profile with photos,
            videos, and audio samples.
          </p>
        </Reveal>

        <Reveal
          className="how-card"
          delay={120}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <div className="how-icon">🔗</div>
          <h3>Connect &amp; Book</h3>
          <p>
            Discover opportunities, connect with organizers, and secure bookings
            for events.
          </p>
        </Reveal>

        <Reveal
          className="how-card"
          delay={240}
          onMouseMove={handleCardMove}
          onMouseLeave={handleCardLeave}
        >
          <div className="how-icon">📷</div>
          <h3>Perform &amp; Get Paid</h3>
          <p>
            Deliver amazing performances and receive secure payments through our
            platform.
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default HowItWorks;