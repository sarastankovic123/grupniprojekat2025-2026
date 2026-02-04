import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchNotifications, markAsRead, markAsUnread } from "../api/notifications";
import { apiFetch } from "../api/apiFetch";

function getNotifId(n) {
  return n?.id || n?._id || n?.notificationId;
}

function getCreatedAt(n) {
  return n?.createdAt || n?.created_at || n?.timestamp || n?.time;
}

function getIsRead(n) {
  // backend može vratiti isRead ili read
  return Boolean(n?.isRead ?? n?.read);
}

export default function Profile() {
  const { user, logout, setAuthToken } = useAuth();

  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingIds, setUpdatingIds] = useState(new Set());

  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      setProfileStatus({ type: "", message: "" });
      setProfileLoading(true);

      try {
        const data = await apiFetch("/api/auth/me");
        if (!alive) return;

        const u = data?.user || null;
        setProfile(u);
        setProfileForm({
          username: u?.username || "",
          firstName: u?.firstName || "",
          lastName: u?.lastName || "",
        });
      } catch (err) {
        if (!alive) return;
        setProfileStatus({
          type: "error",
          message: err.message || "Failed to load profile",
        });
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function loadNotifications() {
      setError("");
      setLoading(true);
      try {
        const data = await fetchNotifications();
        if (!alive) return;
        setNotifications(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Failed to load notifications");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    loadNotifications();
    return () => {
      alive = false;
    };
  }, []);

  async function refresh() {
    setError("");
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  async function toggleReadStatus(notif) {
    const notifId = getNotifId(notif);
    if (!notifId) {
      setError("Notification ID missing");
      return;
    }

    if (updatingIds.has(notifId)) return;

    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(notifId);
      return next;
    });

    try {
      const currentlyRead = getIsRead(notif);

      if (currentlyRead) {
        await markAsUnread(notifId);
      } else {
        await markAsRead(notifId);
      }

      setNotifications((prev) =>
        prev.map((n) => {
          const id = getNotifId(n);
          if (id !== notifId) return n;

          // flip isRead, ali čuvamo oba moguća polja
          const nextRead = !currentlyRead;
          return { ...n, isRead: nextRead, read: nextRead };
        })
      );
    } catch (err) {
      console.error("Failed to toggle read status:", err);
      setError(err.message || "Failed to update notification");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(notifId);
        return next;
      });
    }
  }

  function formatDateTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return String(timestamp);

    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const unreadCount = useMemo(
    () => notifications.filter((n) => !getIsRead(n)).length,
    [notifications]
  );

  async function saveProfile(e) {
    e.preventDefault();
    setProfileStatus({ type: "", message: "" });

    try {
      const payload = {
        username: profileForm.username,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      };

      const data = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const jwt = data?.accessToken || data?.access_token;
      if (jwt) setAuthToken(jwt);
      if (data?.user) setProfile(data.user);

      setProfileStatus({ type: "success", message: "Sačuvano." });
    } catch (err) {
      setProfileStatus({
        type: "error",
        message: err.message || "Greška pri čuvanju profila.",
      });
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <h2 style={{ margin: 0 }}>Profile</h2>
        <div style={styles.topbarRight}>
          <Link to="/" style={styles.link}>← Back to Artists</Link>
          <Link to="/profile/password" style={styles.link}>Promeni lozinku</Link>
          <button onClick={logout} style={styles.btn}>Logout</button>
        </div>
      </div>

      {/* User Info Card */}
      <div style={styles.card}>
        <h3 style={{ marginTop: 0 }}>User Information</h3>

        <form onSubmit={saveProfile} style={{ display: "grid", gap: 12, marginBottom: 16 }}>
          <label style={{ display: "grid", gap: 6 }}>
            Username
            <input
              value={profileForm.username}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, username: e.target.value }))
              }
              disabled={profileLoading}
              autoComplete="username"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Ime
            <input
              value={profileForm.firstName}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, firstName: e.target.value }))
              }
              disabled={profileLoading}
              autoComplete="given-name"
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            Prezime
            <input
              value={profileForm.lastName}
              onChange={(e) =>
                setProfileForm((p) => ({ ...p, lastName: e.target.value }))
              }
              disabled={profileLoading}
              autoComplete="family-name"
            />
          </label>

          <button type="submit" disabled={profileLoading}>
            {profileLoading ? "Učitavam..." : "Sačuvaj"}
          </button>

          {profileStatus.message ? (
            <div
              style={{
                padding: 10,
                borderRadius: 8,
                background:
                  profileStatus.type === "success" ? "#e9f7ef" : "#fdecea",
              }}
            >
              {profileStatus.message}
            </div>
          ) : null}
        </form>

        <div style={styles.infoGrid}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Username:</span>
            <span style={styles.infoValue}>{profile?.username || user?.username || "N/A"}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Email:</span>
            <span style={styles.infoValue}>{profile?.email || user?.email || "N/A"}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Ime:</span>
            <span style={styles.infoValue}>{profile?.firstName || "N/A"}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Prezime:</span>
            <span style={styles.infoValue}>{profile?.lastName || "N/A"}</span>
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
            <span style={styles.unreadBadge}>{unreadCount} unread</span>
            <button onClick={refresh} disabled={loading} style={styles.refreshBtn}>
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
          {notifications.map((notif, idx) => {
            const id = getNotifId(notif) || idx;
            const isRead = getIsRead(notif);
            const createdAt = getCreatedAt(notif);

            return (
              <div
                key={id}
                style={{
                  ...styles.notificationCard,
                  ...(isRead ? styles.notificationRead : styles.notificationUnread),
                }}
              >
                <div style={styles.notificationContent}>
                  <div style={styles.notificationMessage}>{notif.message}</div>
                  <div style={styles.notificationTime}>{formatDateTime(createdAt)}</div>
                </div>
                <button
                  onClick={() => toggleReadStatus(notif)}
                  disabled={updatingIds.has(getNotifId(notif))}
                  style={{
                    ...styles.toggleBtn,
                    ...(isRead ? styles.toggleBtnRead : styles.toggleBtnUnread),
                  }}
                >
                  {updatingIds.has(getNotifId(notif))
                    ? "..."
                    : isRead
                    ? "Mark Unread"
                    : "Mark Read"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// styles ostaju tvoji (ne diram)
const styles = {
  page: { padding: 24, maxWidth: 1200, margin: "0 auto" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
  link: { textDecoration: "none", color: "#0066cc" },
  btn: { padding: "8px 16px", borderRadius: 10, border: "1px solid #111", cursor: "pointer", background: "white" },
  card: { border: "1px solid #ddd", borderRadius: 12, padding: 20, marginBottom: 24, background: "white" },
  infoGrid: { display: "grid", gap: 12 },
  infoRow: { display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f0f0f0" },
  infoLabel: { fontWeight: 600, width: 120, flexShrink: 0 },
  infoValue: { flex: 1 },
  roleBadge: { background: "#e8f4ff", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 700, color: "#0066cc", display: "inline-block" },
  section: { border: "1px solid #ddd", borderRadius: 12, padding: 20, background: "white" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 },
  sectionActions: { display: "flex", alignItems: "center", gap: 12 },
  unreadBadge: { background: "#f0f0f0", padding: "6px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 },
  refreshBtn: { padding: "6px 12px", borderRadius: 10, border: "1px solid #ccc", cursor: "pointer", background: "white", fontSize: 13 },
  error: { color: "crimson", marginBottom: 12, padding: 12, background: "#fff0f0", borderRadius: 8 },
  emptyState: { textAlign: "center", padding: 40, opacity: 0.6 },
  notificationsList: { display: "grid", gap: 12 },
  notificationCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: 16, border: "1px solid #e0e0e0", borderRadius: 10, gap: 16 },
  notificationUnread: { background: "#f9f9ff", borderLeftWidth: 4, borderLeftColor: "#0066cc" },
  notificationRead: { background: "white", opacity: 0.85 },
  notificationContent: { flex: 1 },
  notificationMessage: { fontSize: 15, marginBottom: 6 },
  notificationTime: { fontSize: 13, opacity: 0.6 },
  toggleBtn: { padding: "8px 16px", borderRadius: 8, border: "1px solid", cursor: "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0 },
  toggleBtnUnread: { background: "#0066cc", color: "white", borderColor: "#0066cc" },
  toggleBtnRead: { background: "white", color: "#666", borderColor: "#ccc" },
};
