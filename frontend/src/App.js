import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import BuiltForEveryone from "./components/BuiltForEveryone";
import HowItWorks from "./components/HowItWorks";
import Security from "./components/Security";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";
import GradientWrapper from "./components/GradientWrapper"; // <-- ADD THIS
import "./App.css";

function App() {
  return (
    <>
      <Navbar />
      <Hero />

      {/* === RAINBOW FRAME #1 === */}
      <GradientWrapper className="no-bottom-border">
        <BuiltForEveryone />
        <HowItWorks />
        <Security />
      </GradientWrapper>

      {/* === RAINBOW FRAME #2 === */}
      <GradientWrapper>
        <ContactSection />
      </GradientWrapper>

      <Footer />
    </>
  );
}

export default App;
