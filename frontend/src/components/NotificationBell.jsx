import React, { useCallback, useEffect, useState } from "react";
import { FiBell } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function formatRelativeTime(dateStr) {
  if (!dateStr) return "";

  const now = new Date();
  const then = new Date(dateStr);

  if (Number.isNaN(then.getTime())) return "";

  const diffMs = now - then;
  const mins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationBell({ uid, buttonClassName = "artistDash__iconBtn" }) {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("You are not logged in");
    }

    const token = await currentUser.getIdToken();

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }, []);

  const fetchNotificationCount = useCallback(async () => {
    if (!uid) return;

    try {
      const headers = await getAuthHeaders();

      const res = await fetch(`${API_BASE}/api/notifications/${uid}/count`, {
        method: "GET",
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch notification count");
      }

      setNotificationCount(data.count || 0);
    } catch (err) {
      console.error("Notification count error:", err);
    }
  }, [uid, getAuthHeaders]);

  useEffect(() => {
    fetchNotificationCount();

    const interval = setInterval(fetchNotificationCount, 8000);

    return () => clearInterval(interval);
  }, [fetchNotificationCount]);

  const handleBellClick = async () => {
    if (!uid) return;

    try {
      const headers = await getAuthHeaders();

      const res = await fetch(`${API_BASE}/api/notifications/${uid}`, {
        method: "GET",
        headers,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch notifications");
      }

      setNotifications(Array.isArray(data) ? data : []);
      setNotificationCount(0);
      setShowNotifications(true);
    } catch (err) {
      console.error("Notification fetch error:", err);
      setNotifications([]);
      setShowNotifications(true);
    }
  };

  return (
    <div className="notificationWrap">
      <button
        className={buttonClassName}
        aria-label="Notifications"
        type="button"
        onClick={handleBellClick}
      >
        <FiBell />

        {notificationCount > 0 && (
          <span className="notificationBadge">{notificationCount}</span>
        )}
      </button>

      {showNotifications && (
        <div className="notificationPopup">
          <div className="notificationPopup__header">
            <h4>Notifications</h4>

            <button type="button" onClick={() => setShowNotifications(false)}>
              ×
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="notificationPopup__empty">No new notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className="notificationPopup__item"
                onClick={() => {
                  setShowNotifications(false);
                  if (n.link) navigate(n.link);
                }}
              >
                <strong>{n.title}</strong>
                <p>{n.message}</p>
                <span>{formatRelativeTime(n.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}