import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { contentApi } from "../api/content";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";

export default function ArtistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === "ADMIN" || user?.role === "A");

  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const a = await apiFetch(`/api/content/artists/${id}`);
        const al = await apiFetch(`/api/content/artists/${id}/albums`);

        if (!alive) return;
        setArtist(a);
        setAlbums(Array.isArray(al) ? al : al?.items || []);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load artist");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  async function handleDeleteArtist() {
    if (!window.confirm(`Delete artist "${artist?.name || 'this artist'}"? This will fail if albums exist.`)) {
      return;
    }

    try {
      await contentApi.deleteArtist(id);
      navigate("/", { replace: true });
    } catch (err) {
      alert(err.message || "Failed to delete artist");
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (err) return <div style={{ padding: 24, color: "crimson" }}>{err}</div>;

  const name = artist?.name || artist?.artistName || "Artist";

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <Link to="/">← Back</Link>
          <h2 style={{ margin: "8px 0 0" }}>{name}</h2>
          <div style={styles.meta}>
            {artist?.genre ? <span>Genre: {artist.genre}</span> : null}
            {artist?.country ? <span>Country: {artist.country}</span> : null}
          </div>
        </div>

        {isAdmin ? (
          <div style={styles.actions}>
            <Link to={`/admin/artists/${id}/edit`} style={styles.actionBtn}>
              Edit artist
            </Link>
            <button onClick={handleDeleteArtist} style={styles.deleteBtn}>
              Delete artist
            </button>
            <Link to={`/admin/artists/${id}/albums/new`} style={styles.actionBtn}>
              + Add album
            </Link>
          </div>
        ) : null}
      </div>

      <h3>Albums</h3>
      <div style={styles.grid}>
        {albums.map((al) => {
          const albumId = al.id || al._id || al.albumId;
          return (
            <Link
              key={albumId || al.title}
              to={`/albums/${albumId}`}
              state={{ album: al, artistId: id }}
              style={styles.card}
            >
              <div style={styles.title}>{al.title || al.name || "Untitled album"}</div>
              {al.year ? <div style={styles.metaSmall}>Year: {al.year}</div> : null}
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    background: theme.colors.surface,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.shadows.sm,
  },
  actions: {
    display: "flex",
    gap: theme.spacing.sm,
    alignItems: "center",
    flexWrap: "wrap",
  },
  actionBtn: {
    ...theme.components.button("secondary"),
    padding: "8px 16px",
  },
  deleteBtn: {
    ...theme.components.button("danger"),
    padding: "8px 16px",
  },
  meta: {
    display: "flex",
    gap: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
    flexWrap: "wrap",
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
  },
  metaSmall: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
  },
};
