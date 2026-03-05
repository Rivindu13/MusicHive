import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  FiX,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
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

async function getIdTokenOrThrow() {
  const user = auth.currentUser;
  if (!user) throw new Error("You are not logged in.");
  return await user.getIdToken();
}

export default function CustomerMyBookingsPage() {
  const navigate = useNavigate();

  // profile
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

  // route guard
  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) navigate("/", { replace: true });
  }, [navigate]);

  // logout
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

  // tabs
  const [tab, setTab] = useState("PENDING"); // PENDING | ACCEPTED | PAID

  // bookings
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  // artist cache (for names/photos)
  const [artistMap, setArtistMap] = useState({}); // { [artistUid]: {name, photoURL} }

  // pay state
  const [payingId, setPayingId] = useState(null);
  const [payErr, setPayErr] = useState("");
  const [payOk, setPayOk] = useState("");

  // review modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewErr, setReviewErr] = useState("");
  const [reviewOk, setReviewOk] = useState("");

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
    setLoading(true);
    setErr("");
    try {
      const idToken = await getIdTokenOrThrow();

      const uid = customerUid || auth.currentUser?.uid;
      if (!uid) throw new Error("Missing customer uid in profile.");

      // ✅ your existing route:
      const res = await fetch(`${API_BASE}/api/bookings/customer/${uid}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load bookings");
      }

      const list = Array.isArray(data.data) ? data.data : [];
      setItems(list);

      // preload artist details (best effort)
      const uniqueArtistUids = Array.from(new Set(list.map((b) => b.artistUid).filter(Boolean)));
      uniqueArtistUids.forEach((aUid) => fetchArtistIfMissing(aUid));
    } catch (e) {
      setItems([]);
      setErr(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomerBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filtered lists
  const pending = useMemo(() => {
    return items.filter((b) => b.status === "PENDING");
  }, [items]);

  const accepted = useMemo(() => {
    // accepted but not paid yet
    return items.filter(
      (b) =>
        b.status === "ACCEPTED" &&
        (b.paymentStatus === "UNPAID" || !b.paymentStatus)
    );
  }, [items]);

  const paid = useMemo(() => {
    // paid/confirmed
    return items.filter(
      (b) =>
        (b.paymentStatus === "PAID" || b.status === "CONFIRMED") &&
        b.status !== "CANCELLED" &&
        b.status !== "REJECTED"
    );
  }, [items]);

  const visible =
    tab === "PENDING" ? pending : tab === "ACCEPTED" ? accepted : paid;

  async function payNow(bookingId) {
    setPayErr("");
    setPayOk("");
    setPayingId(bookingId);
    try {
      const idToken = await getIdTokenOrThrow();

      // ✅ your existing route:
      const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/markPaid`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}), // optional: { paymentRef, amountPaid }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Payment failed");
      }

      setPayOk("Payment successful. Booking is now confirmed.");
      await loadCustomerBookings();
    } catch (e) {
      setPayErr(e.message || "Payment failed");
    } finally {
      setPayingId(null);
    }
  }

  function openReview(b) {
    setReviewBooking(b);
    setRating(5);
    setComment("");
    setReviewErr("");
    setReviewOk("");
    setReviewOpen(true);
  }

  function closeReview() {
    setReviewOpen(false);
    setReviewBooking(null);
    setRating(5);
    setComment("");
    setReviewErr("");
    setReviewOk("");
    setReviewSubmitting(false);
  }

  async function submitReview() {
    setReviewErr("");
    setReviewOk("");
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

        setReviewOk("Review submitted!");
    } catch (e) {
        setReviewErr(e.message || "Review failed");
    } finally {
        setReviewSubmitting(false);
    }
  }

  return (
    <div className="artistDash customerMyBookingsPage">
      {/* Sidebar */}
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
          <button className="artistDash__iconBtn"><FiBell /></button>
          <button className="artistDash__iconBtn"><FiHeart /></button>

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

        {/* Header */}
        <section className="cmbHeader">
          <h1 className="cmbTitle">My Bookings</h1>

          <div className="cmbTabs">
            <button
              className={`cmbTab ${tab === "PENDING" ? "cmbTab--active" : ""}`}
              onClick={() => setTab("PENDING")}
              type="button"
            >
              Pending ({pending.length})
            </button>

            <button
              className={`cmbTab ${tab === "ACCEPTED" ? "cmbTab--active" : ""}`}
              onClick={() => setTab("ACCEPTED")}
              type="button"
            >
              Accepted / Pay ({accepted.length})
            </button>

            <button
              className={`cmbTab ${tab === "PAID" ? "cmbTab--active" : ""}`}
              onClick={() => setTab("PAID")}
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

        {/* State */}
        {err && (
          <div className="cmbState cmbState--error">
            <FiAlertTriangle /> {err}
          </div>
        )}

        {payErr && (
          <div className="cmbState cmbState--error">
            <FiAlertTriangle /> {payErr}
          </div>
        )}

        {payOk && (
          <div className="cmbState cmbState--success">
            <FiCheckCircle /> {payOk}
          </div>
        )}

        {/* List */}
        <section className="cmbList">
          {loading && <div className="cmbEmpty">Loading your bookings...</div>}

          {!loading && !err && visible.length === 0 && (
            <div className="cmbEmpty">No bookings in this category.</div>
          )}

          {!loading &&
            !err &&
            visible.map((b) => {
              const cached = artistMap[b.artistUid];
              const artistName = cached?.name || "Artist";
              const artistPhoto =
                cached?.photoURL || "https://via.placeholder.com/56";

              const payAllowed =
                b.status === "ACCEPTED" &&
                (b.paymentStatus === "UNPAID" || !b.paymentStatus);

              const reviewAllowed =
                (b.paymentStatus === "PAID" || b.status === "CONFIRMED") &&
                b.status !== "CANCELLED" &&
                b.status !== "REJECTED";

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
                          WRITE REVIEW
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </section>

        {/* Review modal */}
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
                  <select
                    className="cmbSelect"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Okay</option>
                    <option value={2}>2 - Bad</option>
                    <option value={1}>1 - Very Bad</option>
                  </select>
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

                {reviewErr && (
                  <div className="cmbState cmbState--error">
                    <FiAlertTriangle /> {reviewErr}
                  </div>
                )}

                {reviewOk && (
                  <div className="cmbState cmbState--success">
                    <FiCheckCircle /> {reviewOk}
                  </div>
                )}

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