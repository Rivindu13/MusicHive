import React, { useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

import "../Artist/styles/ArtistDashboard.css"; // ✅ reuse base layout (sidebar/topbar/footer)
import "./Styles/CustomerDashboard.css";      // ✅ only customer content styling

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiHeart,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

export default function CustomerDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const profile =
    location.state?.profile ||
    JSON.parse(localStorage.getItem("profile")) ||
    null;

  const profilePic = profile?.photoURL || null;
  const fullName =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    profile?.customerName ||
    "Name_Surname";

  // ✅ Route guard
  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) navigate("/", { replace: true });
  }, [navigate]);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase logout error:", err);
    } finally {
      localStorage.removeItem("profile");
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  // ✅ Dummy cards (replace later with real API values)
  const stats = [
    { id: "totalBookings", label: "Total Bookings", value: "12" },
    { id: "upcomingEvents", label: "Upcoming Events", value: "3" },
    { id: "totalSpent", label: "Total spent", value: "LKR 180,000" },
    { id: "savedChords", label: "Saved chords", value: "8" },
  ];

  // ✅ Dummy bookings list (replace later with real bookings)
  const myBookings = [
    {
      id: "b1",
      title: "Birthday Party",
      sub: "X Mass • Dec 18, 2025",
      price: "LKR 45,000",
      status: "CONFIRMED",
      time: "2h ago",
    },
    {
      id: "b2",
      title: "Wedding",
      sub: "Saman De Silva • Dec 18, 2025",
      price: "LKR 45,000",
      status: "PENDING",
      time: "2h ago",
    },
    {
      id: "b3",
      title: "Birthday Party",
      sub: "Pathum Perera • Dec 18, 2025",
      price: "LKR 45,000",
      status: "CONFIRMED",
      time: "2h ago",
    },
  ];

  const pillClass = (s) => {
    if (s === "CONFIRMED") return "custStatusPill custStatusPill--confirmed";
    if (s === "PENDING") return "custStatusPill custStatusPill--pending";
    return "custStatusPill";
  };

  return (
    <div className="artistDash customerDashPage">
      {/* Sidebar */}
      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <Link className="artistDash__navItem artistDash__navItem--active" to="/customer/dashboard">
            <span className="artistDash__navIcon"><FiHome /></span>
            <span>Overview</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/book-artists">
            <span className="artistDash__navIcon"><FiCalendar /></span>
            <span>Booking Artists</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/chords">
            <span className="artistDash__navIcon"><FiMusic /></span>
            <span>My Chords</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/reviews">
            <span className="artistDash__navIcon"><FiStar /></span>
            <span>Reviews</span>
          </Link>
        </nav>

        <div className="artistDash__sideBottom">
          <Link className="artistDash__sideAction" to="/customer/profile">
            <span className="artistDash__navIcon"><FiUser /></span>
            <span>Profile</span>
          </Link>

          <button type="button" className="artistDash__sideAction" onClick={handleLogout}>
            <span className="artistDash__navIcon"><FiLogOut /></span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="artistDash__main">
        {/* Top bar */}
        <div className="artistDash__topbar">
          <button className="artistDash__iconBtn" aria-label="Notifications">
            <FiBell />
          </button>

          <button className="artistDash__iconBtn" aria-label="Wishlist">
            <FiHeart />
          </button>

          <div className="artistDash__user">
            <div className="artistDash__avatarWrap">
              <div
                className="artistDash__avatar"
                style={profilePic ? { backgroundImage: `url(${profilePic})` } : {}}
              />
              <span className="artistDash__onlineDot" />
            </div>
            <span className="artistDash__userName">{fullName}</span>
          </div>
        </div>

        {/* Header (match your style from screenshot) */}
        <section className="custHero">
          <div className="custHero__row">
            <h1 className="custHero__title">Welcome Back</h1>
            <div className="custHero__line" />
          </div>
          <p className="custHero__sub">Here&apos;s what&apos;s happening with your music today</p>
        </section>

        {/* Stats */}
        <section className="custStats">
          {stats.map((s) => (
            <div className="custStatCard" key={s.id}>
              <span className="custStatCard__icon"><FiCalendar /></span>
              <span className="custStatCard__label">{s.label}</span>
              <span className="custStatCard__value">{s.value}</span>
            </div>
          ))}
        </section>

        {/* My Bookings */}
        <section className="custBookingsCard">
          <div className="custBookingsCard__header">
            <div className="custBookingsCard__titleWrap">
              <span className="custBookingsCard__icon"><FiBell /></span>
              <span className="custBookingsCard__title">My Bookings</span>
            </div>

            <Link className="custBookingsCard__viewAll" to="/customer/bookings">
              View all
            </Link>
          </div>

          <div className="custBookingsCard__list">
            {myBookings.map((b) => (
              <div className="custBookingRow" key={b.id}>
                <div className="custBookingRow__left">
                  <div className="custBookingRow__avatar" />
                  <div className="custBookingRow__texts">
                    <div className="custBookingRow__title">{b.title}</div>
                    <div className="custBookingRow__sub">{b.sub}</div>
                  </div>
                </div>

                <div className="custBookingRow__right">
                  <div className="custBookingRow__priceWrap">
                    <div className="custBookingRow__price">{b.price}</div>
                    <div className="custBookingRow__time">{b.time}</div>
                  </div>

                  <div className="custBookingRow__actions">
                    <span className={pillClass(b.status)}>
                      {b.status === "CONFIRMED" ? "Confirmed" : "Pending"}
                    </span>

                    <button type="button" className="custCancelBtn">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="artistDash__footer">
          <div>© 2025 MusicHive. All rights reserved.</div>
          <div className="artistDash__footerLinks">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </footer>
      </main>
    </div>
  );
}