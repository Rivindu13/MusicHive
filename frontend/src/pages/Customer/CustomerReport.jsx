import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../../components/NotificationBell";
import "../Artist/styles/ArtistDashboard.css";
import "./Styles/CustomerReport.css";

import {
  FiHome,
  FiCalendar,
  FiMusic,
  FiStar,
  FiUser,
  FiLogOut,
  FiUpload,
  FiArrowLeft,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";

import { signOut } from "firebase/auth";
import { auth, storage } from "../../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const API_BASE = "http://localhost:5000";

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
    return ymdStr || "—";
  }
}

function slotTypeLabel(t) {
  return t === "MORNING" ? "Morning" : t === "EVENING" ? "Evening" : t || "—";
}

function normalizeReporterRole(profile) {
  const role = String(profile?.role || "").toLowerCase();
  if (role === "artist") return "artist";
  if (role === "band") return "band";
  return "organizer";
}

export default function CustomerReport() {
  const location = useLocation();
  const navigate = useNavigate();

  const bookingData = location.state || {};

  const profile = useMemo(() => {
    return bookingData?.profile || JSON.parse(localStorage.getItem("profile")) || null;
  }, [bookingData?.profile]);

  const reporterRole = normalizeReporterRole(profile);
  const isArtist = reporterRole === "artist" || reporterRole === "band";

  const reportedUser = bookingData?.reportedUser || {
    uid: bookingData?.reportedUid || "",
    name: bookingData?.reportedName || (isArtist ? "Customer" : "Artist"),
    role: bookingData?.reportedRole || (isArtist ? "organizer" : "artist"),
    email: bookingData?.reportedEmail || "",
  };

  const reportedRole = isArtist ? "organizer" : "artist";
  const reportedLabel = isArtist ? "Customer" : "Artist";
  const backPath = isArtist ? "/artist/bookings" : "/customer/my-bookings";

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const profilePic = profile?.photoURL || null;
  const fullName =
    profile?.name ||
    profile?.fullName ||
    profile?.organizationName ||
    profile?.username ||
    (isArtist ? "Artist" : "Customer");

  const reporterUid = profile?.uid || profile?.userUid || profile?.id || auth.currentUser?.uid || "";

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

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const uploadEvidenceToFirebase = (file) =>
    new Promise((resolve, reject) => {
      const safeName = file.name.replace(/\s+/g, "_");
      const ownerUid = reporterUid || "unknown";
      const path = `reports/${ownerUid}/${Date.now()}_${safeName}`;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!reporterUid) {
      setErr("Please login again.");
      return;
    }

    if (!bookingData?.bookingId) {
      setErr("Booking details are missing. Please open Report from the booking page.");
      return;
    }

    if (!reportedUser?.uid) {
      setErr("Reported user not found.");
      return;
    }

    if (!reason) {
      setErr("Please select a report reason.");
      return;
    }

    if (description.trim().length < 10) {
      setErr("Please enter at least 10 characters in description.");
      return;
    }

    setSubmitting(true);

    try {
      const evidenceUrls = await Promise.all(
        files.map((file) => uploadEvidenceToFirebase(file))
      );

      const idToken = await auth.currentUser?.getIdToken();

      const res = await fetch(`${API_BASE}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,

          reporterUid,
          reporterName: fullName,
          reporterRole,

          reportedUid: reportedUser.uid,
          reportedName: reportedUser.name || reportedLabel,
          reportedRole,

          reason,
          description,
          evidenceUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to submit report");
      }

      setOk("Report submitted successfully.");
      setReason("");
      setDescription("");
      setFiles([]);

      setTimeout(() => {
        navigate(backPath);
      }, 900);
    } catch (err) {
      setErr(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="artistDash customerReportPage">
      <aside className="artistDash__sidebar">
        <div className="artistDash__brand">
          <span className="artistDash__brandIcon">♫</span>
          <span className="artistDash__brandText">MusicHive</span>
        </div>

        <nav className="artistDash__nav">
          <Link className="artistDash__navItem" to={isArtist ? "/artist/dashboard" : "/customer/dashboard"}>
            <span className="artistDash__navIcon"><FiHome /></span>
            <span>Overview</span>
          </Link>

          {isArtist ? (
            <>
              <Link className="artistDash__navItem artistDash__navItem--active" to="/artist/bookings">
                <span className="artistDash__navIcon"><FiCalendar /></span>
                <span>Bookings</span>
              </Link>

              <Link className="artistDash__navItem" to="/artist/chords">
                <span className="artistDash__navIcon"><FiMusic /></span>
                <span>Chord Library</span>
              </Link>

              <Link className="artistDash__navItem" to="/artist/reviews">
                <span className="artistDash__navIcon"><FiStar /></span>
                <span>Reviews</span>
              </Link>
            </>
          ) : (
            <>
              <Link className="artistDash__navItem" to="/customer/book-artists">
                <span className="artistDash__navIcon"><FiCalendar /></span>
                <span>Booking Artists</span>
              </Link>

              <Link className="artistDash__navItem artistDash__navItem--active" to="/customer/my-bookings">
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
            </>
          )}
        </nav>

        <div className="artistDash__sideBottom">
          <Link className="artistDash__sideAction" to={isArtist ? "/artist/profile" : "/customer/profile"}>
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

        <section className="reportHeader">
          <button type="button" className="reportBackBtn" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>

          <h1 className="reportTitle">Submit Report</h1>
          <p className="reportSub">
            Report an issue related to your completed booking.
          </p>
        </section>

        <section className="reportCard">
          <div className="reportBookingBox">
            <div className="reportTargetLabel">Booking Details</div>
            <div className="reportBookingGrid">
              <div>
                <span>Booking ID</span>
                <b>{bookingData?.bookingId || "Missing"}</b>
              </div>
              <div>
                <span>{reportedLabel}</span>
                <b>{reportedUser?.name || reportedLabel}</b>
              </div>
              <div>
                <span>Date</span>
                <b>{bookingData?.bookingDate ? humanDate(bookingData.bookingDate) : "—"}</b>
              </div>
              <div>
                <span>Slot</span>
                <b>{slotTypeLabel(bookingData?.slotType)}</b>
              </div>
            </div>
          </div>

          <div className="reportTargetBox">
            <div className="reportTargetLabel">Reporting</div>
            <div className="reportTargetName">
              {reportedUser?.name || `Unknown ${reportedLabel}`}
            </div>
            <div className="reportTargetMeta">
              {(reportedRole || "user").toUpperCase()} {reportedUser?.email ? `• ${reportedUser.email}` : ""}
            </div>
          </div>

          {err && (
            <div className="reportState reportState--error">
              <FiAlertTriangle /> {err}
            </div>
          )}

          {ok && (
            <div className="reportState reportState--success">
              <FiCheckCircle /> {ok}
            </div>
          )}

          <form className="reportForm" onSubmit={handleSubmit}>
            <label className="reportField">
              Reason
              <select value={reason} onChange={(e) => setReason(e.target.value)}>
                <option value="">Select a reason</option>
                {isArtist ? (
                  <>
                    <option value="payment_issue">Payment issue</option>
                    <option value="harassment">Harassment</option>
                    <option value="abusive_behavior">Abusive behavior</option>
                    <option value="false_booking_information">False booking information</option>
                    <option value="scam_or_fraud">Scam or fraud</option>
                    <option value="other">Other</option>
                  </>
                ) : (
                  <>
                    <option value="artist_did_not_attend">Artist did not attend</option>
                    <option value="poor_performance">Poor performance</option>
                    <option value="inappropriate_behavior">Inappropriate behavior</option>
                    <option value="fake_profile">Fake profile or false information</option>
                    <option value="payment_issue">Payment issue</option>
                    <option value="scam_or_fraud">Scam or fraud</option>
                    <option value="harassment">Harassment</option>
                    <option value="other">Other</option>
                  </>
                )}
              </select>
            </label>

            <label className="reportField">
              Description
              <textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened..."
              />
            </label>

            <label className="reportUpload">
              <FiUpload />
              <span>
                Upload evidence images/screenshots <small>(optional)</small>
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                hidden
              />
            </label>

            {files.length > 0 && (
              <div className="reportFiles">
                {files.map((file, index) => (
                  <div className="reportFile" key={`${file.name}-${index}`}>
                    {file.name}
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="reportSubmitBtn" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Report"}
            </button>
          </form>
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
