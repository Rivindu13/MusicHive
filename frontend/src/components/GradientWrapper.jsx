// src/components/GradientWrapper.jsx
import React from "react";

const GradientWrapper = ({ children, className = "" }) => {
  return (
    <div className={`gradient-wrapper ${className}`}>
      <div className="gradient-wrapper-inner">
        {children}
      </div>
    </div>
  );
};

export default GradientWrapper;
