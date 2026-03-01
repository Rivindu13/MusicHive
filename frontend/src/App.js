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
import ArtistDashboard from "./pages/Artist/ArtistDashboardPage.jsx";
import MyChords from "./pages/Artist/MyChords";
import ArtistReviews from "./pages/Artist/ArtistReviews";
import ArtistProfile from "./pages/Artist/ArtistProfile.jsx";
import ArtistBookings from "./pages/Artist/ArtistBookings.jsx";


import "./App.css";


function App() {
  const location = useLocation();

  // hide header/footer on signup page
  const hideLayout =
  location.pathname.startsWith("/signup") ||
  location.pathname.startsWith("/login") ||
  location.pathname.startsWith("/artist");

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
        <Route path="/artist/dashboard" element={<ArtistDashboard />} />
        <Route path="/artist/chords" element={<MyChords />} />
        <Route path="/artist/reviews" element={<ArtistReviews />} />
        <Route path="/artist/profile" element={<ArtistProfile />} />
        <Route path="/artist/bookings" element={<ArtistBookings />} />

      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

export default App;
