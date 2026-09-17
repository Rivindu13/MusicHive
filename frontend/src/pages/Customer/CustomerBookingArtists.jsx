import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";

import "../Artist/styles/ArtistDashboard.css";
import "./Styles/CustomerBookingArtists.css";

import {
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
  FiCheckCircle,
  FiAlertTriangle,
  FiInfo,
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
  if (status === "HELD_BY_ME") return "Held by you";
  if (status === "RESERVED") return "Reserved";
  return status || "Open";
}

function formatMMSS(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function hasValidArtistPrice(artist) {
  const price = artist?.artistProfile?.pricePerHour;
  return typeof price === "number" && !Number.isNaN(price) && price > 0;
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

  const profile =
    location.state?.profile ||
    JSON.parse(localStorage.getItem("profile")) ||
    null;

  const preopenArtistUid = location.state?.openArtistUid || null;
  const autoShowAvailability = !!location.state?.autoShowAvailability;

  const profilePic = profile?.photoURL || null;
  const fullName =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    profile?.customerName ||
    "Customer";

  const currentUid = profile?.uid || null;

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All Genres");
  const [category, setCategory] = useState("all");
  const [instrument, setInstrument] = useState("All Instruments");
  const [priceRange, setPriceRange] = useState("all");

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [wishlist, setWishlist] = useState([]);
  const [wishlistBusyUid, setWishlistBusyUid] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openUid, setOpenUid] = useState(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState("");
  const [selectedArtist, setSelectedArtist] = useState(null);

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsErr, setReviewsErr] = useState("");
  const [summary, setSummary] = useState({ avgRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState([]);

  const [showAvailability, setShowAvailability] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsErr, setSlotsErr] = useState("");
  const [slots, setSlots] = useState([]);

  const [heldSlotId, setHeldSlotId] = useState(null);
  const [heldUntil, setHeldUntil] = useState(null);
  const [heldArtistUid, setHeldArtistUid] = useState(null);
  const [holdErr, setHoldErr] = useState("");
  const [holding, setHolding] = useState(false);
  const [holdLeftMs, setHoldLeftMs] = useState(0);

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

  const isHoldForOpenArtist =
    !!heldSlotId && !!heldArtistUid && !!openUid && heldArtistUid === openUid;

  async function getIdTokenOrThrow() {
    const user = auth.currentUser;
    if (!user) throw new Error("You are not logged in.");
    return await user.getIdToken();
  }

  function isWished(artistUid) {
    return wishlist.includes(artistUid);
  }

  async function loadWishlist(uid = currentUid) {
    if (!uid) return;

    try {
      const token = await getIdTokenOrThrow();
      const res = await fetch(`${API_BASE}/api/users/${uid}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load wishlist");
      }

      setWishlist(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Failed to load wishlist:", err);
      setWishlist([]);
    }
  }

  async function toggleWishlist(artistUid) {
    if (!currentUid) {
      triggerToast("Please log in first", "warning");
      return;
    }

    if (!artistUid) return;

    setWishlistBusyUid(artistUid);
    try {
      const token = await getIdTokenOrThrow();
      const res = await fetch(`${API_BASE}/api/users/wishlist/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid: currentUid,
          artistUid,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update wishlist");
      }

      const nextWishlist = Array.isArray(data.data) ? data.data : [];
      const isNowWished = nextWishlist.includes(artistUid);
      triggerToast(
        isNowWished ? "Added to wishlist!" : "Removed from wishlist",
        "info"
      );

      setWishlist(nextWishlist);
    } catch (err) {
      console.error("Failed to toggle wishlist:", err);
      triggerToast(err.message || "Failed to update wishlist", "error");
    } finally {
      setWishlistBusyUid(null);
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (currentUid) {
      loadWishlist(currentUid);
    }
  }, [currentUid]);

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

  useEffect(() => {
    let debounce = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (genre && genre !== "All Genres") params.set("genre", genre);
        if (instrument && instrument !== "All Instruments") params.set("instrument", instrument);
        if (category && category !== "all") params.set("category", category);
        if (priceRange === "under5000") {
          params.set("maxPrice", "5000");
        } else if (priceRange === "5000-15000") {
          params.set("minPrice", "5000");
          params.set("maxPrice", "15000");
        } else if (priceRange === "above15000") {
          params.set("minPrice", "15000");
        }
        if (search.trim()) params.set("search", search.trim());
        params.set("onlyComplete", "true");

        const res = await fetch(
          `${API_BASE}/api/users/artists?${params.toString()}`
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to load artists");
        }

        const fetchedArtists = Array.isArray(data.data) ? data.data : [];
        const artistsWithPrice = fetchedArtists.filter(hasValidArtistPrice);

        setArtists(artistsWithPrice);
      } catch (err) {
        setArtists([]);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [search, genre, category, instrument, priceRange]);

  async function fetchMyHeldSlots() {
    try {
      const idToken = await getIdTokenOrThrow();
      const res = await fetch(`${API_BASE}/api/availability/mine/held`, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data.success) return [];
      return Array.isArray(data.data) ? data.data : [];
    } catch {
      return [];
    }
  }

  async function refreshAvailability(uid = openUid) {
    if (!uid) return;
    try {
      const idToken = await getIdTokenOrThrow();
      const res = await fetch(
        `${API_BASE}/api/availability/artist/${uid}?from=${availabilityRange.from}&to=${availabilityRange.to}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        const nextSlots = Array.isArray(data.data) ? data.data : [];
        setSlots(nextSlots);

        const mine = nextSlots.find((s) => s.statusForUser === "HELD_BY_ME");
        if (mine) {
          setHeldSlotId(mine._id);
          setHeldUntil(mine.heldUntil);
          setHeldArtistUid(mine.artistUid);
          setSelectedDate(mine.date);
          setSelectedSlotType(mine.slotType);
        }
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
      triggerToast("Slot hold cancelled", "info");
    } catch {}

    if (!slotIdToRelease || slotIdToRelease === heldSlotId) {
      setHeldSlotId(null);
      setHeldUntil(null);
      setHeldArtistUid(null);
      setHoldLeftMs(0);
      setSelectedDate(null);
      setSelectedSlotType(null);
    }
  }

  const closeDrawer = ({ keepHold = true } = {}) => {
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

    if (!keepHold) {
      setSelectedDate(null);
      setSelectedSlotType(null);
      setHeldSlotId(null);
      setHeldUntil(null);
      setHeldArtistUid(null);
      setHoldLeftMs(0);
    }

    setHoldErr("");
    setHolding(false);
  };

  async function openDrawerFor(uid) {
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
      setProfileLoading(false);
    }
  }

  async function loadAvailabilityForArtist(uid) {
    if (!uid) return;

    setShowAvailability(true);
    setSlotsLoading(true);
    setSlotsErr("");
    setHoldErr("");

    try {
      const idToken = await getIdTokenOrThrow();
      await fetch(`${API_BASE}/api/availability/ensure`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ artistUid: uid, daysAhead: 14 }),
      });

      const res = await fetch(
        `${API_BASE}/api/availability/artist/${uid}?from=${availabilityRange.from}&to=${availabilityRange.to}`,
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load availability");
      }

      const nextSlots = Array.isArray(data.data) ? data.data : [];
      setSlots(nextSlots);

      const mine = nextSlots.find((s) => s.statusForUser === "HELD_BY_ME");
      if (mine) {
        setHeldSlotId(mine._id);
        setHeldUntil(mine.heldUntil);
        setHeldArtistUid(mine.artistUid);
        setSelectedDate(mine.date);
        setSelectedSlotType(mine.slotType);
      }
    } catch (e) {
      setSlots([]);
      setSlotsErr(e.message || "Failed to load availability");
      triggerToast(e.message || "Failed to load availability", "error");
    } finally {
      setSlotsLoading(false);
    }
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDrawer({ keepHold: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const onOverlayClick = (e) => {
    if (e.target.classList.contains("cbaDrawerOverlay")) {
      closeDrawer({ keepHold: true });
    }
  };

  async function holdSlot(slotObj) {
    if (!slotObj?._id) return;

    setHoldErr("");
    setHolding(true);

    try {
      const idToken = await getIdTokenOrThrow();

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
      setHeldArtistUid(openUid);
      setSelectedDate(updated.date);
      setSelectedSlotType(updated.slotType);

      triggerToast("Slot held for 10 minutes!", "success");
      await refreshAvailability(openUid);
    } catch (e) {
      const msg = e.message || "Could not hold slot";
      setHoldErr(msg);
      triggerToast(msg, "error");
      await refreshAvailability(openUid);
    } finally {
      setHolding(false);
    }
  }

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
        triggerToast("Your slot hold has expired.", "warning");
        setHeldSlotId(null);
        setHeldUntil(null);
        setHeldArtistUid(null);
        setSelectedDate(null);
        setSelectedSlotType(null);
        refreshAvailability(openUid);
      }
    };

    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [heldUntil, openUid]);

  useEffect(() => {
    (async () => {
      const mine = await fetchMyHeldSlots();
      if (!mine.length) return;

      const first = mine[0];
      setHeldSlotId(first._id);
      setHeldUntil(first.heldUntil);
      setHeldArtistUid(first.artistUid);
      setSelectedDate(first.date);
      setSelectedSlotType(first.slotType);

      if (first.artistUid) {
        await openDrawerFor(first.artistUid);
        await loadAvailabilityForArtist(first.artistUid);
      }
    })();
  }, []);

  useEffect(() => {
    if (!preopenArtistUid) return;

    const run = async () => {
      await openDrawerFor(preopenArtistUid);

      if (autoShowAvailability) {
        await loadAvailabilityForArtist(preopenArtistUid);
      }

      navigate(location.pathname, {
        replace: true,
        state: { profile },
      });
    };

    run();
  }, [
    preopenArtistUid,
    autoShowAvailability,
    navigate,
    location.pathname,
    profile,
  ]);

  return (
    <div className="artistDash customerBookingArtistsPage">
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
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Filter by Category"
              >
                <option value="all">All Roles</option>
                <option value="artist">Solo Musicians</option>
                <option value="band">Bands</option>
              </select>
              <FiChevronDown className="cbaSelect__chev" />
            </div>

            <div className="cbaSelectWrap">
              <select
                className="cbaSelect"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                aria-label="Filter by Genre"
              >
                <option>All Genres</option>
                <option>Pop</option>
                <option>Rock</option>
                <option>Jazz</option>
                <option>Classical</option>
              </select>
              <FiChevronDown className="cbaSelect__chev" />
            </div>

            <div className="cbaSelectWrap">
              <select
                className="cbaSelect"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                aria-label="Filter by Instrument"
              >
                <option>All Instruments</option>
                <option>Guitar</option>
                <option>Drums</option>
                <option>Piano / Keyboard</option>
                <option>Vocals</option>
                <option>Bass</option>
                <option>Violin</option>
                <option>Saxophone</option>
                <option>Flute</option>
                <option>Traditional</option>
              </select>
              <FiChevronDown className="cbaSelect__chev" />
            </div>

            <div className="cbaSelectWrap">
              <select
                className="cbaSelect"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                aria-label="Filter by Price"
              >
                <option value="all">All Prices</option>
                <option value="under5000">Under Rs. 5,000</option>
                <option value="5000-15000">Rs. 5,000 - 15,000</option>
                <option value="above15000">Above Rs. 15,000</option>
              </select>
              <FiChevronDown className="cbaSelect__chev" />
            </div>
          </div>
        </section>

        <section className="cbaGrid">
          {loading && <div className="cbaEmpty">Loading artists...</div>}
          {!loading && error && <div className="cbaEmpty">{error}</div>}
          {!loading && !error && artists.length === 0 && (
            <div className="cbaEmpty">
              No artists with pricing found. Try another search.
            </div>
          )}

          {!loading && !error &&
            artists.map((a) => {
              const price = `LKR ${a.artistProfile.pricePerHour.toLocaleString()} per event`;
              const wished = isWished(a.uid);
              const busy = wishlistBusyUid === a.uid;

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
                          type="button"
                          className={`cbaWishBtn ${wished ? "cbaWishBtn--active" : ""}`}
                          onClick={() => toggleWishlist(a.uid)}
                          disabled={busy}
                          title={wished ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <FiHeart />
                        </button>

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

        <footer className="artistDash__footer">
          <div>© 2026 MusicHive. All rights reserved.</div>
          <div className="artistDash__footerLinks">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </footer>
      </main>

      {drawerOpen && (
        <div className="cbaDrawerOverlay" onMouseDown={onOverlayClick}>
          <aside className="cbaDrawer" role="dialog" aria-modal="true">
            <div className="cbaDrawer__top">
              <div className="cbaDrawer__title">Profile Information</div>
              <button
                className="cbaDrawer__close"
                type="button"
                onClick={() => closeDrawer({ keepHold: true })}
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
                    <div className="cbaProfileNameRow">
                      <div className="cbaProfileName">{selectedArtist.name || "Artist"}</div>

                      <button
                        type="button"
                        className={`cbaWishBtn cbaWishBtn--drawer ${
                          isWished(selectedArtist.uid) ? "cbaWishBtn--active" : ""
                        }`}
                        onClick={() => toggleWishlist(selectedArtist.uid)}
                        disabled={wishlistBusyUid === selectedArtist.uid}
                        title={
                          isWished(selectedArtist.uid)
                            ? "Remove from wishlist"
                            : "Add to wishlist"
                        }
                      >
                        <FiHeart />
                      </button>
                    </div>

                    <div className="cbaProfileSub">
                      {(selectedArtist.role || "").toUpperCase()}{" "}
                      {selectedArtist.artistProfile?.location
                        ? `• ${selectedArtist.artistProfile.location}`
                        : ""}
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
                    <div className="cbaField__label">Price per event:</div>
                    <div className="cbaField__value">
                      {typeof selectedArtist?.artistProfile?.pricePerHour === "number"
                        ? `LKR ${selectedArtist.artistProfile.pricePerHour.toLocaleString()} per event`
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

                      if (!isHoldForOpenArtist || !heldUntil || holdLeftMs <= 0) {
                        triggerToast(
                          "Please select a slot held by you for this artist first.",
                          "warning"
                        );
                        return;
                      }

                      const heldUntilISO = new Date(heldUntil).toISOString();

                      closeDrawer({ keepHold: true });

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

                  <button
                    className="cbaBigBtn cbaBigBtn--outline"
                    type="button"
                    onClick={async () => {
                      if (!isHoldForOpenArtist || !heldSlotId) return;
                      await releaseHeldSlot(heldSlotId);
                      await refreshAvailability(openUid);
                    }}
                    disabled={!isHoldForOpenArtist || holding}
                  >
                    CANCEL HOLD
                  </button>
                </div>

                {isHoldForOpenArtist && heldUntil && holdLeftMs > 0 && (
                  <div className="cbaDrawer__state">
                    Held for you ({formatMMSS(holdLeftMs)} left) - 10 minutes
                  </div>
                )}
                {holdErr && <div className="cbaDrawer__state">{holdErr}</div>}

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

                          const morningStatus = morning?.statusForUser || morning?.status || "OPEN";
                          const eveningStatus = evening?.statusForUser || evening?.status || "OPEN";

                          const isMyMorningHold = morningStatus === "HELD_BY_ME";
                          const isMyEveningHold = eveningStatus === "HELD_BY_ME";

                          const canPickMorning = morningStatus === "OPEN" || isMyMorningHold;
                          const canPickEvening = eveningStatus === "OPEN" || isMyEveningHold;

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
                                  className={`cbaSlotPill cbaSlotPill--${String(
                                    morning?.status || "OPEN"
                                  ).toLowerCase()} ${
                                    isSelectedMorning ? "cbaSlotPill--selected" : ""
                                  } ${!canPickMorning ? "cbaSlotPill--disabledUi" : ""}`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    if (!canPickMorning) return;

                                    if (isMyMorningHold) {
                                      setHeldSlotId(morning._id);
                                      setHeldUntil(morning.heldUntil);
                                      setHeldArtistUid(morning.artistUid);
                                      setSelectedDate(morning.date);
                                      setSelectedSlotType(morning.slotType);
                                      return;
                                    }

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
                                  className={`cbaSlotPill cbaSlotPill--${String(
                                    evening?.status || "OPEN"
                                  ).toLowerCase()} ${
                                    isSelectedEvening ? "cbaSlotPill--selected" : ""
                                  } ${!canPickEvening ? "cbaSlotPill--disabledUi" : ""}`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => {
                                    if (!canPickEvening) return;

                                    if (isMyEveningHold) {
                                      setHeldSlotId(evening._id);
                                      setHeldUntil(evening.heldUntil);
                                      setHeldArtistUid(evening.artistUid);
                                      setSelectedDate(evening.date);
                                      setSelectedSlotType(evening.slotType);
                                      return;
                                    }

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