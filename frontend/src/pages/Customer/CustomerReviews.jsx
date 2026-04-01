import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Styles/CustomerReviews.css";

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

function Stars({ value = 0 }) {
  const full = Math.round(value);

  return (
    <div className="revStars">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`revStar ${i < full ? "revStar--filled" : "revStar--empty"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function OrganizerReviews() {
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
    profile?.organizationName ||
    "Organizer";

  const organizerUid = profile?.uid;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ avgRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase logout error:", err);
    } finally {
      localStorage.removeItem("profile");
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        if (!organizerUid) {
          setSummary({ avgRating: 0, totalReviews: 0 });
          setReviews([]);
          return;
        }

        const res = await fetch(
          `http://localhost:5000/api/reviews/user/${organizerUid}?role=CUSTOMER`
        );

        const data = await res.json();

        setSummary(data.summary || { avgRating: 0, totalReviews: 0 });
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (err) {
        console.error("Failed to load organizer reviews:", err);
        setSummary({ avgRating: 0, totalReviews: 0 });
        setReviews([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [organizerUid]);

  return (
    <div className="artistDash organizerReviewsPage">
      {/* Sidebar */}
      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <a className="artistDash__navItem" href="/organizer/dashboard">
            <span className="artistDash__navIcon">
              <FiHome />
            </span>
            <span>Overview</span>
          </a>

          <a className="artistDash__navItem" href="/organizer/bookings">
            <span className="artistDash__navIcon">
              <FiCalendar />
            </span>
            <span>Bookings</span>
          </a>

          <a className="artistDash__navItem" href="/organizer/chords">
            <span className="artistDash__navIcon">
              <FiMusic />
            </span>
            <span>My Chords</span>
          </a>

          <a
            className="artistDash__navItem artistDash__navItem--active"
            href="/organizer/reviews"
          >
            <span className="artistDash__navIcon">
              <FiStar />
            </span>
            <span>Reviews</span>
          </a>
        </nav>

        <div className="artistDash__sideBottom">
          <a className="artistDash__sideAction" href="/organizer/profile">
            <span className="artistDash__navIcon">
              <FiUser />
            </span>
            <span>Profile</span>
          </a>

          <button
            type="button"
            className="artistDash__sideAction"
            onClick={handleLogout}
          >
            <span className="artistDash__navIcon">
              <FiLogOut />
            </span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="artistDash__main">
        <div className="artistDash__topbar">
          <button className="artistDash__iconBtn" aria-label="Notifications">
            <FiBell />
          </button>

          <div className="artistDash__user">
            <div className="artistDash__avatarWrap">
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
            <span className="artistDash__userName">{fullName}</span>
          </div>
        </div>

        {/* Header */}
        <section className="reviewsHeroCard">
          <div className="reviewsHeroCard__left">
            <h1 className="reviewsHeroCard__title">Organizer Reviews</h1>
            <p className="reviewsHeroCard__sub">
              See what artists are saying about working with you
            </p>
          </div>

          <div className="reviewsHeroCard__right">
            <div className="reviewsHeroCard__score">
              {Number(summary.avgRating || 0).toFixed(1)}
            </div>

            <div className="reviewsHeroCard__meta">
              <Stars value={summary.avgRating || 0} />
              <div className="reviewsHeroCard__count">
                From {summary.totalReviews || 0} reviews
              </div>
            </div>
          </div>
        </section>

        {/* Reviews list */}
        <section className="reviewsStack">
          {loading && (
            <div className="reviewsEmptyState">Loading reviews...</div>
          )}

          {!loading && reviews.length === 0 && (
            <div className="reviewsEmptyState">
              No reviews yet. When artists review you after events, they’ll show up here.
            </div>
          )}

          {!loading &&
            reviews.map((r) => (
              <div className="reviewRowCard" key={r._id}>
                <div className="reviewRowCard__left">
                  <div
                    className="reviewRowCard__avatar"
                    style={
                      r.reviewerPhotoURL
                        ? {
                            backgroundImage: `url(${r.reviewerPhotoURL})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : {}
                    }
                  />

                  <div className="reviewRowCard__body">
                    <div className="reviewRowCard__name">
                      {r.reviewerName || "Artist"}
                    </div>

                    <div className="reviewRowCard__line2">
                      <Stars value={r.rating || 0} />
                      <span className="reviewRowCard__event">
                        • {r.eventType || "Event"}
                      </span>
                    </div>

                    <div className="reviewRowCard__text">{r.comment || "—"}</div>
                  </div>
                </div>

                <div className="reviewRowCard__date">
                  {formatDate(r.createdAt)}
                </div>
              </div>
            ))}
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