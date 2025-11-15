import React from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import BuiltForEveryone from "./components/BuiltForEveryone";
import HowItWorks from "./components/HowItWorks";
import Security from "./components/Security";
import ContactSection from "./components/ContactSection";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="app">
      <Navbar />
      <Hero />
      <BuiltForEveryone />
      <HowItWorks />
      <Security />
      <ContactSection />
      <Footer />
    </div>
  );
}

export default App;
