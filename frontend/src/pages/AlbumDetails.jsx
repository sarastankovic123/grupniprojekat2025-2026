import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { contentApi } from "../api/content";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";

export default function AlbumDetails() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === "ADMIN" || user?.role === "A");

  // state može pomoći za "Back to artist"
  const artistIdFromState =
    loc.state?.artistId || loc.state?.album?.artistId || loc.state?.album?.artist_id;

  const [album, setAlbum] = useState(loc.state?.album || null);
  const [songs, setSongs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const backLink = useMemo(() => {
    return artistIdFromState ? `/artists/${artistIdFromState}` : "/";
  }, [artistIdFromState]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);

      try {
        // Ova dva endpointa postoje (poslao si kod)
        const [a, s] = await Promise.all([
          apiFetch(`/api/content/albums/${id}`),
          apiFetch(`/api/content/albums/${id}/songs`),
        ]);

        if (!alive) return;
        setAlbum(a);
        setSongs(Array.isArray(s) ? s : []);
      } catch (e) {
        if (!alive) return;

        const msg = e.message || "Failed to load album";

        // gateway 401 kad nema token
        if (msg.toLowerCase().includes("authorization") || msg.includes("401")) {
          setErr("Moraš biti ulogovan da bi video detalje albuma i pesme.");
        } else {
          setErr(msg);
        }
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

  async function handleDeleteAlbum() {
    if (!window.confirm(`Delete album "${album?.title || 'this album'}"? This will fail if songs exist.`)) {
      return;
    }

    try {
      await contentApi.deleteAlbum(id);
      navigate(backLink, { replace: true });
    } catch (err) {
      alert(err.message || "Failed to delete album");
    }
  }

  async function handleDeleteSong(songId, songTitle) {
    if (!window.confirm(`Delete song "${songTitle}"?`)) {
      return;
    }

    try {
      await contentApi.deleteSong(songId);
      // Reload songs list
      const updatedSongs = await apiFetch(`/api/content/albums/${id}/songs`);
      setSongs(Array.isArray(updatedSongs) ? updatedSongs : []);
    } catch (err) {
      alert(err.message || "Failed to delete song");
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>
        {err.includes("ulogovan") ? <Link to="/login">Login</Link> : <Link to={backLink}>← Back</Link>}
      </div>
    );
  }

  const title = album?.title || album?.name || "(Album)";
  const release = album?.release || album?.releaseDate;
  const genres = Array.isArray(album?.genres) ? album.genres : [];

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <Link to={backLink}>← Back</Link>

          <h2 style={{ margin: "8px 0 0" }}>{title}</h2>

          <div style={styles.meta}>
            {release ? <span>Release: {release}</span> : null}
            {genres.length ? <span>Genres: {genres.join(", ")}</span> : null}
            <span style={{ opacity: 0.7 }}>AlbumId: {id}</span>
          </div>
        </div>

        {isAdmin ? (
          <div style={styles.actions}>
            <Link to={`/admin/albums/${id}/edit`} style={styles.actionBtn}>
              Edit album
            </Link>
            <button onClick={handleDeleteAlbum} style={styles.deleteBtn}>
              Delete album
            </button>
            <Link to={`/admin/albums/${id}/songs/new`} style={styles.actionBtn}>
              + Add song
            </Link>
          </div>
        ) : null}
      </div>

      <h3>Songs</h3>

      <div style={styles.songList}>
        {songs.map((s, idx) => {
          const songId = s.id || s._id || s.songId;
          return (
            <div key={songId || idx} style={styles.songRow}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.title || s.name || `Track ${idx + 1}`}</div>
                <div style={styles.songMeta}>
                  {s.duration ? <span>Duration: {s.duration}</span> : null}
                  {s.trackNo ? <span>Track: {s.trackNo}</span> : null}
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Link to={`/admin/songs/${songId}/edit`} style={styles.editBtnSmall}>
                    Edit
                  </Link>
                  <button onClick={() => handleDeleteSong(songId, s.title)} style={styles.deleteBtnSmall}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {songs.length === 0 ? <div style={{ opacity: 0.8 }}>No songs.</div> : null}
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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
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
  meta: {
    display: "flex",
    gap: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
    flexWrap: "wrap",
  },
  songList: {
    display: "grid",
    gap: theme.spacing.md,
  },
  songRow: {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: theme.colors.surface,
    boxShadow: theme.shadows.sm,
    transition: theme.transitions.base,
  },
  songMeta: {
    display: "flex",
    gap: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
    flexWrap: "wrap",
  },
  deleteBtn: {
    ...theme.components.button("danger"),
    padding: "8px 16px",
  },
  editBtnSmall: {
    ...theme.components.button("secondary"),
    padding: "6px 12px",
    fontSize: theme.typography.fontSize.sm,
  },
  deleteBtnSmall: {
    ...theme.components.button("danger"),
    padding: "6px 12px",
    fontSize: theme.typography.fontSize.sm,
  },
};
