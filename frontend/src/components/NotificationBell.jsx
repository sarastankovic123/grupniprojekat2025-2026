import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchNotifications, markAsRead } from "../api/notifications";

function getNotifId(n) {
  return n?.id || n?._id || n?.notificationId;
}
function getIsRead(n) {
  return Boolean(n?.isRead ?? n?.read);
}
function getCreatedAt(n) {
  return n?.createdAt || n?.created_at || n?.timestamp || n?.time;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dropdownRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  async function loadNotifications() {
    setError("");
    setLoading(true);
    try {
      const data = await fetchNotifications();
      const notifs = Array.isArray(data) ? data : data?.items || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !getIsRead(n)).length);
    } catch (err) {
      const msg = err?.message || "Failed to load notifications";

      // Ako nije ulogovan, gateway vrati 401 — ne smaraj korisnika errorom
      if (msg.toLowerCase().includes("authorization") || msg.includes("401")) {
        setNotifications([]);
        setUnreadCount(0);
        setError("");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleNotificationClick(notif) {
    const id = getNotifId(notif);
    if (!id) return;

    if (getIsRead(notif)) return;

    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => {
          const nid = getNotifId(n);
          if (nid !== id) return n;
          return { ...n, isRead: true, read: true };
        })
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  }

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      loadNotifications();
    }
  }

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div style={styles.container} ref={dropdownRef}>
      <button onClick={toggleDropdown} style={styles.bellButton} aria-label="Notifications">
        <span style={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <h4 style={styles.title}>Notifications</h4>
            <button onClick={() => setIsOpen(false)} style={styles.closeButton} aria-label="Close">
              ×
            </button>
          </div>

          {loading && <div style={styles.message}>Loading...</div>}
          {error && <div style={styles.error}>{error}</div>}

          {!loading && !error && recentNotifications.length === 0 && (
            <div style={styles.message}>No notifications</div>
          )}

          <div style={styles.notificationList}>
            {recentNotifications.map((notif, idx) => {
              const id = getNotifId(notif) || idx;
              const isRead = getIsRead(notif);
              const createdAt = getCreatedAt(notif);

              return (
                <div
                  key={id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{
                    ...styles.notificationItem,
                    ...(isRead ? styles.notificationRead : styles.notificationUnread),
                  }}
                >
                  <div style={styles.notificationMessage}>{notif.message}</div>
                  <div style={styles.notificationTime}>{formatTime(createdAt)}</div>
                </div>
              );
            })}
          </div>

          <Link to="/profile" style={styles.viewAllLink} onClick={() => setIsOpen(false)}>
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}

function formatTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return String(timestamp);

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

const styles = {
  container: { position: "relative" },
  bellButton: {
    position: "relative",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    padding: 8,
  },
  bellIcon: { display: "inline-block" },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    background: "crimson",
    color: "white",
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 10,
    padding: "2px 6px",
    minWidth: 18,
    textAlign: "center",
  },
  dropdown: {
    position: "absolute",
    top: "100%",
    right: 0,
    marginTop: 8,
    width: 360,
    maxHeight: 480,
    background: "white",
    border: "1px solid #ddd",
    borderRadius: 12,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: 1000,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #eee",
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700 },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    padding: 0,
    lineHeight: 1,
  },
  notificationList: { overflowY: "auto", maxHeight: 360 },
  notificationItem: {
    padding: 12,
    borderBottom: "1px solid #f0f0f0",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  notificationUnread: { background: "#f9f9ff" },
  notificationRead: { background: "white", opacity: 0.8 },
  notificationMessage: { fontSize: 14, marginBottom: 4 },
  notificationTime: { fontSize: 12, opacity: 0.6 },
  message: { padding: 16, textAlign: "center", opacity: 0.7 },
  error: { padding: 16, color: "crimson", fontSize: 14 },
  viewAllLink: {
    display: "block",
    padding: 12,
    textAlign: "center",
    borderTop: "1px solid #eee",
    textDecoration: "none",
    color: "#0066cc",
    fontSize: 14,
    fontWeight: 600,
  },
};
