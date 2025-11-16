import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./pages/Home/Hero";
import BuiltForEveryone from "./pages/Home/BuiltForEveryone";
import HowItWorks from "./pages/Home/HowItWorks";
import Security from "./pages/Home/Security";
import ContactSection from "./pages/Home/ContactSection";
import GradientWrapper from "./components/GradientWrapper";
import Footer from "./components/Footer";
import Signup from "./pages/SignUp/Signup";
import Login from "./pages/Login/Login";


import "./App.css";

function App() {
  const location = useLocation();

  // hide header/footer on signup page
  const hideLayout =
  location.pathname.startsWith("/signup") ||
  location.pathname.startsWith("/login");


  return (
    <>
      {!hideLayout && <Navbar />}

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero />

              <GradientWrapper className="no-bottom-border">
                <BuiltForEveryone />
                <HowItWorks />
                <Security />
              </GradientWrapper>

              <GradientWrapper>
                <ContactSection />
              </GradientWrapper>
            </>
          }
        />

        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

export default App;
