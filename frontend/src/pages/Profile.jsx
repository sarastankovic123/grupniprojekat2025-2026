import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchNotifications, markAsRead, markAsUnread } from "../api/notifications";

export default function Profile() {
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingIds, setUpdatingIds] = useState(new Set());

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    setError("");
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function toggleReadStatus(notif) {
    if (updatingIds.has(notif.id)) return; // Prevent double-click

    setUpdatingIds(prev => new Set(prev).add(notif.id));

    try {
      if (notif.isRead) {
        await markAsUnread(notif.id);
      } else {
        await markAsRead(notif.id);
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, isRead: !n.isRead } : n)
      );
    } catch (err) {
      console.error("Failed to toggle read status:", err);
      setError(err.message || "Failed to update notification");
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(notif.id);
        return next;
      });
    }
  }

  function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <h2 style={{ margin: 0 }}>Profile</h2>
        <div style={styles.topbarRight}>
          <Link to="/artists" style={styles.link}>← Back to Artists</Link>
          <button onClick={logout} style={styles.btn}>Logout</button>
        </div>
      </div>

      {/* User Info Card */}
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>User Information</h3>
        <div style={styles.infoGrid}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Username:</span>
            <span style={styles.infoValue}>{user?.username || "N/A"}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Email:</span>
            <span style={styles.infoValue}>{user?.email || "N/A"}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Role:</span>
            <span style={{ ...styles.infoValue, ...styles.roleBadge }}>
              {user?.role || "USER"}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>User ID:</span>
            <span style={{ ...styles.infoValue, fontSize: 12, opacity: 0.7 }}>
              {user?.userId || "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3 style={{ margin: 0 }}>Notifications</h3>
          <div style={styles.sectionActions}>
            <span style={styles.unreadBadge}>
              {unreadCount} unread
            </span>
            <button onClick={loadNotifications} disabled={loading} style={styles.refreshBtn}>
              {loading ? "Refreshing..." : "🔄 Refresh"}
            </button>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        {loading && <div>Loading notifications...</div>}

        {!loading && notifications.length === 0 && (
          <div style={styles.emptyState}>No notifications yet</div>
        )}

        <div style={styles.notificationsList}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              style={{
                ...styles.notificationCard,
                ...(notif.isRead ? styles.notificationRead : styles.notificationUnread),
              }}
            >
              <div style={styles.notificationContent}>
                <div style={styles.notificationMessage}>{notif.message}</div>
                <div style={styles.notificationTime}>{formatDateTime(notif.createdAt)}</div>
              </div>
              <button
                onClick={() => toggleReadStatus(notif)}
                disabled={updatingIds.has(notif.id)}
                style={{
                  ...styles.toggleBtn,
                  ...(notif.isRead ? styles.toggleBtnRead : styles.toggleBtnUnread),
                }}
              >
                {updatingIds.has(notif.id)
                  ? "..."
                  : notif.isRead
                  ? "Mark Unread"
                  : "Mark Read"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24, maxWidth: 1200, margin: "0 auto" },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
  link: { textDecoration: "none", color: "#0066cc" },
  btn: {
    padding: "8px 16px",
    borderRadius: 10,
    border: "1px solid #111",
    cursor: "pointer",
    background: "white",
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    background: "white",
  },
  infoGrid: { display: "grid", gap: 12 },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  infoLabel: {
    fontWeight: 600,
    width: 120,
    flexShrink: 0,
  },
  infoValue: {
    flex: 1,
  },
  roleBadge: {
    background: "#e8f4ff",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 700,
    color: "#0066cc",
    display: "inline-block",
  },
  section: {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 20,
    background: "white",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
    gap: 12,
  },
  sectionActions: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  unreadBadge: {
    background: "#f0f0f0",
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
  },
  refreshBtn: {
    padding: "6px 12px",
    borderRadius: 10,
    border: "1px solid #ccc",
    cursor: "pointer",
    background: "white",
    fontSize: 13,
  },
  error: {
    color: "crimson",
    marginBottom: 12,
    padding: 12,
    background: "#fff0f0",
    borderRadius: 8,
  },
  emptyState: {
    textAlign: "center",
    padding: 40,
    opacity: 0.6,
  },
  notificationsList: {
    display: "grid",
    gap: 12,
  },
  notificationCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    gap: 16,
  },
  notificationUnread: {
    background: "#f9f9ff",
    borderLeftWidth: 4,
    borderLeftColor: "#0066cc",
  },
  notificationRead: {
    background: "white",
    opacity: 0.85,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: 15,
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 13,
    opacity: 0.6,
  },
  toggleBtn: {
    padding: "8px 16px",
    borderRadius: 8,
    border: "1px solid",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
  },
  toggleBtnUnread: {
    background: "#0066cc",
    color: "white",
    borderColor: "#0066cc",
  },
  toggleBtnRead: {
    background: "white",
    color: "#666",
    borderColor: "#ccc",
  },
};
