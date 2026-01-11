import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";

export default function ArtistDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && user?.role === "A";

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
  page: { padding: 24 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    gap: 12,
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
  meta: {
    display: "flex",
    gap: 12,
    fontSize: 13,
    opacity: 0.85,
    marginTop: 6,
    flexWrap: "wrap",
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 },
  card: { border: "1px solid #ddd", borderRadius: 12, padding: 12, textDecoration: "none", color: "inherit" },
  title: { fontWeight: 700 },
  metaSmall: { fontSize: 13, opacity: 0.8, marginTop: 6 },
};
