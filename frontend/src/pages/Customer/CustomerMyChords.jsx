import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { storage, auth } from "../../firebase";
import { signOut } from "firebase/auth";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiSearch,
  FiUpload,
  FiFileText,
  FiTrash2,
  FiX,
  FiHeart,
  FiDownload,
} from "react-icons/fi";

import "./Styles/CustomerMyChords.css";

const API_BASE = "http://localhost:5000";

export default function CustomerMyChords() {
  const location = useLocation();
  const navigate = useNavigate();

  const profile =
    location.state?.profile ||
    JSON.parse(localStorage.getItem("profile")) ||
    null;

  const uid = profile?.uid;

  const fullName =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    profile?.customerName ||
    "Customer";

  const profilePic = profile?.photoURL || null;

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
      localStorage.removeItem("profile");
      navigate("/", { replace: true });
    }
  };

  const [activeTab, setActiveTab] = useState("my");

  const [genre, setGenre] = useState("All Genres");
  const [search, setSearch] = useState("");

  const [exploreGenre, setExploreGenre] = useState("All Genres");
  const [exploreSearch, setExploreSearch] = useState("");

  const [uploading, setUploading] = useState(false);

  const [chords, setChords] = useState([]);
  const [allChords, setAllChords] = useState([]);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadGenre, setUploadGenre] = useState("Pop");

  const [previewChord, setPreviewChord] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const genres = ["All Genres", "Pop", "Rock", "Classical", "Jazz"];

  const getReviews = (chord) => (Array.isArray(chord?.reviews) ? chord.reviews : []);
  const getReviewCount = (chord) => getReviews(chord).length;

  const getAvgRating = (chord) => {
    const reviews = getReviews(chord);
    if (!reviews.length) return 0;
    const sum = reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  };

  const renderStars = (rating, size = 16) => {
    const filled = Math.floor(rating);
    return (
      <div className="starsRow" aria-label={`Rating ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <FiStar
            key={i}
            size={size}
            className={i < filled ? "star star--filled" : "star star--empty"}
          />
        ))}
      </div>
    );
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "";
    }
  };

  const fetchMyChords = async () => {
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/api/chords/customer/${uid}`);
      const data = await res.json();
      setChords(Array.isArray(data) ? data : []);
    } catch {
      setChords([]);
    }
  };

  const fetchAllChords = async () => {
    try {
      const params = new URLSearchParams();

      if (exploreSearch.trim()) {
        params.append("search", exploreSearch.trim());
      }

      if (exploreGenre !== "All Genres") {
        params.append("genre", exploreGenre);
      }

      const res = await fetch(`${API_BASE}/api/chords/explore?${params.toString()}`);
      const data = await res.json();
      setAllChords(Array.isArray(data) ? data : []);
    } catch {
      setAllChords([]);
    }
  };

  useEffect(() => {
    fetchMyChords();
    // eslint-disable-next-line
  }, [uid]);

  useEffect(() => {
    fetchAllChords();
    // eslint-disable-next-line
  }, [exploreSearch, exploreGenre]);

  const filteredMyChords = useMemo(() => {
    const s = search.trim().toLowerCase();

    return chords.filter((c) => {
      const matchesGenre = genre === "All Genres" || c.genre === genre;
      const title = (c.title || "").toLowerCase();
      const matchesSearch = !s || title.includes(s);
      return matchesGenre && matchesSearch;
    });
  }, [genre, chords, search]);

  const openUpload = () => {
    setUploadFile(null);
    setUploadTitle("");
    setUploadGenre("Pop");
    setIsUploadOpen(true);
  };

  const closeUpload = () => {
    if (!uploading) setIsUploadOpen(false);
  };

  const uploadOneFileToFirebase = (file) =>
    new Promise((resolve, reject) => {
      const safeName = file.name.replace(/\s+/g, "_");
      const path = `chords/customers/${uid}/${Date.now()}_${safeName}`;

      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, file);

      task.on(
        "state_changed",
        null,
        (err) => reject(err),
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          resolve(url);
        }
      );
    });

  const handleSaveUpload = async () => {
    if (!uid) return alert("User not found. Please login again.");
    if (!uploadFile) return alert("Please select an image file.");
    if (!uploadTitle.trim()) return alert("Please enter a title.");

    setUploading(true);

    try {
      const imageUrl = await uploadOneFileToFirebase(uploadFile);

      const res = await fetch(`${API_BASE}/api/chords`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          role: "CUSTOMER",
          title: uploadTitle.trim(),
          genre: uploadGenre,
          imageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save chord");

      await fetchMyChords();
      await fetchAllChords();

      setIsUploadOpen(false);
      alert("Chord uploaded successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const openPreview = (chord) => setPreviewChord(chord);
  const closePreview = () => setPreviewChord(null);

  const handleDeleteChord = async (chord) => {
    const ok = window.confirm(`Delete "${chord.title || "Untitled"}"?`);
    if (!ok) return;

    setDeletingId(chord._id);

    try {
      const res = await fetch(`${API_BASE}/api/chords/${chord._id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete chord");

      if (chord.imageUrl) {
        const imgRef = ref(storage, chord.imageUrl);
        await deleteObject(imgRef);
      }

      if (previewChord?._id === chord._id) {
        setPreviewChord(null);
      }

      await fetchMyChords();
      await fetchAllChords();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadChord = async (chord) => {
    try {
      const response = await fetch(chord.imageUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${(chord.title || "chord")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_")}.jpg`;

      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      window.open(chord.imageUrl, "_blank");
    }
  };

  useEffect(() => {
    if (!previewChord?._id) return;

    const latest =
      chords.find((c) => c._id === previewChord._id) ||
      allChords.find((c) => c._id === previewChord._id);

    if (latest) setPreviewChord(latest);
    // eslint-disable-next-line
  }, [chords, allChords]);

  return (
    <div className="chordsPage customerMyChordsPage">
      <aside className="chordsPage__sidebar">
        <div className="chordsPage__brand">
          <span className="chordsPage__brandIcon">♫</span>
          <span className="chordsPage__brandText">MusicHive</span>
        </div>

        <nav className="chordsPage__nav">
          <Link className="chordsPage__navItem" to="/customer/dashboard">
            <span className="chordsPage__navIcon"><FiHome /></span>
            <span>Overview</span>
          </Link>

          <Link className="chordsPage__navItem" to="/customer/book-artists">
            <span className="chordsPage__navIcon"><FiCalendar /></span>
            <span>Booking Artists</span>
          </Link>

          <Link className="chordsPage__navItem" to="/customer/my-bookings">
            <span className="chordsPage__navIcon"><FiCalendar /></span>
            <span>My Bookings</span>
          </Link>

          <Link className="chordsPage__navItem chordsPage__navItem--active" to="/customer/chords">
            <span className="chordsPage__navIcon"><FiMusic /></span>
            <span>Chord Library</span>
          </Link>

          <Link className="chordsPage__navItem" to="/customer/reviews">
            <span className="chordsPage__navIcon"><FiStar /></span>
            <span>Reviews</span>
          </Link>
        </nav>

        <div className="chordsPage__sideBottom">
          <Link className="chordsPage__sideAction" to="/customer/profile">
            <span className="chordsPage__navIcon"><FiUser /></span>
            <span>Profile</span>
          </Link>

          <button
            type="button"
            className="chordsPage__sideAction chordsPage__sideActionBtn"
            onClick={handleLogout}
          >
            <span className="chordsPage__navIcon"><FiLogOut /></span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <main className="chordsPage__main">
        <div className="chordsPage__topbar">
          <button className="chordsPage__iconBtn" aria-label="Notifications">
            <FiBell />
          </button>
          <button
            className="artistDash__iconBtn"
            type="button"
            onClick={() => navigate("/customer/wishlist")}
            title="Wishlist"
            >
            <FiHeart />
          </button>

          <div className="chordsPage__user">
            <div className="chordsPage__avatarWrap">
              <div
                className="chordsPage__avatar"
                style={profilePic ? { backgroundImage: `url(${profilePic})` } : {}}
              />
              <span className="chordsPage__onlineDot" />
            </div>
            <span className="chordsPage__userName">{fullName}</span>
          </div>
        </div>

        <div className="chordsPage__header">
          <div className="chordsHeader__row1">
            <h1 className="chordsPage__title">Chord Library</h1>

            <button className="uploadPillBtn" onClick={openUpload} disabled={uploading}>
              <FiUpload />
              <span>{uploading ? "Uploading..." : "Upload Chords"}</span>
            </button>
          </div>

          <div className="chordTabs">
            <button
              className={`chordTabBtn ${activeTab === "my" ? "chordTabBtn--active" : ""}`}
              onClick={() => setActiveTab("my")}
            >
              My Chords
            </button>

            <button
              className={`chordTabBtn ${activeTab === "explore" ? "chordTabBtn--active" : ""}`}
              onClick={() => setActiveTab("explore")}
            >
              Explore Chords
            </button>
          </div>

          {activeTab === "my" ? (
            <div className="chordsHeader__row2">
              <div className="searchBox searchBox--wide">
                <FiSearch className="searchIcon" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your chords..."
                  aria-label="Search chords"
                />
              </div>

              <select
                className="genreSelect"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
              >
                {genres.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="chordsHeader__row2">
              <div className="searchBox searchBox--wide">
                <FiSearch className="searchIcon" />
                <input
                  value={exploreSearch}
                  onChange={(e) => setExploreSearch(e.target.value)}
                  placeholder="Search chord names..."
                  aria-label="Search available chords"
                />
              </div>

              <select
                className="genreSelect"
                value={exploreGenre}
                onChange={(e) => setExploreGenre(e.target.value)}
              >
                {genres.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeTab === "my" ? (
          <div className="chordsGrid">
            {filteredMyChords.length === 0 ? (
              <div className="emptyStateCard">
                <div className="emptyIcon"><FiFileText /></div>
                <div className="emptyTitle">No chords found</div>
                <div className="emptyText">
                  {chords.length === 0
                    ? "You haven’t uploaded any chords yet. Click “Upload Chords” to add your first one."
                    : "Try changing the genre or search keyword."}
                </div>

                <button className="emptyCTA" onClick={openUpload} disabled={uploading}>
                  Upload Chords
                </button>
              </div>
            ) : (
              filteredMyChords.map((c) => {
                const avg = getAvgRating(c);
                const count = getReviewCount(c);

                return (
                  <div
                    className="chordCard"
                    key={c._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openPreview(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openPreview(c);
                    }}
                  >
                    <img src={c.imageUrl} alt={c.title || "Chord"} />

                    <div className="chordMeta">
                      <div className="chordTitle">{c.title || "Untitled"}</div>

                      <div className="cardRatingRow">
                        {count === 0 ? (
                          <span className="noReviewsText">No reviews yet</span>
                        ) : (
                          <>
                            {renderStars(avg, 14)}
                            <span className="ratingNumber">{avg.toFixed(1)}</span>
                            <span className="reviewCountText">
                              ({count} {count === 1 ? "review" : "reviews"})
                            </span>
                          </>
                        )}
                      </div>

                      <div className="chordGenre">{c.genre}</div>

                      <button
                        className="deleteChordBtn deleteChordBtn--cardOnly"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChord(c);
                        }}
                        disabled={deletingId === c._id}
                        title="Delete chord"
                      >
                        <FiTrash2 />
                        <span>{deletingId === c._id ? "Deleting..." : "Delete"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="chordsGrid">
            {allChords.length === 0 ? (
              <div className="emptyStateCard">
                <div className="emptyIcon"><FiMusic /></div>
                <div className="emptyTitle">No available chords</div>
                <div className="emptyText">
                  No chords matched your search. Try another chord name or genre.
                </div>
              </div>
            ) : (
              allChords.map((c) => {
                const avg = getAvgRating(c);
                const count = getReviewCount(c);

                return (
                  <div
                    className="chordCard chordCard--explore"
                    key={c._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openPreview(c)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openPreview(c);
                    }}
                  >
                    <img src={c.imageUrl} alt={c.title || "Chord"} />

                    <div className="chordMeta">
                      <div className="chordTitle">{c.title || "Untitled"}</div>

                      <div className="cardRatingRow">
                        {count === 0 ? (
                          <span className="noReviewsText">No reviews yet</span>
                        ) : (
                          <>
                            {renderStars(avg, 14)}
                            <span className="ratingNumber">{avg.toFixed(1)}</span>
                            <span className="reviewCountText">
                              ({count} {count === 1 ? "review" : "reviews"})
                            </span>
                          </>
                        )}
                      </div>

                      <div className="chordGenre">{c.genre}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        <footer className="chordsPage__footer">
          <div>© 2025 MusicHive. All rights reserved.</div>
          <div className="chordsPage__footerLinks">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </footer>

        {isUploadOpen && (
          <div className="modalOverlay" onMouseDown={closeUpload}>
            <div className="modalCard" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modalHeader">
                <div className="modalTitle">Upload Chords</div>
                <button className="modalClose" onClick={closeUpload} disabled={uploading}>
                  ✕
                </button>
              </div>

              <div className="modalBody">
                <label className="filePick">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    hidden
                  />
                  <span className="filePickBtn">Choose Image</span>
                  <span className="filePickName">
                    {uploadFile ? uploadFile.name : "No file selected"}
                  </span>
                </label>

                <div className="field">
                  <label>Title</label>
                  <input
                    type="text"
                    placeholder="Eg: Perfect - Ed Sheeran"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label>Genre</label>
                  <select value={uploadGenre} onChange={(e) => setUploadGenre(e.target.value)}>
                    <option>Pop</option>
                    <option>Rock</option>
                    <option>Classical</option>
                    <option>Jazz</option>
                  </select>
                </div>
              </div>

              <div className="modalFooter">
                <button className="secondaryBtn" onClick={closeUpload} disabled={uploading}>
                  Cancel
                </button>
                <button className="primaryBtn" onClick={handleSaveUpload} disabled={uploading}>
                  {uploading ? "Saving..." : "Save Upload"}
                </button>
              </div>
            </div>
          </div>
        )}

        {previewChord && (
          <div className="modalOverlay modalOverlay--full" onMouseDown={closePreview}>
            <div
              className="previewCard previewCard--fullscreen"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button className="previewClose" onClick={closePreview} aria-label="Close preview">
                <FiX />
              </button>

              <div className="previewGrid previewGrid--fullscreen">
                <div className="previewImgWrap previewImgWrap--fullscreen">
                  <img src={previewChord.imageUrl} alt={previewChord.title || "Chord"} />
                </div>

                <div className="previewSide previewSide--fullscreen">
                  <div className="previewMeta">
                    <div className="previewTitle">{previewChord.title || "Untitled"}</div>
                    <div className="previewGenre">{previewChord.genre}</div>

                    {(() => {
                      const avg = getAvgRating(previewChord);
                      const count = getReviewCount(previewChord);

                      return (
                        <div className="previewRatingRow">
                          {count === 0 ? (
                            <span className="noReviewsText">No reviews yet</span>
                          ) : (
                            <>
                              {renderStars(avg, 18)}
                              <span className="ratingNumber ratingNumber--big">
                                {avg.toFixed(1)}
                              </span>
                              <span className="reviewCountText">
                                ({count} {count === 1 ? "review" : "reviews"})
                              </span>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    <div className="previewActions">
                      <button
                        className="downloadChordBtn downloadChordBtn--large"
                        onClick={() => handleDownloadChord(previewChord)}
                      >
                        <FiDownload />
                        <span>Download Chord</span>
                      </button>

                      {previewChord.uid === uid && (
                        <button
                          className="deleteChordBtn deleteChordBtn--danger"
                          onClick={() => handleDeleteChord(previewChord)}
                          disabled={deletingId === previewChord._id}
                        >
                          <FiTrash2 />
                          <span>
                            {deletingId === previewChord._id ? "Deleting..." : "Delete chord"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="reviewsBox">
                    <div className="reviewsHeader">
                      <span>Reviews</span>
                    </div>

                    {getReviewCount(previewChord) === 0 ? (
                      <div className="reviewsEmpty">No one has reviewed this chord yet.</div>
                    ) : (
                      <div className="reviewsList">
                        {getReviews(previewChord)
                          .slice()
                          .reverse()
                          .map((r, idx) => (
                            <div className="reviewItem" key={r._id || idx}>
                              <div
                                className="reviewAvatar"
                                style={r.photoURL ? { backgroundImage: `url(${r.photoURL})` } : {}}
                              />
                              <div className="reviewBody">
                                <div className="reviewTop">
                                  <div className="reviewName">{r.name || "User"}</div>
                                  <div className="reviewDate">{formatDate(r.createdAt)}</div>
                                </div>

                                <div className="reviewStars">
                                  {renderStars(Number(r.rating || 0), 14)}
                                  <span className="reviewRatingNum">
                                    {Number(r.rating || 0).toFixed(1)}
                                  </span>
                                </div>

                                {r.text ? <div className="reviewText">{r.text}</div> : null}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}