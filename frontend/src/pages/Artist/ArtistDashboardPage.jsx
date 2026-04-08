import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

import "./styles/ArtistDashboard.css";
import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";

import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function humanDate(ymdStr) {
  try {
    const d = new Date(ymdStr);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return ymdStr;
  }
}

function relativeTime(dateString) {
  if (!dateString) return "";
  const now = new Date();
  const then = new Date(dateString);
  const diff = now - then;

  const mins = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatCurrency(amount) {
  return `LKR ${Number(amount || 0).toLocaleString()}`;
}

function slotTypeLabel(t) {
  return t === "MORNING" ? "Morning" : t === "EVENING" ? "Evening" : t || "";
}

function toDateOnly(dateStr) {
  const d = new Date(dateStr);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isWithinNextTwoDays(dateStr) {
  if (!dateStr) return false;

  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const bookingDay = toDateOnly(dateStr);
  const twoDaysLater = new Date(todayOnly);
  twoDaysLater.setDate(todayOnly.getDate() + 2);

  return bookingDay >= todayOnly && bookingDay <= twoDaysLater;
}

function getBookingTitle(booking) {
  return booking?.note?.trim() || "Booking Request";
}

export default function ArtistDashboard() {
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
    profile?.artistName ||
    "Artist";

  const firstName = fullName.split(" ")[0];
  const artistUid = profile?.uid || profile?.userUid || profile?.id || null;

  const rawArtistPrice = profile?.artistProfile?.pricePerHour ?? null;
  const hasArtistPrice = Number(rawArtistPrice) > 0;

  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthReady(true);

      const stored = localStorage.getItem("profile");
      if (!stored && !user) {
        navigate("/", { replace: true });
      }
    });

    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signOut error:", err);
    } finally {
      localStorage.removeItem("profile");
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  async function getIdTokenOrThrow() {
    let user = auth.currentUser;

    if (!user) {
      user = await new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (u) => {
          unsub();
          resolve(u);
        });
      });
    }

    if (!user) throw new Error("You are not logged in.");

    return await user.getIdToken();
  }

  async function loadArtistBookings() {
    if (!authReady) return;

    setLoading(true);
    setErr("");

    try {
      const uid = artistUid || auth.currentUser?.uid;
      if (!uid) throw new Error("Missing artist uid.");

      const token = await getIdTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/bookings/artist/${uid}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load artist bookings");
      }

      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setItems([]);
      setErr(e.message || "Failed to load artist bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    loadArtistBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  async function acceptBooking(bookingId) {
    try {
      setActionLoadingId(bookingId);
      setErr("");
      setSuccessMsg("");

      const token = await getIdTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/accept`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to accept booking");
      }

      setItems((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "ACCEPTED" } : b
        )
      );

      setSuccessMsg("Booking accepted successfully.");
    } catch (e) {
      setErr(e.message || "Failed to accept booking");
    } finally {
      setActionLoadingId("");
    }
  }

  async function rejectBooking(bookingId) {
    const confirmed = window.confirm(
      "Are you sure you want to decline this booking?"
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(bookingId);
      setErr("");
      setSuccessMsg("");

      const token = await getIdTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to reject booking");
      }

      setItems((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "REJECTED" } : b
        )
      );

      setSuccessMsg("Booking declined successfully.");
    } catch (e) {
      setErr(e.message || "Failed to reject booking");
    } finally {
      setActionLoadingId("");
    }
  }

  const pendingRequests = useMemo(() => {
    return items.filter((b) => b.status === "PENDING").slice(0, 3);
  }, [items]);

  const pendingCount = useMemo(() => {
    return items.filter((b) => b.status === "PENDING").length;
  }, [items]);

  const upcomingBookings = useMemo(() => {
    return items
      .filter(
        (b) =>
          (b.status === "ACCEPTED" || b.status === "CONFIRMED") &&
          isWithinNextTwoDays(b.date)
      )
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [items]);

  if (!authReady) {
    return (
      <div className="artistDash">
        <main className="artistDash__main">
          <div className="artistDash__empty">Loading your session...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="artistDash">
      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <Link
            className="artistDash__navItem artistDash__navItem--active"
            to="/artist/dashboard"
          >
            <span className="artistDash__navIcon">
              <FiHome />
            </span>
            <span>Overview</span>
          </Link>

          <Link className="artistDash__navItem" to="/artist/bookings">
            <span className="artistDash__navIcon">
              <FiCalendar />
            </span>
            <span>Bookings</span>
          </Link>

          <Link className="artistDash__navItem" to="/artist/chords">
            <span className="artistDash__navIcon">
              <FiMusic />
            </span>
            <span>Chord Library</span>
          </Link>

          <Link className="artistDash__navItem" to="/artist/reviews">
            <span className="artistDash__navIcon">
              <FiStar />
            </span>
            <span>Reviews</span>
          </Link>
        </nav>

        <div className="artistDash__sideBottom">
          <Link className="artistDash__sideAction" to="/artist/profile">
            <span className="artistDash__navIcon">
              <FiUser />
            </span>
            <span>Profile</span>
          </Link>

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

      <main className="artistDash__main">
        <div className="artistDash__topbar">
          <button
            className="artistDash__iconBtn"
            aria-label="Notifications"
            type="button"
          >
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

        <section className="artistHero">
          <div className="artistHero__row">
            <h1 className="artistHero__title">
              Welcome Back, <span className="artistHero__name">{firstName}</span>
            </h1>
          </div>

          <p className="artistHero__sub">
            Here&apos;s what&apos;s happening with your music today
          </p>
        </section>

        {!hasArtistPrice && (
          <div className="artistDash__priceAlert">
            <div className="artistDash__priceAlertLeft">
              <span className="artistDash__priceAlertIcon">
                <FiAlertTriangle />
              </span>

              <div className="artistDash__priceAlertText">
                <h3>Set your hourly rate to start receiving paid bookings.</h3>
                <p>
                  Add your pricing in your profile so customer booking payments
                  work correctly.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="artistDash__priceAlertBtn"
              onClick={() => navigate("/artist/profile")}
            >
              Set Price
            </button>
          </div>
        )}

        {err && (
          <div className="artistDash__state artistDash__state--error">
            <FiAlertTriangle /> {err}
          </div>
        )}

        {successMsg && (
          <div className="artistDash__state artistDash__state--success">
            <FiCheckCircle /> {successMsg}
          </div>
        )}

        <section className="artistDash__content">
          <div className="glassCard glassCard--requests">
            <div className="glassCard__header">
              <div className="glassCard__headerLeft">
                <span className="glassCard__headerIcon">
                  <FiBell />
                </span>
                <span className="glassCard__headerTitle">
                  New Booking Requests
                </span>
                <span className="glassCard__badge">{pendingCount}</span>
              </div>

              <Link className="glassCard__viewAll" to="/artist/bookings">
                View all
              </Link>
            </div>

            <div className="glassCard__list">
              {loading ? (
                <div className="artistDash__empty">
                  Loading booking requests...
                </div>
              ) : pendingRequests.length === 0 ? (
                <div className="artistDash__empty">No new booking requests.</div>
              ) : (
                pendingRequests.map((r) => {
                  const customerName = r.customer?.name || "Customer";
                  const customerPhoto = r.customer?.photoURL || "";
                  const subtitle = `${customerName} • ${humanDate(r.date)}${
                    r.slotType ? ` • ${slotTypeLabel(r.slotType)}` : ""
                  }`;

                  return (
                    <div className="requestRow" key={r._id}>
                      <div className="requestRow__left">
                        <div
                          className="requestRow__avatar"
                          style={
                            customerPhoto
                              ? {
                                  backgroundImage: `url(${customerPhoto})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                }
                              : {}
                          }
                        />

                        <div className="requestRow__texts">
                          <div className="requestRow__title">
                            {getBookingTitle(r)}
                          </div>
                          <div className="requestRow__sub">{subtitle}</div>
                        </div>
                      </div>

                      <div className="requestRow__right">
                        <div className="requestRow__priceWrap">
                          <div className="requestRow__price">
                            {formatCurrency(r.price)}
                          </div>
                          <div className="requestRow__time">
                            {relativeTime(r.createdAt)}
                          </div>
                        </div>

                        <div className="requestRow__actions">
                          <button
                            className="btn btn--accept"
                            type="button"
                            onClick={() => acceptBooking(r._id)}
                            disabled={actionLoadingId === r._id}
                          >
                            {actionLoadingId === r._id ? "Working..." : "Accept"}
                          </button>

                          <button
                            className="btn btn--decline"
                            type="button"
                            onClick={() => rejectBooking(r._id)}
                            disabled={actionLoadingId === r._id}
                          >
                            {actionLoadingId === r._id
                              ? "Working..."
                              : "Decline"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="glassCard glassCard--upcoming">
            <div className="glassCard__header">
              <div className="glassCard__headerLeft">
                <span className="glassCard__headerIcon">
                  <FiCalendar />
                </span>
                <span className="glassCard__headerTitle">Upcoming Bookings</span>
              </div>
            </div>

            <div className="glassCard__list">
              {loading ? (
                <div className="artistDash__empty">
                  Loading upcoming bookings...
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="artistDash__empty">
                  No upcoming bookings for the next 2 days.
                </div>
              ) : (
                upcomingBookings.map((b) => {
                  const customerName = b.customer?.name || "Customer";
                  const customerPhoto = b.customer?.photoURL || "";
                  const subtitle = `${customerName} • ${humanDate(b.date)}${
                    b.slotType ? ` • ${slotTypeLabel(b.slotType)}` : ""
                  }`;

                  return (
                    <div className="requestRow" key={b._id}>
                      <div className="requestRow__left">
                        <div
                          className="requestRow__avatar"
                          style={
                            customerPhoto
                              ? {
                                  backgroundImage: `url(${customerPhoto})`,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                }
                              : {}
                          }
                        />

                        <div className="requestRow__texts">
                          <div className="requestRow__title">
                            {getBookingTitle(b)}
                          </div>
                          <div className="requestRow__sub">{subtitle}</div>
                        </div>
                      </div>

                      <div className="requestRow__right">
                        <div className="requestRow__priceWrap">
                          <div className="requestRow__price">
                            {formatCurrency(b.amountPaid || b.price)}
                          </div>
                          <div className="requestRow__time">
                            {b.status === "CONFIRMED" ? "Confirmed" : "Accepted"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <footer className="artistDash__footer">
          <div>© 2025 MusicHive. All rights reserved.</div>
          <div className="artistDash__footerLinks">
            <a href="/">Terms</a>
            <a href="/">Privacy</a>
          </div>
        </footer>
      </main>
    </div>
  );
}