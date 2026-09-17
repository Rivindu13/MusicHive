import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import "../Artist/styles/ArtistDashboard.css";
import "./Styles/MyBookings.css";

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiHeart,
  FiAlertTriangle,
  FiCheckCircle,
  FiEdit2,
  FiX,
  FiInfo,
} from "react-icons/fi";

import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase";

const API_BASE = "http://localhost:5000";

/* helpers */
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

function slotTypeLabel(t) {
  return t === "MORNING" ? "Morning" : t === "EVENING" ? "Evening" : t;
}

function statusLabel(status) {
  if (status === "PENDING") return "Pending";
  if (status === "ACCEPTED") return "Accepted";
  if (status === "REJECTED") return "Rejected";
  if (status === "CONFIRMED") return "Confirmed";
  if (status === "CANCELLED") return "Cancelled";
  if (status === "EXPIRED") return "Expired";
  return status || "—";
}

function isPastBookingDate(ymd) {
  if (!ymd) return false;

  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const [year, month, day] = String(ymd).split("-").map(Number);
  const bookingDay = new Date(year, month - 1, day);

  return bookingDay < localToday;
}

function waitForAuthReady() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}

async function getIdTokenOrThrow() {
  let user = auth.currentUser;

  if (!user) {
    user = await waitForAuthReady();
  }

  if (!user) throw new Error("You are not logged in.");

  return await user.getIdToken();
}

