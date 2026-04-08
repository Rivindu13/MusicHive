import React, { useState } from "react";
import Reveal from "../../components/Reveal";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ContactSection = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/contact", formData);
      alert("Message sent successfully!");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      alert("Failed to send message");
    }
  };

  return (
    <section className="contact" id="contact">
      <Reveal>
        <div className="contact-inner">
          <div className="contact-form">
            <h2>Contact us.</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Message
                <textarea
                  name="message"
                  placeholder="Your message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </label>

              <button className="btn btn-gradient" type="submit">
                Send Message
              </button>
            </form>
          </div>

          <div className="contact-cta rainbow-box">
            <h2>
              Ready to Make <br /> Music Magic?
            </h2>
            <p>Join MusicHive Today</p>
            <button
              className="btn btn-gradient btn-animate"
              onClick={() => navigate("/signup")}
              type="button"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default ContactSection;