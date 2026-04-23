import React, { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";

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
import CustomerDashboard from "./pages/Customer/CustomerDashboardPage.jsx";
import CustomerBookingArtists from "./pages/Customer/CustomerBookingArtists.jsx";
import CustomerBookingPage from "./pages/Customer/CustomerBookingPage.jsx";
import CustomerMyBookingsPage from "./pages/Customer/MyBookings.jsx";
import CustomerMyChords from "./pages/Customer/CustomerMyChords.jsx";
import CustomerProfile from "./pages/Customer/CustomerProfile.jsx";
import CustomerReviews from "./pages/Customer/CustomerReviews.jsx";
import CustomerWishlist from "./pages/Customer/CustomerWishlist.jsx";

import "./App.css";

function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    if (!sectionId) return;

    const timer = setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      navigate("/", { replace: true, state: {} });
    }, 150);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  return (
    <div className="publicPage">
      <Hero />

      <GradientWrapper className="no-bottom-border">
        <BuiltForEveryone />
        <HowItWorks />
        <Security />
      </GradientWrapper>

      <GradientWrapper>
        <ContactSection />
      </GradientWrapper>
    </div>
  );
}

function App() {
  const location = useLocation();

  const hideLayout =
    location.pathname.startsWith("/signup") ||
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/artist") ||
    location.pathname.startsWith("/customer");

  return (
    <>
      {!hideLayout && <Navbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/artist/dashboard" element={<ArtistDashboard />} />
        <Route path="/artist/chords" element={<MyChords />} />
        <Route path="/artist/reviews" element={<ArtistReviews />} />
        <Route path="/artist/profile" element={<ArtistProfile />} />
        <Route path="/artist/bookings" element={<ArtistBookings />} />
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="/customer/book-artists" element={<CustomerBookingArtists />} />
        <Route path="/customer/booking" element={<CustomerBookingPage />} />
        <Route path="/customer/my-bookings" element={<CustomerMyBookingsPage />} />
        <Route path="/customer/chords" element={<CustomerMyChords />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/reviews" element={<CustomerReviews />} />
        <Route path="/customer/wishlist" element={<CustomerWishlist />} />
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

export default App;