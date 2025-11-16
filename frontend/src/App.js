import React from "react";
import Navbar from "./components/Navbar";
import Hero from "./pages/Home/Hero";
import BuiltForEveryone from "./pages/Home/BuiltForEveryone";
import HowItWorks from "./pages/Home/HowItWorks";
import Security from "./pages/Home/Security";
import ContactSection from "./pages/Home/ContactSection";
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
