import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";

export default function AlbumDetails() {
  const { id } = useParams();
  const loc = useLocation();

  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "A";

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
            <Link to={`/admin/albums/${id}/songs/new`} style={styles.actionBtn}>
              + Add song
            </Link>
          </div>
        ) : null}
      </div>

      <h3>Songs</h3>

      <div style={styles.songList}>
        {songs.map((s, idx) => (
          <div key={s.id || s._id || s.songId || idx} style={styles.songRow}>
            <div style={{ fontWeight: 600 }}>{s.title || s.name || `Track ${idx + 1}`}</div>
            <div style={styles.songMeta}>
              {s.duration ? <span>Duration: {s.duration}</span> : null}
              {s.trackNo ? <span>Track: {s.trackNo}</span> : null}
            </div>
          </div>
        ))}

        {songs.length === 0 ? <div style={{ opacity: 0.8 }}>No songs.</div> : null}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24 },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
  },
  actions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  actionBtn: {
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid #111",
    textDecoration: "none",
    color: "inherit",
    background: "white",
    display: "inline-block",
  },
  meta: { display: "flex", gap: 12, fontSize: 13, opacity: 0.85, marginTop: 6, flexWrap: "wrap" },
  songList: { display: "grid", gap: 10 },
  songRow: { border: "1px solid #ddd", borderRadius: 12, padding: 12 },
  songMeta: { display: "flex", gap: 12, fontSize: 13, opacity: 0.85, marginTop: 6, flexWrap: "wrap" },
};
