import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { storage } from "../../firebase";
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
} from "react-icons/fi";

import "./MyChords.css";

export default function MyChords() {
  const location = useLocation();

  const profile =
    location.state?.profile || JSON.parse(localStorage.getItem("profile")) || null;

  const uid = profile?.uid;

  const fullName = profile?.name || "Name_Surname";
  const profilePic = profile?.photoURL || null;

  const [genre, setGenre] = useState("All Genres");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);

  const [chords, setChords] = useState([]);

  // ✅ Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadGenre, setUploadGenre] = useState("Pop");

  // ✅ Preview modal state
  const [previewChord, setPreviewChord] = useState(null);

  // ✅ Deleting state (to disable buttons while deleting)
  const [deletingId, setDeletingId] = useState(null);

  const fetchChords = async () => {
    if (!uid) return;
    const res = await fetch(`http://localhost:5000/api/chords/artist/${uid}`);
    const data = await res.json();
    setChords(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchChords();
    // eslint-disable-next-line
  }, [uid]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return chords.filter((c) => {
      const matchesGenre = genre === "All Genres" || c.genre === genre;
      const title = (c.title || "").toLowerCase();
      const matchesSearch = !s || title.includes(s);
      return matchesGenre && matchesSearch;
    });
  }, [genre, chords, search]);

  // ===== Upload modal controls =====
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
      const path = `chords/${uid}/${Date.now()}_${safeName}`;

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

      const res = await fetch("http://localhost:5000/api/chords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          title: uploadTitle.trim(),
          genre: uploadGenre,
          imageUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to save chord");

      await fetchChords();
      setIsUploadOpen(false);
      alert("Chord uploaded successfully!");
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  // ===== Preview controls =====
  const openPreview = (chord) => setPreviewChord(chord);
  const closePreview = () => setPreviewChord(null);

  // ===== Delete chord =====
  const handleDeleteChord = async (chord) => {
    const ok = window.confirm(`Delete "${chord.title || "Untitled"}"?`);
    if (!ok) return;

    setDeletingId(chord._id);
    try {
      // 1) delete from MongoDB
      const res = await fetch(`http://localhost:5000/api/chords/${chord._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to delete chord");

      // 2) delete from Firebase Storage (recommended)
      // Works in most cases with a download URL.
      if (chord.imageUrl) {
        const imgRef = ref(storage, chord.imageUrl);
        await deleteObject(imgRef);
      }

      // close preview if we deleted the one being previewed
      if (previewChord?._id === chord._id) setPreviewChord(null);

      await fetchChords();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="chordsPage">
      {/* Sidebar */}
      <aside className="chordsPage__sidebar">
        <div className="chordsPage__brand">
          <span className="chordsPage__brandIcon">♫</span>
          <span className="chordsPage__brandText">MusicHive</span>
        </div>

        <nav className="chordsPage__nav">
          <Link className="chordsPage__navItem" to="/artist/dashboard">
            <span className="chordsPage__navIcon"><FiHome /></span>
            <span>Overview</span>
          </Link>

          <a className="chordsPage__navItem" href="#">
            <span className="chordsPage__navIcon"><FiCalendar /></span>
            <span>Bookings</span>
          </a>

          <Link className="chordsPage__navItem chordsPage__navItem--active" to="/artist/chords">
            <span className="chordsPage__navIcon"><FiMusic /></span>
            <span>My Chords</span>
          </Link>

          <a className="chordsPage__navItem" href="#">
            <span className="chordsPage__navIcon"><FiStar /></span>
            <span>Reviews</span>
          </a>
        </nav>

        <div className="chordsPage__sideBottom">
          <a className="chordsPage__sideAction" href="#">
            <span className="chordsPage__navIcon"><FiUser /></span>
            <span>Profile</span>
          </a>

          <a className="chordsPage__sideAction" href="#">
            <span className="chordsPage__navIcon"><FiLogOut /></span>
            <span>Log out</span>
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="chordsPage__main">
        {/* Top bar */}
        <div className="chordsPage__topbar">
          <button className="chordsPage__iconBtn" aria-label="Notifications">
            <FiBell />
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

        {/* Header */}
        <div className="chordsPage__header">
            {/* Row 1 */}
            <div className="chordsHeader__row1">
                <h1 className="chordsPage__title">My Chords</h1>

                <button className="uploadPillBtn" onClick={openUpload} disabled={uploading}>
                <FiUpload />
                <span>{uploading ? "Uploading..." : "Upload Chords"}</span>
                </button>
            </div>

            {/* Row 2 */}
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
                <option>All Genres</option>
                <option>Pop</option>
                <option>Rock</option>
                <option>Classical</option>
                <option>Jazz</option>
                </select>
            </div>
            </div>


        {/* Grid */}
        <div className="chordsGrid">
          {filtered.length === 0 ? (
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
            filtered.map((c) => (
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
                  <div className="chordGenre">{c.genre}</div>

                  {/* Delete button (stop click so it doesn't open preview) */}
                  <button
                    className="deleteChordBtn"
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
            ))
          )}
        </div>

        {/* Footer */}
        <footer className="chordsPage__footer">
          <div>© 2025 MusicHive. All rights reserved.</div>
          <div className="chordsPage__footerLinks">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </footer>

        {/* ✅ Upload Modal */}
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

        {/* ✅ Preview Modal */}
        {previewChord && (
          <div className="modalOverlay" onMouseDown={closePreview}>
            <div className="previewCard" onMouseDown={(e) => e.stopPropagation()}>
              <button className="previewClose" onClick={closePreview} aria-label="Close preview">
                <FiX />
              </button>

              <div className="previewImgWrap">
                <img src={previewChord.imageUrl} alt={previewChord.title || "Chord"} />
              </div>

              <div className="previewMeta">
                <div className="previewTitle">{previewChord.title || "Untitled"}</div>
                <div className="previewGenre">{previewChord.genre}</div>

                <button
                  className="deleteChordBtn deleteChordBtn--danger"
                  onClick={() => handleDeleteChord(previewChord)}
                  disabled={deletingId === previewChord._id}
                >
                  <FiTrash2 />
                  <span>{deletingId === previewChord._id ? "Deleting..." : "Delete"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