export default function CustomerMyBookingsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Toast notification state
  const [toasts, setToasts] = useState([]);

  const triggerToast = (message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Cancel Confirmation Modal State
  const [bookingToCancelId, setBookingToCancelId] = useState(null);

  const profile = useMemo(() => {
    return JSON.parse(localStorage.getItem("profile")) || null;
  }, []);

  const profilePic = profile?.photoURL || null;
  const fullName =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    profile?.customerName ||
    "Customer";

  const customerUid = profile?.uid || profile?.userUid || profile?.id || null;

  const [authReady, setAuthReady] = useState(false);

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const [tab, setTab] = useState("PENDING");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [artistMap, setArtistMap] = useState({});
  const [payingId, setPayingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editBooking, setEditBooking] = useState(null);
  const [editNote, setEditNote] = useState("");
  const [editEventLocation, setEditEventLocation] = useState("");
  const [editEventType, setEditEventType] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  async function fetchArtistIfMissing(uid) {
    if (!uid) return;
    setArtistMap((prev) => {
      if (prev[uid]) return prev;
      return { ...prev, [uid]: { name: "Artist", photoURL: null, _loading: true } };
    });

    try {
      const res = await fetch(`${API_BASE}/api/users/${uid}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || "Failed to load artist");

      const name = data?.name || "Artist";
      const photoURL = data?.photoURL || null;

      setArtistMap((prev) => ({
        ...prev,
        [uid]: { name, photoURL },
      }));
    } catch {
      setArtistMap((prev) => ({
        ...prev,
        [uid]: { name: "Artist", photoURL: null },
      }));
    }
  }

  async function loadCustomerBookings() {
    if (!authReady) return;

    setLoading(true);
    setErr("");

    try {
      const idToken = await getIdTokenOrThrow();
      const uid = customerUid || auth.currentUser?.uid;

      if (!uid) throw new Error("Missing customer uid in profile.");

      const res = await fetch(`${API_BASE}/api/bookings/customer/${uid}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load bookings");
      }

      const list = Array.isArray(data.data) ? data.data : [];
      setItems(list);

      const uniqueArtistUids = Array.from(
        new Set(list.map((b) => b.artistUid).filter(Boolean))
      );
      uniqueArtistUids.forEach((aUid) => fetchArtistIfMissing(aUid));
    } catch (e) {
      setItems([]);
      setErr(e.message || "Failed to load bookings");
      triggerToast(e.message || "Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    loadCustomerBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  useEffect(() => {
    if (!authReady) return;

    async function checkReturnedPayment() {
      const params = new URLSearchParams(location.search);
      const bookingId = params.get("bookingId");
      const payment = params.get("payment");

      if (!bookingId || !payment) return;

      try {
        const idToken = await getIdTokenOrThrow();

        const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/payment-status`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch payment status");
        }

        const info = data.data;

        if (info.paymentStatus === "PAID") {
          triggerToast("Payment successful. Booking is now confirmed.", "success");
          setTab("PAID");
        } else if (payment === "cancel") {
          triggerToast("Payment was cancelled.", "info");
          setTab("ACCEPTED");
        } else {
          triggerToast(info.paymentMessage || "Payment unsuccessful.", "error");
          setTab("ACCEPTED");
        }

        await loadCustomerBookings();
        window.history.replaceState({}, document.title, "/customer/my-bookings");
      } catch (e) {
        triggerToast(e.message || "Failed to verify payment result", "error");
      } finally {
        setPayingId(null);
      }
    }

    checkReturnedPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, location.search]);

  const pending = useMemo(() => {
    return items.filter((b) => b.status === "PENDING");
  }, [items]);

  const accepted = useMemo(() => {
    return items.filter(
      (b) =>
        b.status === "ACCEPTED" &&
        (b.paymentStatus === "UNPAID" || !b.paymentStatus)
    );
  }, [items]);

  const paid = useMemo(() => {
    return items.filter(
      (b) =>
        (b.paymentStatus === "PAID" || b.status === "CONFIRMED") &&
        b.status !== "CANCELLED" &&
        b.status !== "REJECTED"
    );
  }, [items]);

  const visible =
    tab === "PENDING" ? pending : tab === "ACCEPTED" ? accepted : paid;

  function handleTabChange(nextTab) {
    setTab(nextTab);
  }

  async function payNow(bookingId) {
    setPayingId(bookingId);

    try {
      const idToken = await getIdTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/init-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to start payment");
      }

      const { checkoutUrl, payment } = data.data;

      const form = document.createElement("form");
      form.method = "POST";
      form.action = checkoutUrl;

      Object.entries(payment).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value ?? "";
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      triggerToast(e.message || "Failed to start payment", "error");
      setPayingId(null);
    }
  }

  async function confirmAndCancelBooking() {
    const bookingId = bookingToCancelId;
    setBookingToCancelId(null);
    if (!bookingId) return;

    setErr("");
    setCancellingId(bookingId);

    try {
      const idToken = await getIdTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to cancel booking");
      }

      setItems((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "CANCELLED" } : b
        )
      );

      triggerToast("Booking cancelled successfully.", "success");
    } catch (e) {
      triggerToast(e.message || "Cancel failed", "error");
    } finally {
      setCancellingId(null);
    }
  }

  function openEdit(b) {
    if (b.status !== "PENDING") {
      triggerToast("Booking details cannot be edited after the artist accepts the request.", "warning");
      return;
    }

    setEditBooking(b);
    setEditNote(b.note || "");
    setEditEventLocation(b.eventLocation || "");
    setEditEventType(b.eventType || "");
    setEditOpen(true);
  }

  function closeEdit() {
    if (editSubmitting) return;
    setEditOpen(false);
    setEditBooking(null);
    setEditNote("");
    setEditEventLocation("");
    setEditEventType("");
  }

  async function submitEdit() {
    if (!editBooking) return;

    setEditSubmitting(true);

    try {
      const idToken = await getIdTokenOrThrow();
      const res = await fetch(`${API_BASE}/api/bookings/${editBooking._id}/note`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + idToken,
        },
        body: JSON.stringify({
          note: editNote,
          eventLocation: editEventLocation,
          eventType: editEventType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update booking details");
      }

      setItems((prev) =>
        prev.map((booking) =>
          booking._id === editBooking._id
            ? {
                ...booking,
                note: data.data.note,
                eventLocation: data.data.eventLocation,
                eventType: data.data.eventType,
              }
            : booking
        )
      );
      triggerToast("Booking details updated successfully.", "success");
      closeEdit();
    } catch (e) {
      triggerToast(e.message || "Failed to update booking details", "error");
    } finally {
      setEditSubmitting(false);
    }
  }

  function openReview(b) {
    setReviewBooking(b);
    setRating(5);
    setComment("");
    setReviewOpen(true);
  }

  function goToReport(b) {
    const artistName = b.artist?.name || artistMap[b.artistUid]?.name || "Artist";

    navigate("/customer/report", {
      state: {
        bookingId: b._id,
        reportedUid: b.artistUid,
        reportedName: artistName,
        reportedRole: "artist",
        bookingDate: b.date,
        slotType: b.slotType,
      },
    });
  }

  function closeReview() {
    setReviewOpen(false);
    setReviewBooking(null);
    setRating(5);
    setComment("");
    setReviewSubmitting(false);
  }

  async function submitReview() {
    if (!reviewBooking?._id) return;

    try {
      setReviewSubmitting(true);
      const idToken = await getIdTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          bookingId: reviewBooking._id,
          reviewerName: fullName,
          reviewerPhotoURL: profilePic || null,
          rating: Number(rating),
          comment: comment || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Review failed");

      triggerToast("Review submitted successfully!", "success");
      closeReview();
    } catch (e) {
      triggerToast(e.message || "Review failed", "error");
    } finally {
      setReviewSubmitting(false);
    }
  }

  if (!authReady) {
    return (
      <div className="artistDash customerMyBookingsPage">
        <main className="artistDash__main">
          <div className="cmbEmpty">Loading your session...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="artistDash customerMyBookingsPage">
      {/* Toast Notification Container */}
      <div className="toast-portal-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="toast-icon-wrapper">
              {toast.type === "success" && <FiCheckCircle className="toast-icon" />}
              {toast.type === "error" && <FiAlertTriangle className="toast-icon" />}
              {toast.type === "warning" && <FiAlertTriangle className="toast-icon" />}
              {toast.type === "info" && <FiInfo className="toast-icon" />}
            </div>
            <div className="toast-message-content">{toast.message}</div>
            <button
              className="toast-dismiss-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <FiX />
            </button>
            <div
              className="toast-expiry-bar"
              style={{ animationDuration: `${toast.duration}ms` }}
            />
          </div>
        ))}
      </div>

      {/* Cancel Confirmation Modal (replaces window.confirm) */}
      {bookingToCancelId && (
        <div
          className="modal-backdrop"
          onClick={() => setBookingToCancelId(null)}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Cancel Booking</h3>
            <p>Are you sure you want to cancel this booking? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setBookingToCancelId(null)}
              >
                Keep Booking
              </button>
              <button
                type="button"
                className="deleteChordBtn--danger"
                onClick={confirmAndCancelBooking}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <Link className="artistDash__navItem" to="/customer/dashboard">
            <span className="artistDash__navIcon"><FiHome /></span>
            <span>Overview</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/book-artists">
            <span className="artistDash__navIcon"><FiCalendar /></span>
            <span>Booking Artists</span>
          </Link>

          <Link
            className="artistDash__navItem artistDash__navItem--active"
            to="/customer/my-bookings"
          >
            <span className="artistDash__navIcon"><FiCalendar /></span>
            <span>My Bookings</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/chords">
            <span className="artistDash__navIcon"><FiMusic /></span>
            <span>Chord Library</span>
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
          <NotificationBell uid={profile?.uid} />
          <button
            className="artistDash__iconBtn"
            type="button"
            onClick={() => navigate("/customer/wishlist")}
            title="Wishlist"
          >
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

        <section className="cmbHeader">
          <h1 className="cmbTitle">My Bookings</h1>

          <div className="cmbTabs">
            <button
              className={`cmbTab ${tab === "PENDING" ? "cmbTab--active" : ""}`}
              onClick={() => handleTabChange("PENDING")}
              type="button"
            >
              Pending ({pending.length})
            </button>

            <button
              className={`cmbTab ${tab === "ACCEPTED" ? "cmbTab--active" : ""}`}
              onClick={() => handleTabChange("ACCEPTED")}
              type="button"
            >
              Accepted / Pay ({accepted.length})
            </button>

            <button
              className={`cmbTab ${tab === "PAID" ? "cmbTab--active" : ""}`}
              onClick={() => handleTabChange("PAID")}
              type="button"
            >
              Paid / Review ({paid.length})
            </button>

            <button
              className="cmbRefresh"
              type="button"
              onClick={loadCustomerBookings}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {err && (
          <div className="cmbState cmbState--error">
            <FiAlertTriangle /> {err}
          </div>
        )}

        <section className="cmbList">
          {loading && <div className="cmbEmpty">Loading your bookings...</div>}

          {!loading && !err && visible.length === 0 && (
            <div className="cmbEmpty">No bookings in this category.</div>
          )}

          {!loading &&
            !err &&
            visible.map((b) => {
              const artistName = b.artist?.name || artistMap[b.artistUid]?.name || "Artist";
              const artistPhoto =
                b.artist?.photoURL ||
                artistMap[b.artistUid]?.photoURL ||
                "https://via.placeholder.com/56";

              const payAllowed =
                b.status === "ACCEPTED" &&
                (b.paymentStatus === "UNPAID" || !b.paymentStatus);

              const bookingPassed = isPastBookingDate(b.date);

              const reviewAllowed =
                (b.paymentStatus === "PAID" || b.status === "CONFIRMED") &&
                b.status !== "CANCELLED" &&
                b.status !== "REJECTED";

              const reportAllowed = reviewAllowed && bookingPassed;
              const editAllowed =
                b.status === "PENDING" && b.paymentStatus !== "PAID";

              return (
                <div className="cmbCard" key={b._id}>
                  <div className="cmbLeft">
                    <div
                      className="cmbAvatar"
                      style={{ backgroundImage: `url(${artistPhoto})` }}
                    />
                    <div className="cmbTexts">
                      <div className="cmbName">{artistName}</div>
                      <div className="cmbMeta">
                        {humanDate(b.date)} • {slotTypeLabel(b.slotType)}
                      </div>
                      <div className="cmbMeta">
                        Status: <b>{statusLabel(b.status)}</b>
                        {b.paymentStatus ? (
                          <>
                            <span className="cmbDot">•</span>
                            Payment: <b>{b.paymentStatus}</b>
                          </>
                        ) : null}
                      </div>
                      {b.note && (
                        <div className="cmbMeta cmbNotePreview">
                          Details: {b.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="cmbRight">
                    <div className="cmbPrice">
                      {typeof b.price === "number"
                        ? `LKR ${b.price.toLocaleString()}`
                        : typeof b.amountPaid === "number"
                        ? `LKR ${b.amountPaid.toLocaleString()}`
                        : "—"}
                    </div>

                    <div className="cmbActions">
                      {editAllowed && (
                        <button
                          type="button"
                          className="cmbBtn cmbBtn--ghost"
                          onClick={() => openEdit(b)}
                        >
                          <FiEdit2 /> EDIT
                        </button>
                      )}

                      {tab === "PENDING" && (
                        <button
                          type="button"
                          className="cmbBtn cmbBtn--danger"
                          onClick={() => setBookingToCancelId(b._id)}
                          disabled={cancellingId === b._id}
                        >
                          {cancellingId === b._id ? "CANCELLING..." : "CANCEL"}
                        </button>
                      )}

                      {payAllowed && (
                        <button
                          type="button"
                          className="cmbBtn cmbBtn--primary"
                          onClick={() => payNow(b._id)}
                          disabled={payingId === b._id}
                        >
                          {payingId === b._id ? "PAYING..." : "PAY NOW"}
                        </button>
                      )}

                      {reviewAllowed && (
                        <button
                          type="button"
                          className="cmbBtn cmbBtn--secondary"
                          onClick={() => openReview(b)}
                        >
                          REVIEW
                        </button>
                      )}

                      {reportAllowed && (
                        <button
                          type="button"
                          className="cmbBtn cmbBtn--report"
                          onClick={() => goToReport(b)}
                        >
                          REPORT
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </section>

        {reviewOpen && (
          <div
            className="cmbModalOverlay"
            onMouseDown={(e) => {
              if (e.target.classList.contains("cmbModalOverlay")) closeReview();
            }}
          >
            <div className="cmbModal">
              <div className="cmbModalTop">
                <div className="cmbModalTitle">Write a Review</div>
                <button
                  className="cmbModalClose"
                  type="button"
                  onClick={closeReview}
                >
                  <FiX />
                </button>
              </div>

              <div className="cmbModalBody">
                <div className="cmbModalRow">
                  <div className="cmbLabel">Rating</div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "0",
                          cursor: "pointer",
                          fontSize: "36px",
                          color: star <= rating ? "#ffae00" : "#555564",
                        }}
                      >
                        ★
                      </button>
                    ))}

                    <span
                      style={{
                        marginLeft: "10px",
                        color: "#b8b8c5",
                        fontWeight: "600",
                      }}
                    >
                      {rating === 5
                        ? "Excellent"
                        : rating === 4
                        ? "Good"
                        : rating === 3
                        ? "Okay"
                        : rating === 2
                        ? "Bad"
                        : "Very Bad"}
                    </span>
                  </div>
                </div>

                <div className="cmbModalRow">
                  <div className="cmbLabel">Comment</div>
                  <textarea
                    className="cmbTextarea"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write something (optional)..."
                  />
                </div>

                <div className="cmbModalActions">
                  <button
                    className="cmbBtn cmbBtn--ghost"
                    type="button"
                    onClick={closeReview}
                  >
                    Cancel
                  </button>
                  <button
                    className="cmbBtn cmbBtn--primary"
                    type="button"
                    onClick={submitReview}
                    disabled={reviewSubmitting}
                  >
                    {reviewSubmitting ? "SUBMITTING..." : "SUBMIT REVIEW"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {editOpen && (
          <div
            className="cmbModalOverlay"
            onMouseDown={(e) => {
              if (e.target.classList.contains("cmbModalOverlay")) closeEdit();
            }}
          >
            <div className="cmbModal">
              <div className="cmbModalTop">
                <div className="cmbModalTitle">Edit Booking Details</div>
                <button
                  className="cmbModalClose"
                  type="button"
                  onClick={closeEdit}
                  disabled={editSubmitting}
                >
                  <FiX />
                </button>
              </div>

              <div className="cmbModalBody">
                <div className="cmbModalRow">
                  <div className="cmbLabel">Event location</div>
                  <input
                    className="cmbInput"
                    type="text"
                    maxLength={300}
                    required
                    value={editEventLocation}
                    onChange={(e) => setEditEventLocation(e.target.value)}
                    placeholder="Where will the event take place?"
                  />
                </div>

                <div className="cmbModalRow">
                  <div className="cmbLabel">Event type</div>
                  <input
                    className="cmbInput"
                    type="text"
                    maxLength={120}
                    required
                    value={editEventType}
                    onChange={(e) => setEditEventType(e.target.value)}
                    placeholder="Wedding, birthday, corporate event..."
                  />
                </div>

                <div className="cmbModalRow">
                  <div className="cmbLabel">Description / Note (optional)</div>
                  <textarea
                    className="cmbTextarea"
                    rows={6}
                    maxLength={1000}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Describe your event requirements..."
                  />
                  <div className="cmbCharacterCount">{editNote.length}/1000</div>
                </div>

                <div className="cmbModalActions">
                  <button
                    className="cmbBtn cmbBtn--ghost"
                    type="button"
                    onClick={closeEdit}
                    disabled={editSubmitting}
                  >
                    Close
                  </button>
                  <button
                    className="cmbBtn cmbBtn--primary"
                    type="button"
                    onClick={submitEdit}
                    disabled={editSubmitting}
                  >
                    {editSubmitting ? "SAVING..." : "SAVE CHANGES"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="artistDash__footer">
          <div>© 2026 MusicHive. All rights reserved.</div>
          <div className="artistDash__footerLinks">
            <a href="mailto:hello@musichive.lk?subject=MusicHive%20Terms">
              Terms
            </a>
            <a href="mailto:hello@musichive.lk?subject=MusicHive%20Privacy">
              Privacy
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}