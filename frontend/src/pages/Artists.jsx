import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";
import NotificationBell from "../components/NotificationBell";
import { theme } from "../theme";

export default function Artists() {
  const { logout, isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "A";

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const data = await apiFetch("/api/content/artists");
        if (!alive) return;

        const list = Array.isArray(data) ? data : data?.items || [];
        setArtists(list);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load artists");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.topbar}>
        <h2 style={{ margin: 0 }}>Artists</h2>

        <div style={styles.topbarRight}>
          {isAuthenticated ? (
            <>
              <NotificationBell />

              <Link to="/profile" style={styles.linkBtn}>
                Profile
              </Link>

              <Link to="/profile/password" style={styles.linkBtn}>
                Promeni lozinku
              </Link>

              {isAdmin ? (
                <Link to="/admin/artists/new" style={styles.linkBtn}>
                  + Add artist
                </Link>
              ) : null}

              <button onClick={logout} style={styles.btn}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.linkBtn}>
                Login
              </Link>
              <Link to="/register" style={styles.linkBtn}>
                Register
              </Link>
              <Link to="/forgot-password" style={styles.linkBtn}>
                Zaboravljena lozinka?
              </Link>
            </>
          )}
        </div>
      </div>

      {loading ? <div>Loading...</div> : null}
      {err ? <div style={styles.error}>{err}</div> : null}

      <div style={styles.grid}>
        {artists.map((a) => {
          const id = a.id || a._id || a.artistId;
          return (
            <Link
              key={id || a.name}
              to={`/artists/${id}`}
              style={styles.card}
            >
              <div style={styles.title}>{a.name || a.artistName || "Unnamed artist"}</div>
              {a.genre ? <div style={styles.meta}>{a.genre}</div> : null}
              {a.country ? <div style={styles.meta}>{a.country}</div> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: theme.spacing.xl,
    background: theme.colors.background,
    minHeight: "100vh",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.lg,
    background: theme.colors.surface,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.sm,
  },
  topbarRight: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: theme.spacing.lg,
  },
  card: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    textDecoration: "none",
    color: theme.colors.text.primary,
    background: theme.colors.surface,
    boxShadow: theme.shadows.sm,
    transition: theme.transitions.base,
  },
  title: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  meta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
  },
  btn: {
    ...theme.components.button(),
    padding: "8px 16px",
  },
  linkBtn: {
    ...theme.components.button("secondary"),
    padding: "8px 16px",
  },
  error: {
    color: theme.colors.semantic.error,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    background: "#FDF5F4",
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.semantic.error}`,
  },
};
