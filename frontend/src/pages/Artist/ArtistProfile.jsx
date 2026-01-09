import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./styles/ArtistDashboard.css"; // keep your dashboard layout styles
import "./styles/ArtistProfile.css";   // NEW profile styles

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiSave,
  FiPlus,
  FiTrash2,
  FiCamera,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

/* ✅ OPTIONAL: Firebase Storage upload (only if you already use it)
   If you don't export storage, comment this block + upload function. */
import { storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function ArtistProfile() {
  const location = useLocation();
  const navigate = useNavigate();

  const storedProfile =
    location.state?.profile ||
    JSON.parse(localStorage.getItem("profile")) ||
    null;

  // ✅ Guard
  useEffect(() => {
    if (!storedProfile) navigate("/", { replace: true });
  }, [navigate, storedProfile]);

  const uid = storedProfile?.uid;
  const role = storedProfile?.role; // "artist" | "band" | "organizer"

  const isBand = role === "band";

  const initialArtistProfile = useMemo(() => {
    const ap = storedProfile?.artistProfile || {};
    return {
      stageName: ap.stageName || "",
      phone: ap.phone || "",
      bio: ap.bio || "",
      location: ap.location || "",
      pricePerHour: ap.pricePerHour ?? "",
      genres: Array.isArray(ap.genres) ? ap.genres.join(", ") : "",
      instruments: Array.isArray(ap.instruments) ? ap.instruments.join(", ") : "",
      socials: {
        instagram: ap.socials?.instagram || "",
        youtube: ap.socials?.youtube || "",
        spotify: ap.socials?.spotify || "",
      },
      bandMembers: Array.isArray(ap.bandMembers)
        ? ap.bandMembers
        : [{ name: "", position: "" }],
    };
  }, [storedProfile]);

  const [fullName, setFullName] = useState(storedProfile?.name || "");
  const [email] = useState(storedProfile?.email || "");
  const [photoURL, setPhotoURL] = useState(storedProfile?.photoURL || null);

  const [form, setForm] = useState(initialArtistProfile);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const firstName = (fullName || "Artist").split(" ")[0];

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Firebase signOut error:", err);
    } finally {
      localStorage.removeItem("profile");
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const handleNav = (path) => {
    navigate(path, { state: { profile: JSON.parse(localStorage.getItem("profile")) } });
  };

  const setArtistProfileField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setSocialField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      socials: { ...prev.socials, [key]: value },
    }));
  };

  // ✅ OPTIONAL photo upload (Firebase Storage)
  const uploadProfilePhoto = async (file) => {
    if (!file || !uid) return null;

    setUploading(true);
    try {
      const fileRef = ref(storage, `profilePhotos/${uid}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setPhotoURL(url);
      return url;
    } catch (e) {
      console.error("Upload error:", e);
      alert("Photo upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const addBandMember = () => {
    setForm((prev) => ({
      ...prev,
      bandMembers: [...prev.bandMembers, { name: "", position: "" }],
    }));
  };

  const removeBandMember = (idx) => {
    setForm((prev) => ({
      ...prev,
      bandMembers: prev.bandMembers.filter((_, i) => i !== idx),
    }));
  };

  const updateBandMember = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      bandMembers: prev.bandMembers.map((m, i) =>
        i === idx ? { ...m, [key]: value } : m
      ),
    }));
  };

  // ✅ Save to DB
  const handleSave = async () => {
    if (!uid) return;

    setSaving(true);
    try {
      // convert csv strings to arrays
      const genresArr = form.genres
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const instrumentsArr = form.instruments
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      // keep bandMembers only if band
      const bandMembersClean = isBand
        ? (form.bandMembers || [])
            .map((m) => ({
              name: (m.name || "").trim(),
              position: (m.position || "").trim(),
            }))
            .filter((m) => m.name || m.position)
        : [];

      const payload = {
        name: fullName,
        photoURL: photoURL || null,
        artistProfile: {
          stageName: form.stageName,
          phone: form.phone,
          bio: form.bio,
          location: form.location,
          pricePerHour: form.pricePerHour === "" ? null : Number(form.pricePerHour),
          genres: genresArr,
          instruments: instrumentsArr,
          socials: {
            instagram: form.socials.instagram,
            youtube: form.socials.youtube,
            spotify: form.socials.spotify,
          },
          bandMembers: isBand ? bandMembersClean : [],
          isProfileComplete: true,
        },
      };

      const res = await fetch(`http://localhost:5000/api/users/${uid}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        });


      const updated = await res.json().catch(() => null);

      if (!res.ok) {
        console.log("Save failed:", updated);
        alert(updated?.message || "Could not save profile");
        return;
      }

      // ✅ keep local storage updated for all pages
      localStorage.setItem("profile", JSON.stringify(updated));

      alert("Profile saved!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="artistDash">
      {/* Sidebar */}
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

            <a className="artistDash__navItem" href="/artist/bookings">
            <span className="artistDash__navIcon">
                <FiCalendar />
            </span>
            <span>Bookings</span>
            </a>

            <a className="artistDash__navItem" href="/artist/chords">
            <span className="artistDash__navIcon">
                <FiMusic />
            </span>
            <span>My Chords</span>
            </a>

            <a className="artistDash__navItem" href="/artist/reviews">
            <span className="artistDash__navIcon">
                <FiStar />
            </span>
            <span>Reviews</span>
            </a>
        </nav>

        <div className="artistDash__sideBottom">
            {/* ✅ active here */}
            <a className="artistDash__sideAction artistDash__navItem--active" href="/artist/profile">
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
                  photoURL
                    ? { backgroundImage: `url(${photoURL})` }
                    : {}
                }
              />
              <span className="artistDash__onlineDot" />
            </div>
            <span className="artistDash__userName">{fullName || "Artist"}</span>
          </div>
        </div>

        {/* Header */}
        <section className="chordsPage__header">
          <div className="chordsHeader__row1">
            <h1 className="chordsPage__title">
              Profile, <span style={{ fontWeight: 800 }}>{firstName}</span>
            </h1>

            <div className="profilePage__actions">
              <button
                type="button"
                className="profileBtn profileBtn--save"
                onClick={handleSave}
                disabled={saving}
              >
                <FiSave />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <p className="profilePage__sub">
            Update your public details. {isBand ? "Band profile" : "Artist profile"}.
          </p>
        </section>

        {/* Profile Card */}
        <section className="artistDash__content">
          <div className="glassCard profileCard">
            <div className="profileCard__top">
              <div className="profileAvatar">
                <div
                  className="profileAvatar__img"
                  style={photoURL ? { backgroundImage: `url(${photoURL})` } : {}}
                />
                <label className={`profileAvatar__btn ${uploading ? "isLoading" : ""}`}>
                  <FiCamera />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadProfilePhoto(file);
                    }}
                    hidden
                  />
                </label>
              </div>

              <div className="profileTopFields">
                <div className="profileField">
                  <label>Name</label>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="profileField">
                  <label>{isBand ? "Band Name" : "Stage Name"}</label>
                  <input
                    value={form.stageName}
                    onChange={(e) => setArtistProfileField("stageName", e.target.value)}
                    placeholder={isBand ? "Band name" : "Stage name (optional)"}
                  />
                </div>

                <div className="profileField">
                  <label>Email</label>
                  <input value={email} disabled />
                </div>

                <div className="profileField">
                  <label>Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setArtistProfileField("phone", e.target.value)}
                    placeholder="+94 ..."
                  />
                </div>
              </div>
            </div>

            <div className="profileGrid">
              <div className="profileField profileField--full">
                <label>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setArtistProfileField("bio", e.target.value)}
                  placeholder="Tell people about you..."
                  rows={5}
                />
              </div>

              <div className="profileField">
                <label>Location</label>
                <input
                  value={form.location}
                  onChange={(e) => setArtistProfileField("location", e.target.value)}
                  placeholder="City / Area"
                />
              </div>

              <div className="profileField">
                <label>Price per hour (LKR)</label>
                <input
                  type="number"
                  value={form.pricePerHour}
                  onChange={(e) => setArtistProfileField("pricePerHour", e.target.value)}
                  placeholder="45000"
                />
              </div>

              <div className="profileField">
                <label>Genres (comma separated)</label>
                <input
                  value={form.genres}
                  onChange={(e) => setArtistProfileField("genres", e.target.value)}
                  placeholder="Pop, Rock, Jazz..."
                />
              </div>

              <div className="profileField">
                <label>{isBand ? "Instruments / Setup" : "Instruments"} (comma separated)</label>
                <input
                  value={form.instruments}
                  onChange={(e) => setArtistProfileField("instruments", e.target.value)}
                  placeholder="Guitar, Piano, Vocals..."
                />
              </div>

              {/* Band Members only for band */}
              {isBand && (
                <div className="profileField profileField--full">
                  <div className="bandMembersHeader">
                    <label>Band Members</label>
                    <button
                      type="button"
                      className="profileBtn profileBtn--ghost"
                      onClick={addBandMember}
                    >
                      <FiPlus /> Add member
                    </button>
                  </div>

                  <div className="bandMembersList">
                    {form.bandMembers.map((m, idx) => (
                      <div className="bandMemberRow" key={idx}>
                        <input
                          value={m.name}
                          onChange={(e) => updateBandMember(idx, "name", e.target.value)}
                          placeholder="Member name"
                        />
                        <input
                          value={m.position}
                          onChange={(e) => updateBandMember(idx, "position", e.target.value)}
                          placeholder="Position (Guitarist, Drummer...)"
                        />
                        <button
                          type="button"
                          className="bandMemberRemove"
                          onClick={() => removeBandMember(idx)}
                          aria-label="Remove member"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Socials */}
              <div className="profileField">
                <label>Instagram</label>
                <input
                  value={form.socials.instagram}
                  onChange={(e) => setSocialField("instagram", e.target.value)}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="profileField">
                <label>YouTube</label>
                <input
                  value={form.socials.youtube}
                  onChange={(e) => setSocialField("youtube", e.target.value)}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className="profileField">
                <label>Spotify</label>
                <input
                  value={form.socials.spotify}
                  onChange={(e) => setSocialField("spotify", e.target.value)}
                  placeholder="https://open.spotify.com/..."
                />
              </div>
            </div>
          </div>
        </section>

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
