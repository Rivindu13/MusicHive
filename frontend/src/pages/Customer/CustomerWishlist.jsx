import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import "../Artist/styles/ArtistDashboard.css";
import "./Styles/CustomerWishlist.css";

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiHeart,
  FiX,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const API_BASE = "http://localhost:5000";

function Stars({ value = 0 }) {
  const v = Math.max(0, Math.min(5, Number(value || 0)));
  const full = Math.floor(v);
  const half = v - full >= 0.5;

  return (
    <div className="cwStars" aria-label={`Rating ${v} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= full;
        const isHalf = !filled && half && i === full + 1;

        return (
          <span
            key={i}
            className={`cwStar ${filled ? "cwStar--full" : ""} ${
              isHalf ? "cwStar--half" : ""
            }`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

export default function CustomerWishlist() {
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

  const currentUid = profile?.uid || null;

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [busyUid, setBusyUid] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErr, setProfileErr] = useState("");

  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsErr, setReviewsErr] = useState("");
  const [summary, setSummary] = useState({ avgRating: 0, totalReviews: 0 });
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (currentUid) {
      loadWishlistArtists(currentUid);
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

  async function loadWishlistArtists(uid = currentUid) {
    if (!uid) return;

    setLoading(true);
    setError("");

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You are not logged in.");
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/api/users/${uid}/wishlist/artists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load wishlist");
      }

      setArtists(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      console.error("Failed to load wishlist artists:", err);
      setArtists([]);
      setError(err.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  async function removeFromWishlist(artistUid) {
    if (!currentUid || !artistUid) return;

    setBusyUid(artistUid);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("You are not logged in.");
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_BASE}/api/users/wishlist/remove`, {
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
        throw new Error(data.message || "Failed to remove from wishlist");
      }

      setArtists((prev) => prev.filter((artist) => artist.uid !== artistUid));

      if (selectedArtist?.uid === artistUid) {
        closeDrawer();
      }
    } catch (err) {
      console.error("Failed to remove from wishlist:", err);
      alert(err.message || "Failed to remove from wishlist");
    } finally {
      setBusyUid(null);
    }
  }

  async function openDrawerFor(uid) {
    setDrawerOpen(true);
    setSelectedArtist(null);
    setProfileErr("");
    setReviewsErr("");
    setReviews([]);
    setSummary({ avgRating: 0, totalReviews: 0 });

    setProfileLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${uid}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load profile");
      }

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

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load reviews");
      }

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

  function closeDrawer() {
    setDrawerOpen(false);
    setSelectedArtist(null);
    setProfileErr("");
    setReviewsErr("");
    setReviews([]);
    setSummary({ avgRating: 0, totalReviews: 0 });
  }

  useEffect(() => {
    if (!drawerOpen) return;

    const onKey = (e) => {
      if (e.key === "Escape") closeDrawer();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const onOverlayClick = (e) => {
    if (e.target.classList.contains("cwDrawerOverlay")) {
      closeDrawer();
    }
  };

  return (
    <div className="artistDash customerWishlistPage">
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

          <Link className="artistDash__navItem" to="/customer/book-artists">
            <span className="artistDash__navIcon">
              <FiCalendar />
            </span>
            <span>Booking Artists</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/my-bookings">
            <span className="artistDash__navIcon">
              <FiCalendar />
            </span>
            <span>My Bookings</span>
          </Link>

          <Link className="artistDash__navItem" to="/customer/chords">
            <span className="artistDash__navIcon">
              <FiMusic />
            </span>
            <span>Chord Library</span>
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

        <section className="cwHeader">
          <h1 className="cwTitle">My Wishlist</h1>
          <p className="cwSub">Artists and bands you saved for later.</p>
        </section>

        <section className="cwGrid">
          {loading && <div className="cwEmpty">Loading wishlist...</div>}

          {!loading && error && <div className="cwEmpty">{error}</div>}

          {!loading && !error && artists.length === 0 && (
            <div className="cwEmpty">
              No saved artists yet. Go to Booking Artists and tap the heart to
              save some.
            </div>
          )}

          {!loading &&
            !error &&
            artists.map((artist) => {
              const price =
                typeof artist?.artistProfile?.pricePerHour === "number"
                  ? `LKR ${artist.artistProfile.pricePerHour.toLocaleString()} per event`
                  : "Price not set";

              return (
                <article className="cwCard" key={artist.uid}>
                  <div className="cwCard__top">
                    <div className="cwCard__genre">
                      {artist.artistProfile?.genres?.join(", ") || "No genres"}
                    </div>
                  </div>

                  <div className="cwCard__body">
                    <div
                      className="cwCard__img"
                      style={{
                        backgroundImage: `url(${
                          artist.photoURL || "https://via.placeholder.com/150"
                        })`,
                      }}
                    />

                    <div className="cwCard__texts">
                      <div className="cwCard__name">
                        {artist.name || "Unnamed Artist"}
                      </div>

                      <div className="cwCard__meta">
                        {artist.artistProfile?.location || "Location not set"}
                      </div>

                      <div className="cwCard__meta">{price}</div>

                      <div className="cwCard__actions">
                        <button
                          type="button"
                          className="cwWishBtn cwWishBtn--active"
                          onClick={() => removeFromWishlist(artist.uid)}
                          disabled={busyUid === artist.uid}
                          title="Remove from wishlist"
                        >
                          <FiHeart />
                        </button>

                        <button
                          className="cwBtn cwBtn--outline"
                          onClick={() => openDrawerFor(artist.uid)}
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
          <div>© 2025 MusicHive. All rights reserved.</div>
          <div className="artistDash__footerLinks">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </footer>
      </main>

      {drawerOpen && (
        <div className="cwDrawerOverlay" onMouseDown={onOverlayClick}>
          <aside className="cwDrawer" role="dialog" aria-modal="true">
            <div className="cwDrawer__top">
              <div className="cwDrawer__title">Profile Information</div>
              <button
                className="cwDrawer__close"
                type="button"
                onClick={closeDrawer}
              >
                <FiX />
              </button>
            </div>

            {profileLoading && (
              <div className="cwDrawer__state">Loading profile...</div>
            )}
            {!profileLoading && profileErr && (
              <div className="cwDrawer__state">{profileErr}</div>
            )}

            {!profileLoading && !profileErr && selectedArtist && (
              <div className="cwProfileCard">
                <div className="cwProfileCard__head">
                  <div
                    className="cwProfileAvatar"
                    style={{
                      backgroundImage: `url(${
                        selectedArtist.photoURL || "https://via.placeholder.com/150"
                      })`,
                    }}
                  />

                  <div className="cwProfileHeadTexts">
                    <div className="cwProfileNameRow">
                      <div className="cwProfileName">
                        {selectedArtist.name || "Artist"}
                      </div>

                      <button
                        type="button"
                        className="cwWishBtn cwWishBtn--drawer cwWishBtn--active"
                        onClick={() => removeFromWishlist(selectedArtist.uid)}
                        disabled={busyUid === selectedArtist.uid}
                        title="Remove from wishlist"
                      >
                        <FiHeart />
                      </button>
                    </div>

                    <div className="cwProfileSub">
                      {(selectedArtist.role || "").toUpperCase()}{" "}
                      {selectedArtist.artistProfile?.location
                        ? `• ${selectedArtist.artistProfile.location}`
                        : ""}
                    </div>

                    <div className="cwProfileRatingRow">
                      <Stars value={summary.avgRating} />
                      <span className="cwProfileRatingText">
                        {summary.avgRating} ({summary.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cwProfileFields">
                  <div className="cwField">
                    <div className="cwField__label">Email :</div>
                    <div className="cwField__value">
                      {selectedArtist.email || "—"}
                    </div>
                  </div>

                  <div className="cwField">
                    <div className="cwField__label">Bio :</div>
                    <div className="cwField__value cwField__value--box">
                      {selectedArtist.artistProfile?.bio || "—"}
                    </div>
                  </div>

                  <div className="cwField">
                    <div className="cwField__label">Genre :</div>
                    <div className="cwField__value">
                      {selectedArtist.artistProfile?.genres?.length
                        ? selectedArtist.artistProfile.genres.join(", ")
                        : "—"}
                    </div>
                  </div>

                  <div className="cwField">
                    <div className="cwField__label">Instruments :</div>
                    <div className="cwField__value">
                      {selectedArtist.artistProfile?.instruments?.length
                        ? selectedArtist.artistProfile.instruments.join(", ")
                        : "—"}
                    </div>
                  </div>

                  <div className="cwField">
                    <div className="cwField__label">Price per event:</div>
                    <div className="cwField__value">
                      {typeof selectedArtist?.artistProfile?.pricePerHour ===
                      "number"
                        ? `LKR ${selectedArtist.artistProfile.pricePerHour.toLocaleString()} per event`
                        : "—"}
                    </div>
                  </div>
                </div>

                <div className="cwProfileActions">
                  <button
                    className="cwBigBtn cwBigBtn--secondary"
                    type="button"
                    onClick={() =>
                      navigate("/customer/book-artists", {
                        state: {
                          profile,
                          openArtistUid: selectedArtist.uid,
                          autoShowAvailability: true,
                        },
                      })
                    }
                  >
                    GO TO BOOKING PAGE
                  </button>

                  <button
                    className="cwBigBtn cwBigBtn--primary"
                    type="button"
                    onClick={() => removeFromWishlist(selectedArtist.uid)}
                    disabled={busyUid === selectedArtist.uid}
                  >
                    REMOVE
                  </button>
                </div>
              </div>
            )}

            <div className="cwReviewsSection">
              <div className="cwReviewsTitle">
                <FiStar /> Reviews
              </div>

              {reviewsLoading && (
                <div className="cwDrawer__state">Loading reviews...</div>
              )}
              {!reviewsLoading && reviewsErr && (
                <div className="cwDrawer__state">{reviewsErr}</div>
              )}

              {!reviewsLoading && !reviewsErr && reviews.length === 0 && (
                <div className="cwDrawer__state">No reviews yet.</div>
              )}

              {!reviewsLoading && !reviewsErr && reviews.length > 0 && (
                <div className="cwReviewsList">
                  {reviews.map((review) => (
                    <div className="cwReviewCard" key={review._id}>
                      <div className="cwReviewTop">
                        <div
                          className="cwReviewAvatar"
                          style={{
                            backgroundImage: `url(${
                              review.plannerPhotoURL ||
                              "https://via.placeholder.com/40"
                            })`,
                          }}
                        />
                        <div className="cwReviewInfo">
                          <div className="cwReviewName">
                            {review.plannerName}
                          </div>
                          <div className="cwReviewMeta">
                            {review.eventType || "Event"}
                          </div>
                        </div>

                        <div className="cwReviewRating">
                          <Stars value={review.rating} />
                        </div>
                      </div>

                      {review.comment ? (
                        <div className="cwReviewComment">
                          {review.comment}
                        </div>
                      ) : (
                        <div className="cwReviewComment cwReviewComment--muted">
                          — No comment —
                        </div>
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