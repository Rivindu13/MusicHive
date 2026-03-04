// CustomerBookingPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../Artist/styles/ArtistDashboard.css";
import "./Styles/CustomerBookingPage.css";

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiHeart,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const API_BASE = "http://localhost:5000";

/* helpers */
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
function statusLabel(status) {
  if (status === "OPEN") return "Open";
  if (status === "DISABLED") return "Disabled";
  if (status === "BOOKED") return "Booked";
  if (status === "HELD") return "Held";
  return status || "Open";
}
function slotTypeLabel(t) {
  return t === "MORNING" ? "Morning" : t === "EVENING" ? "Evening" : t;
}

export default function CustomerBookingPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const profile = useMemo(() => {
    return (
      location.state?.profile ||
      JSON.parse(localStorage.getItem("profile")) ||
      null
    );
  }, [location.state]);

  const profilePic = profile?.photoURL || null;
  const fullName =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    profile?.customerName ||
    "Customer";

  // coming from drawer
  const artistUid = location.state?.artistUid || null;
  const artist = location.state?.artist || null;

  const initialDate = location.state?.date || null;
  const initialSlotType = location.state?.slotType || null;

  // route guard
  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) navigate("/", { replace: true });

    if (!artistUid) {
      // if user refreshes page, state is lost → go back
      navigate("/customer/book-artists", { replace: true });
    }
  }, [artistUid, navigate]);

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

  // availability range
  const range = useMemo(() => {
    const from = ymd(addDays(new Date(), 1));
    const to = ymd(addDays(new Date(), 14));
    return { from, to };
  }, []);

  // === NEW: hide slots by default, expand only when needed ===
  const [showSlots, setShowSlots] = useState(false);
  const [hasLoadedSlots, setHasLoadedSlots] = useState(false);

  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsErr, setSlotsErr] = useState("");
  const [slots, setSlots] = useState([]);

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSlotType, setSelectedSlotType] = useState(initialSlotType);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, { MORNING: null, EVENING: null });
      map.get(s.date)[s.slotType] = s;
    }
    const dates = Array.from(map.keys()).sort();
    return dates.map((d) => ({ date: d, ...map.get(d) }));
  }, [slots]);

  // booking form state
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [success, setSuccess] = useState(null); // { bookingId, status }

  // get firebase id token
  async function getIdTokenOrThrow() {
    const user = auth.currentUser;
    if (!user) throw new Error("You are not logged in.");
    const token = await user.getIdToken();
    return token;
  }

  async function fetchAvailabilityOnce() {
    if (!artistUid) return;
    if (hasLoadedSlots) return;

    setSlotsLoading(true);
    setSlotsErr("");

    try {
      // ensure 14 days exist
      await fetch(`${API_BASE}/api/availability/ensure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistUid, daysAhead: 14 }),
      });

      const res = await fetch(
        `${API_BASE}/api/availability/artist/${artistUid}?from=${range.from}&to=${range.to}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load availability");
      }

      setSlots(Array.isArray(data.data) ? data.data : []);
      setHasLoadedSlots(true);
    } catch (e) {
      setSlots([]);
      setSlotsErr(e.message || "Failed to load availability");
    } finally {
      setSlotsLoading(false);
    }
  }

  // ✅ OPTIMIZED: load availability ONLY when expanded (or if no initial selection)
  useEffect(() => {
    if (!artistUid) return;

    // If user arrived without selection, we should open + load slots to let them pick
    if (!selectedDate || !selectedSlotType) {
      setShowSlots(true);
      fetchAvailabilityOnce();
      return;
    }

    // Otherwise, load only when user expands
    if (showSlots) fetchAvailabilityOnce();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistUid, showSlots]);

  async function refreshAvailability() {
    if (!artistUid) return;
    try {
      const r2 = await fetch(
        `${API_BASE}/api/availability/artist/${artistUid}?from=${range.from}&to=${range.to}`
      );
      const d2 = await r2.json();
      if (r2.ok && d2.success) {
        setSlots(Array.isArray(d2.data) ? d2.data : []);
        setHasLoadedSlots(true);
      }
    } catch {}
  }

  async function submitBooking() {
    setSubmitErr("");
    setSuccess(null);

    if (!artistUid) return;

    if (!selectedDate || !selectedSlotType) {
      setSubmitErr("Please select an available date & slot.");
      setShowSlots(true);
      await fetchAvailabilityOnce();
      return;
    }

    try {
      setSubmitting(true);

      const idToken = await getIdTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/bookings/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          artistUid,
          date: selectedDate,
          slotType: selectedSlotType,
          note: note || "",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Booking failed");
      }

      const booking = data?.data?.booking;
      setSuccess({
        bookingId: booking?._id,
        status: booking?.status || "PENDING",
      });

      // refresh availability after hold
      await refreshAvailability();
    } catch (e) {
      setSubmitErr(e.message || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  function pickSlot(date, slotType, status) {
    if (status !== "OPEN") return;
    setSelectedDate(date);
    setSelectedSlotType(slotType);
  }

  const priceText =
    typeof artist?.artistProfile?.pricePerHour === "number"
      ? `LKR ${artist.artistProfile.pricePerHour.toLocaleString()} / hour`
      : "Price not set";

  return (
    <div className="artistDash customerBookingPage">
      {/* Sidebar */}
      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <Link className="artistDash__navItem" to="/customer/dashboard">
            <span className="artistDash__navIcon">
              <FiHome />
            </span>
            <span>Overview</span>
          </Link>

          <Link
            className="artistDash__navItem artistDash__navItem--active"
            to="/customer/book-artists"
          >
            <span className="artistDash__navIcon">
              <FiCalendar />
            </span>
            <span>Booking Artists</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/chords">
            <span className="artistDash__navIcon">
              <FiMusic />
            </span>
            <span>My Chords</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/reviews">
            <span className="artistDash__navIcon">
              <FiStar />
            </span>
            <span>Reviews</span>
          </Link>
        </nav>

        <div className="artistDash__sideBottom">
          <Link className="artistDash__sideAction" to="/customer/profile">
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

      {/* Main */}
      <main className="artistDash__main">
        {/* Top bar */}
        <div className="artistDash__topbar">
          <button className="artistDash__iconBtn">
            <FiBell />
          </button>
          <button className="artistDash__iconBtn">
            <FiHeart />
          </button>

          <div className="artistDash__user">
            <div className="artistDash__avatarWrap">
              <div
                className="artistDash__avatar"
                style={
                  profilePic ? { backgroundImage: `url(${profilePic})` } : {}
                }
              />
              <span className="artistDash__onlineDot" />
            </div>
            <span className="artistDash__userName">{fullName}</span>
          </div>
        </div>

        {/* Header */}
        <section className="cbpHeader">
          <button
            className="cbpBack"
            type="button"
            onClick={() => navigate(-1)}
          >
            <FiArrowLeft /> Back
          </button>

          <div className="cbpTitleWrap">
            <h1 className="cbpTitle">Confirm Booking</h1>
            <div className="cbpSub">
              You can request booking now. Change time only if needed.
            </div>
          </div>
        </section>

        {/* Artist summary card */}
        <section className="cbpArtistCard">
          <div
            className="cbpArtistImg"
            style={{
              backgroundImage: `url(${
                artist?.photoURL || "https://via.placeholder.com/120"
              })`,
            }}
          />

          <div className="cbpArtistInfo">
            <div className="cbpArtistName">{artist?.name || "Artist"}</div>
            <div className="cbpArtistMeta">
              {(artist?.role || "").toUpperCase()}
              {artist?.artistProfile?.location
                ? ` • ${artist.artistProfile.location}`
                : ""}
            </div>
            <div className="cbpArtistMeta">
              {artist?.artistProfile?.genres?.length
                ? artist.artistProfile.genres.join(", ")
                : "No genres"}
            </div>
            <div className="cbpArtistPrice">{priceText}</div>
          </div>
        </section>

        {/* ✅ Selected slot summary + optional expansion */}
        <section className="cbpSection">
          <div className="cbpSectionTop">
            <div className="cbpSectionTitle">Selected Slot</div>

            <button
              type="button"
              className="cbpGhostBtn"
              onClick={async () => {
                const next = !showSlots;
                setShowSlots(next);
                if (next) await fetchAvailabilityOnce();
              }}
            >
              {showSlots ? "Hide" : "Change time"}
            </button>
          </div>

          <div className="cbpSelectedCard">
            <div className="cbpSelectedMain">
              {selectedDate && selectedSlotType ? (
                <>
                  <div className="cbpSelectedBig">
                    {humanDate(selectedDate)} • {slotTypeLabel(selectedSlotType)}
                  </div>
                  <div className="cbpSelectedSmall">
                    If you want a different time, click “Change time”.
                  </div>
                </>
              ) : (
                <>
                  <div className="cbpSelectedBig">No slot selected</div>
                  <div className="cbpSelectedSmall">
                    Expand and pick an OPEN slot.
                  </div>
                </>
              )}
            </div>

            {!selectedDate || !selectedSlotType ? (
              <button
                type="button"
                className="cbpMiniPrimary"
                onClick={async () => {
                  setShowSlots(true);
                  await fetchAvailabilityOnce();
                }}
              >
                Select time
              </button>
            ) : null}
          </div>

          {showSlots && (
            <div className="cbpSlotsWrap">
              <div className="cbpMiniHint">
                Availability • {humanDate(range.from)} → {humanDate(range.to)}{" "}
                (only OPEN slots are selectable)
              </div>

              {slotsLoading && (
                <div className="cbpState">Loading availability...</div>
              )}

              {!slotsLoading && slotsErr && (
                <div className="cbpState cbpState--error">
                  <FiAlertTriangle /> {slotsErr}
                </div>
              )}

              {!slotsLoading && !slotsErr && grouped.length === 0 && (
                <div className="cbpState">No slots found.</div>
              )}

              {!slotsLoading && !slotsErr && grouped.length > 0 && (
                <div className="cbpAvailList">
                  {grouped.map((row) => {
                    const mStatus = row.MORNING?.status || "OPEN";
                    const eStatus = row.EVENING?.status || "OPEN";

                    return (
                      <div className="cbpAvailRow" key={row.date}>
                        <div className="cbpAvailDate">
                          <div className="cbpAvailDay">{humanDate(row.date)}</div>
                          <div className="cbpAvailYmd">{row.date}</div>
                        </div>

                        <div className="cbpAvailSlots">
                          <button
                            type="button"
                            className={`cbpSlot ${
                              mStatus !== "OPEN" ? "cbpSlot--disabled" : ""
                            } ${
                              selectedDate === row.date &&
                              selectedSlotType === "MORNING"
                                ? "cbpSlot--selected"
                                : ""
                            }`}
                            onClick={() => {
                              pickSlot(row.date, "MORNING", mStatus);
                              if (mStatus === "OPEN") setShowSlots(false); // auto close
                            }}
                            disabled={mStatus !== "OPEN"}
                            title={statusLabel(mStatus)}
                          >
                            <div className="cbpSlotTitle">Morning</div>
                            <div className="cbpSlotMeta">
                              {(row.MORNING?.startTime || "09:00")}–{(row.MORNING?.endTime || "12:00")}
                              <span className="cbpDot">•</span>
                              {statusLabel(mStatus)}
                            </div>
                          </button>

                          <button
                            type="button"
                            className={`cbpSlot ${
                              eStatus !== "OPEN" ? "cbpSlot--disabled" : ""
                            } ${
                              selectedDate === row.date &&
                              selectedSlotType === "EVENING"
                                ? "cbpSlot--selected"
                                : ""
                            }`}
                            onClick={() => {
                              pickSlot(row.date, "EVENING", eStatus);
                              if (eStatus === "OPEN") setShowSlots(false); // auto close
                            }}
                            disabled={eStatus !== "OPEN"}
                            title={statusLabel(eStatus)}
                          >
                            <div className="cbpSlotTitle">Evening</div>
                            <div className="cbpSlotMeta">
                              {(row.EVENING?.startTime || "18:00")}–{(row.EVENING?.endTime || "21:00")}
                              <span className="cbpDot">•</span>
                              {statusLabel(eStatus)}
                            </div>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Note + Submit */}
        <section className="cbpSection">
          <div className="cbpSectionTitle">Booking Note</div>

          <textarea
            className="cbpNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note to the artist (optional)..."
            rows={4}
          />

          <div className="cbpSummaryRow">
            <div className="cbpChosen">
              <div className="cbpChosenLabel">Selected Slot</div>
              <div className="cbpChosenValue">
                {selectedDate && selectedSlotType
                  ? `${humanDate(selectedDate)} • ${slotTypeLabel(selectedSlotType)}`
                  : "Not selected"}
              </div>
            </div>

            <button
              type="button"
              className="cbpSubmit"
              onClick={submitBooking}
              disabled={submitting || !selectedDate || !selectedSlotType}
            >
              {submitting ? "REQUESTING..." : "REQUEST BOOKING"}
            </button>
          </div>

          {submitErr && (
            <div className="cbpState cbpState--error">
              <FiAlertTriangle /> {submitErr}
            </div>
          )}

          {success && (
            <div className="cbpState cbpState--success">
              <FiCheckCircle /> Booking created: <b>{success.bookingId}</b> •
              Status: <b>{success.status}</b>
            </div>
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