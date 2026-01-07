import React from "react";
import { useLocation } from "react-router-dom";

import "./ArtistDashboard.css";
import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
} from "react-icons/fi";

export default function ArtistDashboard() {
  const location = useLocation();
  const profile =
    location.state?.profile || JSON.parse(localStorage.getItem("profile")) || null;

  const profilePic = profile?.photoURL || null;



  // ✅ Safely pick a name from whatever your backend returns
  const fullName =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    profile?.artistName ||
    "Artist";

  const firstName = fullName.split(" ")[0];

  const requests = [
    {
      id: 1,
      title: "Birthday Party",
      subtitle: "Niluka Events • Dec 18, 2025",
      price: "LKR 45,000",
      time: "2h ago",
    },
    {
      id: 2,
      title: "Birthday Party",
      subtitle: "Niluka Events • Dec 18, 2025",
      price: "LKR 45,000",
      time: "2h ago",
    },
    {
      id: 3,
      title: "Birthday Party",
      subtitle: "Niluka Events • Dec 18, 2025",
      price: "LKR 45,000",
      time: "2h ago",
    },
  ];

  return (
    <div className="artistDash">
      {/* Sidebar */}
      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <a className="artistDash__navItem artistDash__navItem--active" href="#">
            <span className="artistDash__navIcon">
              <FiHome />
            </span>
            <span>Overview</span>
          </a>

          <a className="artistDash__navItem" href="#">
            <span className="artistDash__navIcon">
              <FiCalendar />
            </span>
            <span>Bookings</span>
          </a>

          <a className="artistDash__navItem" href="/artist/chords">
            <span className="artistDash__navIcon">
              <FiMusic />
            </span>
            <span>My Chords</span>
          </a>

          <a className="artistDash__navItem" href="#">
            <span className="artistDash__navIcon">
              <FiStar />
            </span>
            <span>Reviews</span>
          </a>
        </nav>

        <div className="artistDash__sideBottom">
          <a className="artistDash__sideAction" href="#">
            <span className="artistDash__navIcon">
              <FiUser />
            </span>
            <span>Profile</span>
          </a>

          <a className="artistDash__sideAction" href="#">
            <span className="artistDash__navIcon">
              <FiLogOut />
            </span>
            <span>Log out</span>
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="artistDash__main">
        {/* Top bar */}
        <div className="artistDash__topbar">
          <button className="artistDash__iconBtn" aria-label="Notifications">
            <FiBell />
          </button>

          <div className="artistDash__user">
            <div className="artistDash__avatarWrap">
              {/* ✅ Profile image if available, else default circle */}
              <div
                className="artistDash__avatar"
                style={
                  profilePic
                    ? {
                        backgroundImage: `url(${profilePic})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : {}
                }
              />
              <span className="artistDash__onlineDot" />
            </div>

            {/* ✅ Name from logged-in artist */}
            <span className="artistDash__userName">{fullName}</span>
          </div>
        </div>

        {/* Welcome */}
        <section className="artistDash__welcome">
          {/* ✅ Personalized welcome text */}
          <div className="artistDash__welcomeRow">
            <h1 className="artistDash__title">
              Welcome Back,{" "}
              <span style={{ fontWeight: 800 }}>{firstName}</span>
            </h1>
            <div className="artistDash__titleLine" />
          </div>
          <p className="artistDash__subtitle">
            Here's what's happening with your music today
          </p>


        </section>

        {/* Cards */}
        <section className="artistDash__content">
          {/* New Booking Requests */}
          <div className="glassCard glassCard--requests">
            <div className="glassCard__header">
              <div className="glassCard__headerLeft">
                <span className="glassCard__headerIcon">
                  <FiBell />
                </span>
                <span className="glassCard__headerTitle">
                  New Booking Requests
                </span>
                <span className="glassCard__badge">3</span>
              </div>

              <a className="glassCard__viewAll" href="#">
                View all
              </a>
            </div>

            <div className="glassCard__list">
              {requests.map((r) => (
                <div className="requestRow" key={r.id}>
                  <div className="requestRow__left">
                    <div className="requestRow__avatar" />
                    <div className="requestRow__texts">
                      <div className="requestRow__title">{r.title}</div>
                      <div className="requestRow__sub">{r.subtitle}</div>
                    </div>
                  </div>

                  <div className="requestRow__right">
                    <div className="requestRow__priceWrap">
                      <div className="requestRow__price">{r.price}</div>
                      <div className="requestRow__time">{r.time}</div>
                    </div>

                    <div className="requestRow__actions">
                      <button className="btn btn--accept">Accept</button>
                      <button className="btn btn--decline">Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="glassCard glassCard--upcoming">
            <div className="glassCard__header">
              <div className="glassCard__headerLeft">
                <span className="glassCard__headerIcon">
                  <FiCalendar />
                </span>
                <span className="glassCard__headerTitle">Upcoming Bookings</span>
              </div>
            </div>

            <div className="upcomingBody" />
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
