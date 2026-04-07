import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

import "../Artist/styles/ArtistDashboard.css";
import "./Styles/CustomerDashboard.css";

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

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function formatCurrency(amount) {
  const value = Number(amount || 0);
  return `LKR ${value.toLocaleString()}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "No date";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;

  if (Number.isNaN(then.getTime())) return "";

  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function getEventTitle(booking) {
  return booking?.note?.trim() || "Artist Booking";
}

function getBookingSubtitle(booking) {
  const artistName = booking?.artist?.name || "Unknown Artist";
  const slot = booking?.slotType ? booking.slotType.charAt(0) + booking.slotType.slice(1).toLowerCase() : "";
  return `${artistName} • ${formatDate(booking?.date)}${slot ? ` • ${slot}` : ""}`;
}

function pillClass(status) {
  if (status === "CONFIRMED") return "custStatusPill custStatusPill--confirmed";
  if (status === "PENDING") return "custStatusPill custStatusPill--pending";
  if (status === "ACCEPTED") return "custStatusPill custStatusPill--accepted";
  if (status === "CANCELLED") return "custStatusPill custStatusPill--cancelled";
  if (status === "REJECTED") return "custStatusPill custStatusPill--cancelled";
  if (status === "EXPIRED") return "custStatusPill custStatusPill--expired";
  return "custStatusPill";
}

function readableStatus(status) {
  switch (status) {
    case "CONFIRMED":
      return "Confirmed";
    case "PENDING":
      return "Pending";
    case "ACCEPTED":
      return "Accepted";
    case "CANCELLED":
      return "Cancelled";
    case "REJECTED":
      return "Rejected";
    case "EXPIRED":
      return "Expired";
    default:
      return status || "Unknown";
  }
}

export default function CustomerDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const profile =
    location.state?.profile ||
    JSON.parse(localStorage.getItem("profile")) ||
    null;

  const [bookings, setBookings] = useState([]);
  const [savedChords, setSavedChords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [cancelMessage, setCancelMessage] = useState("");

  const profilePic = profile?.photoURL || null;
  const fullName =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    profile?.customerName ||
    "Name_Surname";

  const uid = profile?.uid;

  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!cancelMessage) return;

    const timer = setTimeout(() => {
      setCancelMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [cancelMessage]);

  const getAuthHeaders = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You are not logged in");
    }

    const token = await currentUser.getIdToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const loadDashboardData = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      setPageError("Customer profile not found");
      return;
    }

    try {
      setLoading(true);
      setPageError("");

      const headers = await getAuthHeaders();

      const [bookingsRes, chordsRes] = await Promise.all([
        fetch(`${API_BASE}/api/bookings/customer/${uid}`, {
          method: "GET",
          headers,
        }),
        fetch(`${API_BASE}/api/chords/customer/${uid}`, {
          method: "GET",
          headers,
        }),
      ]);

      const bookingsJson = await bookingsRes.json();
      const chordsJson = await chordsRes.json();

      if (!bookingsRes.ok) {
        throw new Error(bookingsJson.message || "Failed to fetch bookings");
      }

      if (!chordsRes.ok) {
        throw new Error(chordsJson.message || "Failed to fetch chords");
      }

      const bookingsData = Array.isArray(bookingsJson.data) ? bookingsJson.data : [];
      const chordsData = Array.isArray(chordsJson) // if your controller returns raw array
        ? chordsJson
        : Array.isArray(chordsJson.data)
        ? chordsJson.data
        : [];

      setBookings(bookingsData);
      setSavedChords(chordsData);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setPageError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [uid, getAuthHeaders]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirmed) return;

    try {
      setActionLoadingId(bookingId);

      const headers = await getAuthHeaders();

      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "Failed to cancel booking");
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: "CANCELLED" }
            : booking
        )
      );

      setCancelMessage("Booking cancelled successfully");
    } catch (err) {
      console.error("Cancel booking error:", err);
      alert(err.message || "Failed to cancel booking");
    } finally {
      setActionLoadingId("");
    }
  };

  const stats = useMemo(() => {
    const totalBookings = bookings.length;

    const upcomingEvents = bookings.filter((b) =>
      ["ACCEPTED", "CONFIRMED"].includes(b.status)
    ).length;

    const totalSpent = bookings
      .filter((b) => b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + Number(b.amountPaid || b.price || 0), 0);

    const chordsCount = savedChords.length;

    return [
      { id: "totalBookings", label: "Total Bookings", value: totalBookings },
      { id: "upcomingEvents", label: "Upcoming Events", value: upcomingEvents },
      { id: "totalSpent", label: "Total spent", value: formatCurrency(totalSpent) },
      { id: "savedChords", label: "Saved chords", value: chordsCount },
    ];
  }, [bookings, savedChords]);

  const recentBookings = useMemo(() => {
    return bookings.slice(0, 3);
  }, [bookings]);

  return (
    <div className="artistDash customerDashPage">
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

          <Link className="artistDash__navItem" to="/customer/my-bookings">
            <span className="artistDash__navIcon"><FiCalendar /></span>
            <span>My Bookings</span>
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

      <main className="artistDash__main">
        <div className="artistDash__topbar">
          <button className="artistDash__iconBtn" aria-label="Notifications" type="button">
            <FiBell />
          </button>

          <button className="artistDash__iconBtn" aria-label="Wishlist" type="button">
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

        <section className="custHero">
          <div className="custHero__row">
            <h1 className="custHero__title">Welcome Back{fullName ? `, ${fullName}` : ""}</h1>
            <div className="custHero__line" />
          </div>
          <p className="custHero__sub">Here&apos;s what&apos;s happening with your music today</p>
        </section>

        {cancelMessage ? (
          <div className="custAlert custAlert--success">{cancelMessage}</div>
        ) : null}

        {pageError ? (
          <div className="custAlert custAlert--error">{pageError}</div>
        ) : null}

        <section className="custStats">
          {stats.map((s) => (
            <div className="custStatCard" key={s.id}>
              <span className="custStatCard__icon"><FiCalendar /></span>
              <span className="custStatCard__label">{s.label}</span>
              <span className="custStatCard__value">
                {loading ? "..." : s.value}
              </span>
            </div>
          ))}
        </section>

        <section className="custBookingsCard">
          <div className="custBookingsCard__header">
            <div className="custBookingsCard__titleWrap">
              <span className="custBookingsCard__icon"><FiBell /></span>
              <span className="custBookingsCard__title">My Bookings</span>
            </div>

            <Link className="custBookingsCard__viewAll" to="/customer/my-bookings">
              View all
            </Link>
          </div>

          <div className="custBookingsCard__list">
            {loading ? (
              <div className="custEmptyState">Loading dashboard...</div>
            ) : recentBookings.length === 0 ? (
              <div className="custEmptyState">No bookings found yet.</div>
            ) : (
              recentBookings.map((b) => {
                const canCancel = ["PENDING", "ACCEPTED", "CONFIRMED"].includes(b.status);

                return (
                  <div className="custBookingRow" key={b._id}>
                    <div className="custBookingRow__left">
                      <div
                        className="custBookingRow__avatar"
                        style={
                          b.artist?.photoURL
                            ? {
                                backgroundImage: `url(${b.artist.photoURL})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                              }
                            : {}
                        }
                      />
                      <div className="custBookingRow__texts">
                        <div className="custBookingRow__title">{getEventTitle(b)}</div>
                        <div className="custBookingRow__sub">{getBookingSubtitle(b)}</div>
                      </div>
                    </div>

                    <div className="custBookingRow__right">
                      <div className="custBookingRow__priceWrap">
                        <div className="custBookingRow__price">
                          {formatCurrency(b.amountPaid || b.price || 0)}
                        </div>
                        <div className="custBookingRow__time">
                          {formatRelativeTime(b.createdAt)}
                        </div>
                      </div>

                      <div className="custBookingRow__actions">
                        <span className={pillClass(b.status)}>
                          {readableStatus(b.status)}
                        </span>

                        <button
                          type="button"
                          className="custCancelBtn"
                          onClick={() => handleCancelBooking(b._id)}
                          disabled={!canCancel || actionLoadingId === b._id}
                        >
                          {actionLoadingId === b._id ? "Cancelling..." : "Cancel"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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