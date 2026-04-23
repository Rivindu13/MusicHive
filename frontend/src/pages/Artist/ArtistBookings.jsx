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
  FiFileText,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiX,
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

function humanDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
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
  if (status === "RESERVED") return "Reserved";
  return status || "Open";
}

function safeText(value, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  const txt = String(value).trim();
  return txt ? txt : fallback;
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
  const [selectedRequestId, setSelectedRequestId] = useState(null);

  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [upcoming, setUpcoming] = useState([]);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    console.log("profile:", profile);
    console.log("artistUid:", artistUid);
  }, [profile, artistUid]);

  useEffect(() => {
    if (activeTab !== "REQUESTS") {
      setSelectedRequestId(null);
    }
  }, [activeTab]);

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
      if (!s?.date) continue;
      if (!map.has(s.date)) {
        map.set(s.date, { MORNING: null, EVENING: null });
      }
      map.get(s.date)[s.slotType] = s;
    }

    const dates = Array.from(map.keys()).sort();
    return dates.map((d) => ({ date: d, ...map.get(d) }));
  }, [slots]);

  async function ensureSlots() {
    if (!artistUid) {
      console.error("No artistUid found in profile");
      return;
    }

    setEnsuring(true);
    try {
      const res = await authFetch(`${API_BASE}/api/availability/ensure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistUid }),
      });

      const data = await res.json();
      console.log("ensureSlots response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Ensure slots failed");
      }
    } catch (e) {
      console.error("Ensure slots failed:", e);
    } finally {
      setEnsuring(false);
    }
  }

  async function loadSlots() {
    if (!artistUid) {
      console.error("No artistUid found in profile");
      return;
    }

    setLoadingSlots(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/availability/artist/${artistUid}?from=${range.from}&to=${range.to}`
      );

      const data = await res.json();
      console.log("loadSlots response:", data);

      if (!res.ok) {
        throw new Error(data.message || "Load slots failed");
      }

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.slots)
        ? data.slots
        : [];

      setSlots(rows);
    } catch (e) {
      console.error("Load slots failed:", e);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function loadRequests() {
    if (!artistUid) return;
    setLoadingRequests(true);

    try {
      const res = await authFetch(
        `${API_BASE}/api/bookings/artist/${artistUid}?status=PENDING`
      );
      const data = await res.json();
      const rows = Array.isArray(data.data) ? data.data : [];

      setRequests(rows);

      setSelectedRequestId((prev) => {
        if (!prev) return null;
        return rows.some((r) => r._id === prev) ? prev : null;
      });
    } catch (e) {
      console.error("Load requests failed:", e);
      setRequests([]);
      setSelectedRequestId(null);
    } finally {
      setLoadingRequests(false);
    }
  }

  async function loadUpcoming() {
    if (!artistUid) return;
    setLoadingUpcoming(true);

    try {
      const [acceptedRes, confirmedRes] = await Promise.all([
        authFetch(
          `${API_BASE}/api/bookings/artist/${artistUid}?status=ACCEPTED`
        ),
        authFetch(
          `${API_BASE}/api/bookings/artist/${artistUid}?status=CONFIRMED`
        ),
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

  useEffect(() => {
    if (!artistUid) {
      console.error("artistUid is missing from profile");
      return;
    }

    (async () => {
      await ensureSlots();
      await loadSlots();
    })();
  }, [artistUid, range.from, range.to]);

  useEffect(() => {
    if (!artistUid) return;
    if (activeTab === "REQUESTS") loadRequests();
    if (activeTab === "UPCOMING") loadUpcoming();
  }, [activeTab, artistUid]);

  async function toggleSlot(slot) {
    if (!slot?._id) return;
    if (slot.status === "BOOKED") return;

    const nextStatus = slot.status === "OPEN" ? "DISABLED" : "OPEN";

    const prevSlots = [...slots];
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
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Toggle failed");
      }

      setSlots((old) => old.map((s) => (s._id === slot._id ? data.data : s)));
    } catch (e) {
      console.error(e);
      setSlots(prevSlots);
      alert(e.message || "Failed to toggle slot");
    }
  }

  async function acceptBooking(id) {
    try {
      const res = await authFetch(`${API_BASE}/api/bookings/${id}/accept`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Accept failed");
      }

      const filtered = requests.filter((b) => b._id !== id);
      setRequests(filtered);

      if (selectedRequestId === id) {
        setSelectedRequestId(null);
      }

      loadSlots();
      loadUpcoming();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to accept booking");
    }
  }

  async function rejectBooking(id) {
    try {
      const res = await authFetch(`${API_BASE}/api/bookings/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Reject failed");
      }

      const filtered = requests.filter((b) => b._id !== id);
      setRequests(filtered);

      if (selectedRequestId === id) {
        setSelectedRequestId(null);
      }

      loadSlots();
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to reject booking");
    }
  }

  function toggleRequest(id) {
    setSelectedRequestId((prev) => (prev === id ? null : id));
  }

  function openReviewModal(booking) {
    setReviewTarget(booking);
    setReviewRating(5);
    setReviewComment("");
  }

  function closeReviewModal() {
    if (submittingReview) return;
    setReviewTarget(null);
    setReviewRating(5);
    setReviewComment("");
  }

  async function submitReview() {
    if (!reviewTarget?._id) return;

    setSubmittingReview(true);
    try {
      const res = await authFetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: reviewTarget._id,
          rating: reviewRating,
          comment: reviewComment,
          eventType:
            reviewTarget.customer?.organizerProfile?.eventType || "Event",
          reviewerName: fullName,
          reviewerPhotoURL: profilePic || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      closeReviewModal();
      loadUpcoming();
      alert("Review submitted successfully");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="artistDash artistBookingsPage">
      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <a className="artistDash__navItem" href="/artist/dashboard">
            <span className="artistDash__navIcon">
              <FiHome />
            </span>
            <span>Overview</span>
          </a>

          <a
            className="artistDash__navItem artistDash__navItem--active"
            href="/artist/bookings"
          >
            <span className="artistDash__navIcon">
              <FiCalendar />
            </span>
            <span>Bookings</span>
          </a>

          <a className="artistDash__navItem" href="/artist/chords">
            <span className="artistDash__navIcon">
              <FiMusic />
            </span>
            <span>Chord Library</span>
          </a>

          <a className="artistDash__navItem" href="/artist/reviews">
            <span className="artistDash__navIcon">
              <FiStar />
            </span>
            <span>Reviews</span>
          </a>
        </nav>

        <div className="artistDash__sideBottom">
          <a className="artistDash__sideAction" href="/artist/profile">
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

        <section className="bookingsHeroCard">
          <div className="bookingsHeroCard__left">
            <h1 className="bookingsHeroCard__title">Bookings</h1>
            <p className="bookingsHeroCard__sub">
              Availability • Requests • Accepted
            </p>
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

        <section className="bookingsTabsWrap">
          <div className="bookingsTabs">
            <button
              type="button"
              className={`bookingsTab ${
                activeTab === "AVAILABILITY" ? "bookingsTab--active" : ""
              }`}
              onClick={() => setActiveTab("AVAILABILITY")}
            >
              Availability
            </button>

            <button
              type="button"
              className={`bookingsTab ${
                activeTab === "REQUESTS" ? "bookingsTab--active" : ""
              }`}
              onClick={() => setActiveTab("REQUESTS")}
            >
              Requests
              {requests.length > 0 && (
                <span className="bookingsTab__badge">{requests.length}</span>
              )}
            </button>

            <button
              type="button"
              className={`bookingsTab ${
                activeTab === "UPCOMING" ? "bookingsTab--active" : ""
              }`}
              onClick={() => setActiveTab("UPCOMING")}
            >
              Accepted
            </button>
          </div>
        </section>

        <section className="bookingsContent">
          {activeTab === "AVAILABILITY" && (
            <>
              {loadingSlots && (
                <div className="bookingsEmptyState">Loading availability...</div>
              )}

              {!loadingSlots && groupedByDate.length === 0 && (
                <div className="bookingsEmptyState">
                  No slots found. Click Refresh to generate slots for the next 30
                  days.
                </div>
              )}

              {!loadingSlots && groupedByDate.length > 0 && (
                <div className="availabilityStack">
                  {groupedByDate.map((row) => (
                    <div className="availabilityRowCard" key={row.date}>
                      <div className="availabilityRowCard__date">
                        <div className="availabilityRowCard__day">
                          {humanDate(row.date)}
                        </div>
                        <div className="availabilityRowCard__ymd">
                          {row.date}
                        </div>
                      </div>

                      <div className="availabilityRowCard__slots">
                        <button
                          type="button"
                          className={`slotChip slotChip--${String(
                            row.MORNING?.status || "OPEN"
                          ).toLowerCase()}`}
                          onClick={() => toggleSlot(row.MORNING)}
                          disabled={
                            !row.MORNING || row.MORNING.status === "BOOKED"
                          }
                        >
                          <span className="slotChip__title">Morning</span>
                          <span className="slotChip__meta">
                            {row.MORNING?.startTime || "09:00"}–
                            {row.MORNING?.endTime || "12:00"}
                            <span className="slotChip__dot">•</span>
                            {statusLabel(row.MORNING?.status)}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`slotChip slotChip--${String(
                            row.EVENING?.status || "OPEN"
                          ).toLowerCase()}`}
                          onClick={() => toggleSlot(row.EVENING)}
                          disabled={
                            !row.EVENING || row.EVENING.status === "BOOKED"
                          }
                        >
                          <span className="slotChip__title">Evening</span>
                          <span className="slotChip__meta">
                            {row.EVENING?.startTime || "18:00"}–
                            {row.EVENING?.endTime || "21:00"}
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

          {activeTab === "REQUESTS" && (
            <>
              {loadingRequests && (
                <div className="bookingsEmptyState">Loading requests...</div>
              )}

              {!loadingRequests && requests.length === 0 && (
                <div className="bookingsEmptyState">
                  No pending requests right now.
                </div>
              )}

              {!loadingRequests && requests.length > 0 && (
                <div className="requestsStack requestsStack--wide">
                  {requests.map((b) => {
                    const customer = b.customer || {};
                    const organizer = customer.organizerProfile || {};
                    const isOpen = selectedRequestId === b._id;

                    return (
                      <div
                        className={`requestExpandCard ${
                          isOpen ? "requestExpandCard--open" : ""
                        }`}
                        key={b._id}
                      >
                        <button
                          type="button"
                          className="requestExpandCard__summary"
                          onClick={() => toggleRequest(b._id)}
                        >
                          <div className="requestExpandCard__left">
                            <div
                              className="requestExpandCard__avatar"
                              style={
                                customer.photoURL
                                  ? {
                                      backgroundImage: `url(${customer.photoURL})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                    }
                                  : {}
                              }
                            />

                            <div className="requestExpandCard__body">
                              <div className="requestExpandCard__title">
                                {humanDate(b.date)} • {slotLabel(b.slotType)}
                              </div>

                              <div className="requestExpandCard__meta">
                                <span>
                                  {safeText(customer.name, "Unknown customer")}
                                </span>
                                <span className="requestExpandCard__dot">•</span>
                                <span>
                                  {safeText(
                                    organizer.organizationName,
                                    safeText(customer.email, "No email")
                                  )}
                                </span>
                              </div>

                              <div className="requestExpandCard__note">
                                {b.note ? b.note : "— No note —"}
                              </div>
                            </div>
                          </div>

                          <div className="requestExpandCard__right">
                            <span className="requestExpandCard__view">
                              {isOpen ? "Hide details" : "View details"}
                            </span>
                            <span className="requestExpandCard__icon">
                              {isOpen ? <FiChevronUp /> : <FiChevronDown />}
                            </span>
                          </div>
                        </button>

                        {isOpen && (
                          <div className="requestExpandCard__details">
                            <div className="requestExpandCard__detailsTop">
                              <h3 className="requestExpandCard__detailsTitle">
                                Booking Details
                              </h3>
                              <span className="statusPill statusPill--pending">
                                {b.status}
                              </span>
                            </div>

                            <div className="requestDetailsSection">
                              <div className="requestDetailsSection__title">
                                Booking information
                              </div>

                              <div className="detailsGrid">
                                <div className="detailItem">
                                  <span className="detailItem__label">Date</span>
                                  <span className="detailItem__value">
                                    {humanDate(b.date)}
                                  </span>
                                </div>

                                <div className="detailItem">
                                  <span className="detailItem__label">Slot</span>
                                  <span className="detailItem__value">
                                    {slotLabel(b.slotType)}
                                  </span>
                                </div>

                                <div className="detailItem">
                                  <span className="detailItem__label">Status</span>
                                  <span className="detailItem__value">
                                    {safeText(b.status)}
                                  </span>
                                </div>

                                <div className="detailItem">
                                  <span className="detailItem__label">Price</span>
                                  <span className="detailItem__value">
                                    {b.price != null
                                      ? `Rs. ${b.price}`
                                      : "Not set"}
                                  </span>
                                </div>

                                <div className="detailItem">
                                  <span className="detailItem__label">Payment</span>
                                  <span className="detailItem__value">
                                    {safeText(b.paymentStatus, "UNPAID")}
                                  </span>
                                </div>

                                <div className="detailItem">
                                  <span className="detailItem__label">Created</span>
                                  <span className="detailItem__value">
                                    {humanDateTime(b.createdAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="detailBlock">
                                <div className="detailBlock__label">
                                  <FiFileText />
                                  <span>Customer Note</span>
                                </div>
                                <div className="detailBlock__value">
                                  {safeText(b.note)}
                                </div>
                              </div>
                            </div>

                            <div className="requestDetailsActions">
                              <button
                                className="actionBtn actionBtn--accept"
                                type="button"
                                onClick={() => acceptBooking(b._id)}
                              >
                                Accept
                              </button>

                              <button
                                className="actionBtn actionBtn--reject"
                                type="button"
                                onClick={() => rejectBooking(b._id)}
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {activeTab === "UPCOMING" && (
            <>
              {loadingUpcoming && (
                <div className="bookingsEmptyState">
                  Loading upcoming bookings...
                </div>
              )}

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
                            Customer:{" "}
                            <span className="upcomingRowCard__uid">
                              {safeText(b.customer?.name, b.customerUid)}
                            </span>
                            <span className="upcomingRowCard__dot">•</span>
                            Status:{" "}
                            <span className="upcomingRowCard__status">
                              {b.status}
                            </span>
                          </div>

                          {b.canReviewOrganizer && (
                            <div className="upcomingRowCard__reviewWrap">
                              <button
                                type="button"
                                className="reviewBtn"
                                onClick={() => openReviewModal(b)}
                              >
                                <FiEdit3 />
                                <span>Review organizer</span>
                              </button>
                            </div>
                          )}

                          {b.artistReviewGiven && (
                            <div className="upcomingRowCard__reviewDone">
                              Review already submitted
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="upcomingRowCard__right">
                        <span
                          className={`statusPill statusPill--${String(
                            b.status
                          ).toLowerCase()}`}
                        >
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

        <footer className="artistDash__footer">
          <div>© 2025 MusicHive. All rights reserved.</div>
          <div className="artistDash__footerLinks">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </footer>
      </main>

      {reviewTarget && (
        <div className="reviewModalOverlay" onClick={closeReviewModal}>
          <div className="reviewModal" onClick={(e) => e.stopPropagation()}>
            <div className="reviewModal__header">
              <div>
                <h3 className="reviewModal__title">Review Organizer</h3>
                <p className="reviewModal__sub">
                  {safeText(reviewTarget.customer?.name, "Organizer")} •{" "}
                  {humanDate(reviewTarget.date)}
                </p>
              </div>

              <button
                type="button"
                className="reviewModal__close"
                onClick={closeReviewModal}
              >
                <FiX />
              </button>
            </div>

            <div className="reviewModal__body">
              <label className="reviewField">
                <span className="reviewField__label">Rating</span>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="reviewField__input"
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Good</option>
                  <option value={3}>3 - Okay</option>
                  <option value={2}>2 - Poor</option>
                  <option value={1}>1 - Very Poor</option>
                </select>
              </label>

              <label className="reviewField">
                <span className="reviewField__label">Comment</span>
                <textarea
                  rows={5}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="reviewField__input reviewField__textarea"
                  placeholder="Write your review here..."
                />
              </label>
            </div>

            <div className="reviewModal__actions">
              <button
                type="button"
                className="actionBtn actionBtn--reject"
                onClick={closeReviewModal}
                disabled={submittingReview}
              >
                Cancel
              </button>

              <button
                type="button"
                className="actionBtn actionBtn--accept"
                onClick={submitReview}
                disabled={submittingReview}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}