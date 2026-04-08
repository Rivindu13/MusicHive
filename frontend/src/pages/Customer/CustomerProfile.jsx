import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import "../Artist/styles/ArtistDashboard.css";
import "./Styles/CustomerProfile.css";

import {
  FiBell,
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiHeart,
  FiSave,
  FiCamera,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
import { auth, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API_BASE = "http://localhost:5000";

export default function CustomerProfile() {
  const location = useLocation();
  const navigate = useNavigate();

  const profile =
    location.state?.profile ||
    JSON.parse(localStorage.getItem("profile")) ||
    null;

  const uid = profile?.uid;
  const profilePic = profile?.photoURL || null;

  const fullNameFromProfile =
    profile?.name ||
    profile?.fullName ||
    profile?.username ||
    profile?.customerName ||
    "Customer";

  const emailFromProfile = profile?.email || "";

  const initialOrganizerProfile = useMemo(() => {
    const organizerProfile = profile?.organizerProfile || {};

    return {
      phone: organizerProfile.phone || "",
      organizationName: organizerProfile.organizationName || "",
      eventType: organizerProfile.eventType || "",
      location: organizerProfile.location || "",
      bio: organizerProfile.bio || "",
      preferredGenres: Array.isArray(organizerProfile.preferredGenres)
        ? organizerProfile.preferredGenres.join(", ")
        : "",
      budgetRange: organizerProfile.budgetRange || "",
      instagram: organizerProfile.instagram || "",
      website: organizerProfile.website || "",
    };
  }, [profile]);

  const [fullName, setFullName] = useState(fullNameFromProfile);
  const [email] = useState(emailFromProfile);
  const [photoURL, setPhotoURL] = useState(profilePic);
  const [form, setForm] = useState(initialOrganizerProfile);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const firstName = (fullName || "Customer").split(" ")[0];

  useEffect(() => {
    const stored = localStorage.getItem("profile");
    if (!stored) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("profile");
      localStorage.clear();
      navigate("/", { replace: true });
    }
  };

  const uploadProfilePhoto = async (file) => {
    if (!file || !uid) return null;

    setUploading(true);

    try {
      const fileRef = ref(
        storage,
        `profilePhotos/${uid}/${Date.now()}_${file.name}`
      );

      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setPhotoURL(url);
      return url;
    } catch (err) {
      console.error("Upload error:", err);
      alert("Photo upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!uid) return;

    setSaving(true);

    try {
      const preferredGenresArray = form.preferredGenres
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        name: fullName,
        photoURL: photoURL || null,
        organizerProfile: {
          phone: form.phone,
          organizationName: form.organizationName,
          eventType: form.eventType,
          location: form.location,
          bio: form.bio,
          preferredGenres: preferredGenresArray,
          budgetRange: form.budgetRange,
          instagram: form.instagram,
          website: form.website,
          isProfileComplete: true,
        },
      };

      const res = await fetch(`${API_BASE}/api/users/${uid}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const updatedUser = await res.json().catch(() => null);

      if (!res.ok) {
        alert(updatedUser?.message || "Could not save profile");
        return;
      }

      localStorage.setItem("profile", JSON.stringify(updatedUser));
      alert("Profile saved successfully!");
    } catch (err) {
      console.error("Profile save error:", err);
      alert("Something went wrong while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="artistDash customerProfilePage">
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
          <Link
            className="artistDash__sideAction artistDash__navItem--active"
            to="/customer/profile"
          >
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
        {/* Topbar */}
        <div className="artistDash__topbar">
          <button className="artistDash__iconBtn" aria-label="Notifications">
            <FiBell />
          </button>

          <button className="artistDash__iconBtn" aria-label="Favorites">
            <FiHeart />
          </button>

          <div className="artistDash__user">
            <div className="artistDash__avatarWrap">
              <div
                className="artistDash__avatar"
                style={
                  photoURL
                    ? {
                        backgroundImage: `url(${photoURL})`,
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

        {/* Header */}
        <section className="customerProfileHeader">
          <div className="customerProfileHeader__row">
            <h1 className="customerProfileHeader__title">
              Profile, <span>{firstName}</span>
            </h1>

            <div className="customerProfileHeader__actions">
              <button
                type="button"
                className="customerProfileBtn customerProfileBtn--save"
                onClick={handleSave}
                disabled={saving}
              >
                <FiSave />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          <p className="customerProfileHeader__sub">
            Update your account details and event preferences.
          </p>
        </section>

        {/* Content */}
        <section className="artistDash__content">
          <div className="glassCard customerProfileCard">
            <div className="customerProfileCard__top">
              <div className="customerProfileAvatar">
                <div
                  className="customerProfileAvatar__img"
                  style={
                    photoURL
                      ? {
                          backgroundImage: `url(${photoURL})`,
                        }
                      : {}
                  }
                />

                <label
                  className={`customerProfileAvatar__btn ${
                    uploading ? "isLoading" : ""
                  }`}
                >
                  <FiCamera />
                  <span>{uploading ? "Uploading..." : "Change photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await uploadProfilePhoto(file);
                    }}
                  />
                </label>
              </div>

              <div className="customerProfileTopFields">
                <div className="customerProfileField">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="customerProfileField">
                  <label>Email</label>
                  <input type="email" value={email} disabled />
                </div>

                <div className="customerProfileField">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="+94 77 123 4567"
                  />
                </div>

                <div className="customerProfileField">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={form.organizationName}
                    onChange={(e) =>
                      setField("organizationName", e.target.value)
                    }
                    placeholder="Your company or event brand"
                  />
                </div>
              </div>
            </div>

            <div className="customerProfileGrid">
              <div className="customerProfileField">
                <label>Event Type</label>
                <input
                  type="text"
                  value={form.eventType}
                  onChange={(e) => setField("eventType", e.target.value)}
                  placeholder="Wedding, Corporate Event, Party..."
                />
              </div>

              <div className="customerProfileField">
                <label>Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  placeholder="Colombo, Negombo..."
                />
              </div>

              <div className="customerProfileField customerProfileField--full">
                <label>Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setField("bio", e.target.value)}
                  placeholder="Tell artists about you and the kind of events you organize..."
                />
              </div>

              <div className="customerProfileField">
                <label>Preferred Genres</label>
                <input
                  type="text"
                  value={form.preferredGenres}
                  onChange={(e) => setField("preferredGenres", e.target.value)}
                  placeholder="Pop, Jazz, Classical"
                />
              </div>

              <div className="customerProfileField">
                <label>Budget Range</label>
                <input
                  type="text"
                  value={form.budgetRange}
                  onChange={(e) => setField("budgetRange", e.target.value)}
                  placeholder="LKR 20,000 - 50,000"
                />
              </div>

              <div className="customerProfileField">
                <label>Instagram</label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setField("instagram", e.target.value)}
                  placeholder="https://instagram.com/yourpage"
                />
              </div>

              <div className="customerProfileField">
                <label>Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
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