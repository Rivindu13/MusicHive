import React, { useState } from "react";
import "../../App.css";
import Reveal from "../../components/Reveal";
import logo from "../../assets/logo.png";

import artistImg from "../../assets/signup/artist.png";
import bandImg from "../../assets/signup/band.png";
import organizerImg from "../../assets/signup/organizer.png";

const Signup = () => {
  const [selected, setSelected] = useState(null);

  const roles = [
    {
      id: "artist",
      title: "Artists",
      subtitle: "Solo Performer, Vocalist or instrumentalist",
      img: artistImg,
      border: "#ff4fd8"
    },
    {
      id: "band",
      title: "Band",
      subtitle: "Music Group",
      img: bandImg,
      border: "#4970ff"
    },
    {
      id: "organizer",
      title: "Event Organizers",
      subtitle: "Planning events and Booking talents",
      img: organizerImg,
      border: "#52ffb8"
    }
  ];

  return (
    <div className="signup-page">

      {/* LOGO */}
      <Reveal>
        <div className="signup-logo">
          <img src={logo} alt="MusicHive Logo" />
        </div>
      </Reveal>

      {/* SIGNUP CARD */}
      <Reveal className="signup-card">
        <h2>Let's Get You Started</h2>
        <p className="signup-sub">Tell us who you are.</p>

        <div className="signup-role-grid">
          {roles.map((r) => (
            <div
              key={r.id}
              className={`signup-role-card ${selected === r.id ? "active" : ""}`}
              onClick={() => setSelected(r.id)}
              style={{ borderColor: r.border }}
            >
              <img src={r.img} alt={r.title} />
              <h3>{r.title}</h3>
              <p>{r.subtitle}</p>
            </div>
          ))}
        </div>

        {/* NEXT BUTTON */}
        <button className="signup-next-btn">Next</button> <br />

        {/* BACK LINK */}
        <a href="/" className="signup-back">← Back to Home</a>
      </Reveal>
    </div>
  );
};

export default Signup;
