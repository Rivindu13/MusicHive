// src/components/ContactSection.jsx
import React from "react";
import Reveal from "../../components/Reveal";
import { useNavigate } from "react-router-dom";

const ContactSection = () => {
  const navigate = useNavigate();
  return (
    <section className="contact" id="contact">
    <Reveal>
      <div className="contact-inner">
        <div className="contact-form">
          <h2>Contact us.</h2>
          <form>
            <label>
              Name
              <input type="text" placeholder="Your name" />
            </label>
            <label>
              Email
              <input type="email" placeholder="Your email" />
            </label>
            <label>
              Address
              <textarea placeholder="Your address" rows={4} />
            </label>
            {/* For now we won't actually submit anywhere (no backend) */}
          </form>
        </div>

        <div className="contact-cta rainbow-box">
          <h2>Ready to Make <br /> Music Magic? </h2>
          <p>Join MusicHive Today</p>
          <button className="btn btn-gradient btn-animate" onClick={() => navigate("/signup")}>
            Get Started Now
          </button>
        </div>
      </div>
    </Reveal>
    </section>
  );
};

export default ContactSection;
