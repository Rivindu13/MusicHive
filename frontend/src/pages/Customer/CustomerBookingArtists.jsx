import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../Artist/styles/ArtistDashboard.css";
import "./Styles/CustomerBookingArtists.css";

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiHeart,
  FiSearch,
  FiChevronDown,
  FiX,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const API_BASE = "http://localhost:5000";

/* ---------- small helpers ---------- */
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
  if (status === "RESERVED") return "Reserved";
  return status || "Open";
}
function formatMMSS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function Stars({ value = 0 }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  return (
    <div className="cbaStars" aria-label={`Rating ${v} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full;
        const isHalf = !filled && half && i === full + 1;
        return (
          <span
            key={i}
            className={`cbaStar ${filled ? "cbaStar--full" : ""} ${
              isHalf ? "cbaStar--half" : ""
            }`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

export default function CustomerBookingArtists() {
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
    "Customer";

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All Genres");

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== Drawer state =====
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openUid, setOpenUid] = useState(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState("");
  const [selectedArtist, setSelectedArtist] = useState(null);

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsErr, setReviewsErr] = useState("");
  const [summary, setSummary] = useState({ avgRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState([]);

  // ===== Availability state =====
  const [showAvailability, setShowAvailability] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsErr, setSlotsErr] = useState("");
  const [slots, setSlots] = useState([]);

  // held state
  const [heldSlotId, setHeldSlotId] = useState(null);
  const [heldUntil, setHeldUntil] = useState(null);
  const [holdErr, setHoldErr] = useState("");
  const [holding, setHolding] = useState(false);

  const [holdLeftMs, setHoldLeftMs] = useState(0);

  // selection
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlotType, setSelectedSlotType] = useState(null);

  const availabilityRange = useMemo(() => {
    const from = ymd(addDays(new Date(), 1));
    const to = ymd(addDays(new Date(), 14));
    return { from, to };
  }, []);

  const groupedSlots = useMemo(() => {
    const map = new Map();
    for (const s of slots) {
      if (!map.has(s.date)) map.set(s.date, { MORNING: null, EVENING: null });
      map.get(s.date)[s.slotType] = s;
    }
    const dates = Array.from(map.keys()).sort();
    return dates.map((d) => ({ date: d, ...map.get(d) }));
  }, [slots]);

  async function getIdTokenOrThrow() {
    const user = auth.currentUser;
    if (!user) throw new Error("You are not logged in.");
    return await user.getIdToken();
  }

  // route guard
  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) navigate("/", { replace: true });
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

  // Fetch artists
  useEffect(() => {
    let debounce = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (genre && genre !== "All Genres") params.set("genre", genre);
        if (search.trim()) params.set("search", search.trim());
        params.set("onlyComplete", "true");

        const res = await fetch(
          `${API_BASE}/api/users/artists?${params.toString()}`
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load artists");
        }

        setArtists(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setArtists([]);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, genre]);

  async function refreshAvailability(uid = openUid) {
    if (!uid) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/availability/artist/${uid}?from=${availabilityRange.from}&to=${availabilityRange.to}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setSlots(Array.isArray(data.data) ? data.data : []);
      }
    } catch {}
  }

  async function releaseHeldSlot(slotIdToRelease) {
    const slotId = slotIdToRelease || heldSlotId;
    if (!slotId) return;
    try {
      const idToken = await getIdTokenOrThrow();
      await fetch(`${API_BASE}/api/availability/${slotId}/release`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });
    } catch {}
  }

  // ✅ FIXED: closeDrawer with flag
  const closeDrawer = async ({ releaseHold = true } = {}) => {
    if (releaseHold) {
      await releaseHeldSlot();
    }

    setDrawerOpen(false);
    setOpenUid(null);

    setSelectedArtist(null);
    setProfileErr("");
    setReviewsErr("");
    setReviews([]);
    setSummary({ avgRating: 0, totalReviews: 0 });

    setShowAvailability(false);
    setSlots([]);
    setSlotsErr("");

    setSelectedDate(null);
    setSelectedSlotType(null);

    setHeldSlotId(null);
    setHeldUntil(null);
    setHoldLeftMs(0);
    setHoldErr("");
    setHolding(false);
  };

  async function openDrawerFor(uid) {
    // switching artists -> release old hold
    await releaseHeldSlot();

    setDrawerOpen(true);
    setOpenUid(uid);

    setSelectedArtist(null);
    setReviews([]);
    setSummary({ avgRating: 0, totalReviews: 0 });
    setProfileErr("");
    setReviewsErr("");

    setShowAvailability(false);
    setSlots([]);
    setSlotsErr("");

    setSelectedDate(null);
    setSelectedSlotType(null);

    setHeldSlotId(null);
    setHeldUntil(null);
    setHoldLeftMs(0);
    setHoldErr("");
    setHolding(false);

    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${uid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load profile");
      setSelectedArtist(data);
    } catch (e) {
      setSelectedArtist(null);
      setProfileErr(e.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }

    setReviewsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews/artist/${uid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load reviews");

      setSummary(data?.summary || { avgRating: 0, totalReviews: 0 });
      setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
    } catch (e) {
      setSummary({ avgRating: 0, totalReviews: 0 });
      setReviews([]);
      setReviewsErr(e.message || "Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  }

  async function loadAvailabilityForArtist(uid) {
    if (!uid) return;

    setShowAvailability(true);
    setSlotsLoading(true);
    setSlotsErr("");
    setHoldErr("");

    // reset selection + hold on reload
    await releaseHeldSlot();
    setSelectedDate(null);
    setSelectedSlotType(null);
    setHeldSlotId(null);
    setHeldUntil(null);
    setHoldLeftMs(0);

    try {
      await fetch(`${API_BASE}/api/availability/ensure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistUid: uid, daysAhead: 14 }),
      });

      const res = await fetch(
        `${API_BASE}/api/availability/artist/${uid}?from=${availabilityRange.from}&to=${availabilityRange.to}`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load availability");
      }

      setSlots(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setSlots([]);
      setSlotsErr(e.message || "Failed to load availability");
    } finally {
      setSlotsLoading(false);
    }
  }

  // close drawer with ESC
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  const onOverlayClick = (e) => {
    if (e.target.classList.contains("cbaDrawerOverlay")) closeDrawer();
  };

  async function holdSlot(slotObj) {
    if (!slotObj?._id) return;

    setHoldErr("");
    setHolding(true);

    try {
      const idToken = await getIdTokenOrThrow();

      // release old hold if different
      if (heldSlotId && heldSlotId !== slotObj._id) {
        await fetch(`${API_BASE}/api/availability/${heldSlotId}/release`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        });
      }

      const res = await fetch(
        `${API_BASE}/api/availability/${slotObj._id}/hold`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Could not hold slot");
      }

      const updated = data.data;

      setHeldSlotId(updated._id);
      setHeldUntil(updated.heldUntil);
      setSelectedDate(updated.date);
      setSelectedSlotType(updated.slotType);

      await refreshAvailability(openUid);
    } catch (e) {
      setHoldErr(e.message || "Could not hold slot");
      await refreshAvailability(openUid);
    } finally {
      setHolding(false);
    }
  }

  // countdown
  useEffect(() => {
    if (!heldUntil) {
      setHoldLeftMs(0);
      return;
    }

    const target = new Date(heldUntil).getTime();
    const tick = () => {
      const left = target - Date.now();
      setHoldLeftMs(left);

      if (left <= 0) {
        setHeldSlotId(null);
        setHeldUntil(null);
        setSelectedDate(null);
        setSelectedSlotType(null);
        refreshAvailability(openUid);
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heldUntil, openUid]);

  // release on unload (best effort)
  useEffect(() => {
    const onUnload = () => {
      if (!heldSlotId) return;

      try {
        const url = `${API_BASE}/api/availability/${heldSlotId}/release`;
        if (navigator.sendBeacon) {
          const blob = new Blob([], { type: "application/json" });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, { method: "PATCH", keepalive: true }).catch(() => {});
        }
      } catch {}
    };

    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [heldSlotId]);

  return (
    <div className="artistDash customerBookingArtistsPage">
      {/* ===== Sidebar ===== */}
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

          <Link
            className="artistDash__navItem artistDash__navItem--active"
            to="/customer/book-artists"
          >
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

          <button
            type="button"
            className="artistDash__sideAction"
            onClick={handleLogout}
          >
            <span className="artistDash__navIcon"><FiLogOut /></span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* ===== Main ===== */}
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
        <section className="cbaHeader">
          <h1 className="cbaTitle">Book a Band/Artist</h1>

          <div className="cbaFilters">
            <div className="cbaSearch">
              <FiSearch className="cbaSearch__icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search your bands & Artists..."
              />
            </div>

            <div className="cbaSelectWrap">
              <select
                className="cbaSelect"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                <option>All Genres</option>
                <option>Pop</option>
                <option>Rock</option>
                <option>Jazz</option>
                <option>Classical</option>
              </select>
              <FiChevronDown className="cbaSelect__chev" />
            </div>
          </div>
        </section>

        {/* Artist Grid */}
        <section className="cbaGrid">
          {loading && <div className="cbaEmpty">Loading artists...</div>}
          {!loading && error && <div className="cbaEmpty">{error}</div>}
          {!loading && !error && artists.length === 0 && (
            <div className="cbaEmpty">No artists found. Try another search.</div>
          )}

          {!loading && !error &&
            artists.map((a) => {
              const price =
                typeof a?.artistProfile?.pricePerHour === "number"
                  ? `LKR ${a.artistProfile.pricePerHour.toLocaleString()} / hour`
                  : "Price not set";

              return (
                <article className="cbaCard" key={a.uid}>
                  <div className="cbaCard__top">
                    <div className="cbaCard__date">
                      {a.artistProfile?.genres?.join(", ") || "No genres"}
                    </div>
                  </div>

                  <div className="cbaCard__body">
                    <div
                      className="cbaCard__img"
                      style={{
                        backgroundImage: `url(${a.photoURL || "https://via.placeholder.com/150"})`,
                      }}
                    />

                    <div className="cbaCard__texts">
                      <div className="cbaCard__name">{a.name || "Unnamed Artist"}</div>

                      <div className="cbaCard__meta">
                        {a.artistProfile?.location || "Location not set"}
                      </div>

                      <div className="cbaCard__meta">{price}</div>

                      <div className="cbaCard__actions">
                        <button
                          className="cbaBtn cbaBtn--outline"
                          onClick={() => openDrawerFor(a.uid)}
                          type="button"
                        >
                          View Profile
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
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

      {/* ================= Drawer ================= */}
      {drawerOpen && (
        <div className="cbaDrawerOverlay" onMouseDown={onOverlayClick}>
          <aside className="cbaDrawer" role="dialog" aria-modal="true">
            <div className="cbaDrawer__top">
              <div className="cbaDrawer__title">Profile Information</div>
              <button
                className="cbaDrawer__close"
                type="button"
                onClick={() => closeDrawer({ releaseHold: true })}
              >
                <FiX />
              </button>
            </div>

            {profileLoading && <div className="cbaDrawer__state">Loading profile...</div>}
            {!profileLoading && profileErr && <div className="cbaDrawer__state">{profileErr}</div>}

            {!profileLoading && !profileErr && selectedArtist && (
              <div className="cbaProfileCard">
                <div className="cbaProfileCard__head">
                  <div
                    className="cbaProfileAvatar"
                    style={{
                      backgroundImage: `url(${selectedArtist.photoURL || "https://via.placeholder.com/150"})`,
                    }}
                  />
                  <div className="cbaProfileHeadTexts">
                    <div className="cbaProfileName">{selectedArtist.name || "Artist"}</div>
                    <div className="cbaProfileSub">
                      {(selectedArtist.role || "").toUpperCase()}{" "}
                      {selectedArtist.artistProfile?.location ? `• ${selectedArtist.artistProfile.location}` : ""}
                    </div>

                    <div className="cbaProfileRatingRow">
                      <Stars value={summary.avgRating} />
                      <span className="cbaProfileRatingText">
                        {summary.avgRating} ({summary.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cbaProfileFields">
                  <div className="cbaField">
                    <div className="cbaField__label">Email :</div>
                    <div className="cbaField__value">{selectedArtist.email || "—"}</div>
                  </div>

                  <div className="cbaField">
                    <div className="cbaField__label">Bio :</div>
                    <div className="cbaField__value cbaField__value--box">
                      {selectedArtist.artistProfile?.bio || "—"}
                    </div>
                  </div>

                  <div className="cbaField">
                    <div className="cbaField__label">Genre :</div>
                    <div className="cbaField__value">
                      {selectedArtist.artistProfile?.genres?.length
                        ? selectedArtist.artistProfile.genres.join(", ")
                        : "—"}
                    </div>
                  </div>

                  <div className="cbaField">
                    <div className="cbaField__label">Instruments :</div>
                    <div className="cbaField__value">
                      {selectedArtist.artistProfile?.instruments?.length
                        ? selectedArtist.artistProfile.instruments.join(", ")
                        : "—"}
                    </div>
                  </div>

                  <div className="cbaField">
                    <div className="cbaField__label">Price :</div>
                    <div className="cbaField__value">
                      {typeof selectedArtist?.artistProfile?.pricePerHour === "number"
                        ? `LKR ${selectedArtist.artistProfile.pricePerHour.toLocaleString()} / hour`
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="cbaProfileActions">
                  <button
                    className="cbaBigBtn cbaBigBtn--secondary"
                    type="button"
                    onClick={() => loadAvailabilityForArtist(openUid)}
                    disabled={slotsLoading}
                  >
                    {slotsLoading ? "LOADING..." : "CHECK AVAILABILITY"}
                  </button>

                  <button
                    className="cbaBigBtn cbaBigBtn--primary"
                    type="button"
                    onClick={() => {
                      if (!openUid || !selectedArtist) return;

                      if (!heldSlotId || !heldUntil || holdLeftMs <= 0) {
                        alert("Please select an OPEN slot to hold first.");
                        return;
                      }

                      const heldUntilISO = new Date(heldUntil).toISOString();

                      // ✅ IMPORTANT FIX: do NOT release hold when navigating
                      closeDrawer({ releaseHold: false });

                      navigate("/customer/booking", {
                        state: {
                          artistUid: openUid,
                          artist: selectedArtist,
                          slotId: heldSlotId,
                          heldUntil: heldUntilISO,
                          date: selectedDate,
                          slotType: selectedSlotType,
                        },
                      });
                    }}
                    disabled={holding}
                  >
                    BOOK NOW
                  </button>
                </div>

                {/* Hold banner */}
                {heldSlotId && heldUntil && holdLeftMs > 0 && (
                  <div className="cbaDrawer__state">
                    Held for you ({formatMMSS(holdLeftMs)} left) - 10 minutes
                  </div>
                )}
                {holdErr && <div className="cbaDrawer__state">{holdErr}</div>}

                {/* Availability section */}
                {showAvailability && (
                  <div className="cbaAvailWrap">
                    <div className="cbaAvailHeader">
                      <div className="cbaAvailTitle">
                        Availability • {humanDate(availabilityRange.from)} → {humanDate(availabilityRange.to)}
                      </div>

                      <button
                        type="button"
                        className="cbaAvailHide"
                        onClick={() => setShowAvailability(false)}
                      >
                        Hide
                      </button>
                    </div>

                    {slotsErr && <div className="cbaAvailState">{slotsErr}</div>}

                    {!slotsErr && !slotsLoading && groupedSlots.length === 0 && (
                      <div className="cbaAvailState">No slots found in this range.</div>
                    )}

                    {!slotsErr && groupedSlots.length > 0 && (
                      <div className="cbaAvailList">
                        {groupedSlots.map((row) => {
                          const morning = row.MORNING;
                          const evening = row.EVENING;

                          const morningStatus = morning?.status || "OPEN";
                          const eveningStatus = evening?.status || "OPEN";

                          const canPickMorning = morningStatus === "OPEN";
                          const canPickEvening = eveningStatus === "OPEN";

                          const isSelectedMorning =
                            selectedDate === row.date && selectedSlotType === "MORNING";
                          const isSelectedEvening =
                            selectedDate === row.date && selectedSlotType === "EVENING";

                          return (
                            <div className="cbaAvailRow" key={row.date}>
                              <div className="cbaAvailDate">
                                <div className="cbaAvailDay">{humanDate(row.date)}</div>
                                <div className="cbaAvailYmd">{row.date}</div>
                              </div>

                              <div className="cbaAvailSlots">
                                <div
                                  className={`cbaSlotPill cbaSlotPill--${String(morningStatus).toLowerCase()} ${
                                    isSelectedMorning ? "cbaSlotPill--selected" : ""
                                  } ${!canPickMorning ? "cbaSlotPill--disabledUi" : ""}`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    if (!canPickMorning) return;
                                    holdSlot(morning);
                                  }}
                                >
                                  <div className="cbaSlotPill__title">{slotLabel("MORNING")}</div>
                                  <div className="cbaSlotPill__meta">
                                    {(morning?.startTime || "09:00")}–{(morning?.endTime || "12:00")}
                                    <span className="cbaSlotPill__dot">•</span>
                                    {statusLabel(morningStatus)}
                                  </div>
                                </div>

                                <div
                                  className={`cbaSlotPill cbaSlotPill--${String(eveningStatus).toLowerCase()} ${
                                    isSelectedEvening ? "cbaSlotPill--selected" : ""
                                  } ${!canPickEvening ? "cbaSlotPill--disabledUi" : ""}`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    if (!canPickEvening) return;
                                    holdSlot(evening);
                                  }}
                                >
                                  <div className="cbaSlotPill__title">{slotLabel("EVENING")}</div>
                                  <div className="cbaSlotPill__meta">
                                    {(evening?.startTime || "18:00")}–{(evening?.endTime || "21:00")}
                                    <span className="cbaSlotPill__dot">•</span>
                                    {statusLabel(eveningStatus)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reviews */}
            <div className="cbaReviewsSection">
              <div className="cbaReviewsTitle">
                <FiStar /> Reviews
              </div>

              {reviewsLoading && <div className="cbaDrawer__state">Loading reviews...</div>}
              {!reviewsLoading && reviewsErr && <div className="cbaDrawer__state">{reviewsErr}</div>}

              {!reviewsLoading && !reviewsErr && reviews.length === 0 && (
                <div className="cbaDrawer__state">No reviews yet.</div>
              )}

              {!reviewsLoading && !reviewsErr && reviews.length > 0 && (
                <div className="cbaReviewsList">
                  {reviews.map((r) => (
                    <div className="cbaReviewCard" key={r._id}>
                      <div className="cbaReviewTop">
                        <div
                          className="cbaReviewAvatar"
                          style={{
                            backgroundImage: `url(${r.plannerPhotoURL || "https://via.placeholder.com/40"})`,
                          }}
                        />
                        <div className="cbaReviewInfo">
                          <div className="cbaReviewName">{r.plannerName}</div>
                          <div className="cbaReviewMeta">{r.eventType || "Event"}</div>
                        </div>

                        <div className="cbaReviewRating">
                          <Stars value={r.rating} />
                        </div>
                      </div>

                      {r.comment ? (
                        <div className="cbaReviewComment">{r.comment}</div>
                      ) : (
                        <div className="cbaReviewComment cbaReviewComment--muted">— No comment —</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}