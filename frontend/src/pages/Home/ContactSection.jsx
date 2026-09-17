import React, { useState } from "react";
import Reveal from "../../components/Reveal";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";

const ContactSection = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    email: "",
    message: "",
  });

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  const triggerToast = (message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: "",
      email: "",
      message: "",
    };

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      valid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      valid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
      valid = false;
    }

    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
      valid = false;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear the error for the current field while typing
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await emailjs.send(
        "service_w09se2o",
        "template_mmztzzc",
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
        },
        "Y5XL7B74-K3IIuVvg"
      );

      // Replaced alert() with success toast
      triggerToast("Message sent successfully!", "success");

      setFormData({
        name: "",
        email: "",
        message: "",
      });

      setErrors({
        name: "",
        email: "",
        message: "",
      });
    } catch (err) {
      // Replaced alert() with error toast
      triggerToast("Failed to send message. Please try again.", "error");
    }
  };

  return (
    <section className="contact" id="contact">
      {/* Toast Notification Container */}
      <div className="toast-portal-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="toast-icon-wrapper">
              {toast.type === "success" && <FiCheckCircle className="toast-icon" />}
              {toast.type === "error" && <FiAlertCircle className="toast-icon" />}
              {toast.type === "warning" && <FiAlertCircle className="toast-icon" />}
              {toast.type === "info" && <FiInfo className="toast-icon" />}
            </div>
            <div className="toast-message-content">{toast.message}</div>
            <button
              className="toast-dismiss-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <FiX />
            </button>
            <div
              className="toast-expiry-bar"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        ))}
      </div>

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
                />
                {errors.name && (
                  <p className="input-error">{errors.name}</p>
                )}
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  placeholder="Your email"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="input-error">{errors.email}</p>
                )}
              </label>

              <label>
                Message
                <textarea
                  name="message"
                  placeholder="Your message"
                  rows={4}
                  value={formData.message}
                  onChange={handleChange}
                />
                {errors.message && (
                  <p className="input-error">{errors.message}</p>
                )}
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