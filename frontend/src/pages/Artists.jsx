import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";
import NotificationBell from "../components/NotificationBell";

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
  page: { padding: 24 },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: 12,
  },
  card: {
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 12,
    textDecoration: "none",
    color: "inherit",
  },
  title: { fontWeight: 700 },
  meta: { fontSize: 13, opacity: 0.8, marginTop: 6 },
  btn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #111",
    cursor: "pointer",
    background: "white",
  },
  linkBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #111",
    textDecoration: "none",
    color: "inherit",
    background: "white",
    display: "inline-block",
  },
  error: { color: "crimson", marginBottom: 12 },
};
