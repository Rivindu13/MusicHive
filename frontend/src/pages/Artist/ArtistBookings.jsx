import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./styles/ArtistBookings.css";
import { authFetch } from "../../utils/authFetch";

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

const API_BASE = "http://localhost:5000";

function ymd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateObj, days) {
  const d = new Date(dateObj);
  d.setDate(d.getDate() + days);
  return d;
}

function humanDate(ymdStr) {
  try {
    const d = new Date(ymdStr);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  } catch {
    return ymdStr;
  }
}

function slotLabel(slotType) {
  return slotType === "MORNING" ? "Morning" : "Evening";
}

function statusLabel(status) {
  if (status === "OPEN") return "Open";
  if (status === "DISABLED") return "Disabled";
  if (status === "BOOKED") return "Booked";
  if (status === "HELD") return "Held";
  return status || "Open";
}

export default function ArtistBookings() {
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

  const artistUid = profile?.uid;

  const [activeTab, setActiveTab] = useState("AVAILABILITY");
  const [ensuring, setEnsuring] = useState(false);

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slots, setSlots] = useState([]);

  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requests, setRequests] = useState([]);

  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [upcoming, setUpcoming] = useState([]);

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
      navigate("/", { replace: true });
    }
  };

  const range = useMemo(() => {
    const from = ymd(addDays(new Date(), 1));
    const to = ymd(addDays(new Date(), 30));
    return { from, to };
  }, []);

  const groupedByDate = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, { MORNING: null, EVENING: null });
      map.get(s.date)[s.slotType] = s;
    }
    const dates = Array.from(map.keys()).sort();
    return dates.map((d) => ({ date: d, ...map.get(d) }));
  }, [slots]);

  // ✅ ensure slots (public, keep normal fetch)
  async function ensureSlots() {
    if (!artistUid) return;
    setEnsuring(true);
    try {
      await fetch(`${API_BASE}/api/availability/ensure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistUid }),
      });
    } catch (e) {
      console.error("Ensure slots failed:", e);
    } finally {
      setEnsuring(false);
    }
  }

  async function loadSlots() {
    if (!artistUid) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/availability/artist/${artistUid}?from=${range.from}&to=${range.to}`
      );
      const data = await res.json();
      setSlots(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error("Load slots failed:", e);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  // ✅ requests are protected now → use authFetch
  async function loadRequests() {
    if (!artistUid) return;
    setLoadingRequests(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/bookings/artist/${artistUid}?status=PENDING`
      );
      const data = await res.json();
      setRequests(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error("Load requests failed:", e);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }

  // ✅ upcoming is protected now → use authFetch
  async function loadUpcoming() {
    if (!artistUid) return;
    setLoadingUpcoming(true);
    try {
      const [acceptedRes, confirmedRes] = await Promise.all([
        authFetch(`${API_BASE}/api/bookings/artist/${artistUid}?status=ACCEPTED`),
        authFetch(`${API_BASE}/api/bookings/artist/${artistUid}?status=CONFIRMED`),
      ]);

      const accepted = await acceptedRes.json();
      const confirmed = await confirmedRes.json();

      const a = Array.isArray(accepted.data) ? accepted.data : [];
      const c = Array.isArray(confirmed.data) ? confirmed.data : [];

      const merged = [...a, ...c].sort((x, y) =>
        (x.date || "").localeCompare(y.date || "")
      );

      setUpcoming(merged);
    } catch (e) {
      console.error("Load upcoming failed:", e);
      setUpcoming([]);
    } finally {
      setLoadingUpcoming(false);
    }
  }

  // ✅ initial load
  useEffect(() => {
    if (!artistUid) return;
    (async () => {
      await ensureSlots();
      await loadSlots();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistUid]);

  // ✅ tab loads
  useEffect(() => {
    if (!artistUid) return;
    if (activeTab === "REQUESTS") loadRequests();
    if (activeTab === "UPCOMING") loadUpcoming();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, artistUid]);

  // ✅ toggle slot (protected → authFetch)
  async function toggleSlot(slot) {
    if (!slot?._id) return;
    if (slot.status === "BOOKED") return;

    const nextStatus = slot.status === "OPEN" ? "DISABLED" : "OPEN";

    const prevSlots = slots;
    setSlots((old) =>
      old.map((s) => (s._id === slot._id ? { ...s, status: nextStatus } : s))
    );

    try {
      const res = await authFetch(
        `${API_BASE}/api/availability/${slot._id}/toggle`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await res.json();
      console.log("toggle response:", data);
      if (!res.ok || !data.success) throw new Error(data.message || "Toggle failed");

      setSlots((old) => old.map((s) => (s._id === slot._id ? data.data : s)));
    } catch (e) {
      console.error(e);
      setSlots(prevSlots);
      alert(e.message || "Failed to toggle slot");
    }
  }

  // ✅ accept (protected → authFetch)
  async function acceptBooking(id) {
    try {
      const res = await authFetch(`${API_BASE}/api/bookings/${id}/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Accept failed");

      setRequests((old) => old.filter((b) => b._id !== id));
      loadSlots();
      loadUpcoming();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to accept booking");
    }
  }

  // ✅ reject (protected → authFetch)
  async function rejectBooking(id) {
    try {
      const res = await authFetch(`${API_BASE}/api/bookings/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Reject failed");

      setRequests((old) => old.filter((b) => b._id !== id));
      loadSlots();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to reject booking");
    }
  }

  return (
    <div className="artistDash artistBookingsPage">
      {/* Sidebar */}
      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <a className="artistDash__navItem" href="/artist/dashboard">
            <span className="artistDash__navIcon"><FiHome /></span>
            <span>Overview</span>
          </a>

          <a className="artistDash__navItem artistDash__navItem--active" href="/artist/bookings">
            <span className="artistDash__navIcon"><FiCalendar /></span>
            <span>Bookings</span>
          </a>

          <a className="artistDash__navItem" href="/artist/chords">
            <span className="artistDash__navIcon"><FiMusic /></span>
            <span>My Chords</span>
          </a>

          <a className="artistDash__navItem" href="/artist/reviews">
            <span className="artistDash__navIcon"><FiStar /></span>
            <span>Reviews</span>
          </a>
        </nav>

        <div className="artistDash__sideBottom">
          <a className="artistDash__sideAction" href="/artist/profile">
            <span className="artistDash__navIcon"><FiUser /></span>
            <span>Profile</span>
          </a>

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

        {/* Hero */}
        <section className="bookingsHeroCard">
          <div className="bookingsHeroCard__left">
            <h1 className="bookingsHeroCard__title">Bookings</h1>
            <p className="bookingsHeroCard__sub">Availability • Requests • Upcoming</p>
          </div>

          <div className="bookingsHeroCard__right">
            <div className="bookingsHeroCard__range">
              {humanDate(range.from)} → {humanDate(range.to)}
            </div>

            <button
              type="button"
              className="bookingsHeroCard__btn"
              onClick={async () => {
                await ensureSlots();
                await loadSlots();
                if (activeTab === "REQUESTS") await loadRequests();
                if (activeTab === "UPCOMING") await loadUpcoming();
              }}
              disabled={ensuring || loadingSlots}
            >
              {ensuring ? "Ensuring..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* Tabs */}
        <section className="bookingsTabsWrap">
          <div className="bookingsTabs">
            <button
              type="button"
              className={`bookingsTab ${activeTab === "AVAILABILITY" ? "bookingsTab--active" : ""}`}
              onClick={() => setActiveTab("AVAILABILITY")}
            >
              Availability
            </button>

            <button
              type="button"
              className={`bookingsTab ${activeTab === "REQUESTS" ? "bookingsTab--active" : ""}`}
              onClick={() => setActiveTab("REQUESTS")}
            >
              Requests
              {requests.length > 0 && (
                <span className="bookingsTab__badge">{requests.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`bookingsTab ${activeTab === "UPCOMING" ? "bookingsTab--active" : ""}`}
              onClick={() => setActiveTab("UPCOMING")}
            >
              Upcoming
            </button>
          </div>
        </section>

        {/* Content */}
        <section className="bookingsContent">
          {/* Availability */}
          {activeTab === "AVAILABILITY" && (
            <>
              {loadingSlots && <div className="bookingsEmptyState">Loading availability...</div>}

              {!loadingSlots && groupedByDate.length === 0 && (
                <div className="bookingsEmptyState">
                  No slots found. Click Refresh to generate slots for the next 30 days.
                </div>
              )}

              {!loadingSlots && groupedByDate.length > 0 && (
                <div className="availabilityStack">
                  {groupedByDate.map((row) => (
                    <div className="availabilityRowCard" key={row.date}>
                      <div className="availabilityRowCard__date">
                        <div className="availabilityRowCard__day">{humanDate(row.date)}</div>
                        <div className="availabilityRowCard__ymd">{row.date}</div>
                      </div>

                      <div className="availabilityRowCard__slots">
                        <button
                          type="button"
                          className={`slotChip slotChip--${String(row.MORNING?.status || "OPEN").toLowerCase()}`}
                          onClick={() => toggleSlot(row.MORNING)}
                          disabled={!row.MORNING || row.MORNING.status === "BOOKED"}
                          title={row.MORNING?.status === "BOOKED" ? "Booked slots cannot be changed" : "Click to toggle"}
                        >
                          <span className="slotChip__title">Morning</span>
                          <span className="slotChip__meta">
                            {row.MORNING?.startTime || "09:00"}–{row.MORNING?.endTime || "12:00"}
                            <span className="slotChip__dot">•</span>
                            {statusLabel(row.MORNING?.status)}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`slotChip slotChip--${String(row.EVENING?.status || "OPEN").toLowerCase()}`}
                          onClick={() => toggleSlot(row.EVENING)}
                          disabled={!row.EVENING || row.EVENING.status === "BOOKED"}
                          title={row.EVENING?.status === "BOOKED" ? "Booked slots cannot be changed" : "Click to toggle"}
                        >
                          <span className="slotChip__title">Evening</span>
                          <span className="slotChip__meta">
                            {row.EVENING?.startTime || "18:00"}–{row.EVENING?.endTime || "21:00"}
                            <span className="slotChip__dot">•</span>
                            {statusLabel(row.EVENING?.status)}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Requests */}
          {activeTab === "REQUESTS" && (
            <>
              {loadingRequests && <div className="bookingsEmptyState">Loading requests...</div>}

              {!loadingRequests && requests.length === 0 && (
                <div className="bookingsEmptyState">No pending requests right now.</div>
              )}

              {!loadingRequests && requests.length > 0 && (
                <div className="requestsStack">
                  {requests.map((b) => (
                    <div className="requestRowCard" key={b._id}>
                      <div className="requestRowCard__left">
                        <div className="requestRowCard__avatar" />
                        <div className="requestRowCard__body">
                          <div className="requestRowCard__title">
                            {humanDate(b.date)} • {slotLabel(b.slotType)}
                          </div>
                          <div className="requestRowCard__meta">
                            Customer: <span className="requestRowCard__uid">{b.customerUid}</span>
                          </div>
                          <div className="requestRowCard__note">
                            {b.note ? b.note : "— No note —"}
                          </div>
                        </div>
                      </div>

                      <div className="requestRowCard__right">
                        <button className="actionBtn actionBtn--accept" type="button" onClick={() => acceptBooking(b._id)}>
                          Accept
                        </button>
                        <button className="actionBtn actionBtn--reject" type="button" onClick={() => rejectBooking(b._id)}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Upcoming */}
          {activeTab === "UPCOMING" && (
            <>
              {loadingUpcoming && <div className="bookingsEmptyState">Loading upcoming bookings...</div>}

              {!loadingUpcoming && upcoming.length === 0 && (
                <div className="bookingsEmptyState">No upcoming bookings yet.</div>
              )}

              {!loadingUpcoming && upcoming.length > 0 && (
                <div className="upcomingStack">
                  {upcoming.map((b) => (
                    <div className="upcomingRowCard" key={b._id}>
                      <div className="upcomingRowCard__left">
                        <div className="upcomingRowCard__icon">✓</div>
                        <div className="upcomingRowCard__body">
                          <div className="upcomingRowCard__title">
                            {humanDate(b.date)} • {slotLabel(b.slotType)}
                          </div>
                          <div className="upcomingRowCard__meta">
                            Customer: <span className="upcomingRowCard__uid">{b.customerUid}</span>
                            <span className="upcomingRowCard__dot">•</span>
                            Status: <span className="upcomingRowCard__status">{b.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="upcomingRowCard__right">
                        <span className={`statusPill statusPill--${String(b.status).toLowerCase()}`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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