// src/pages/AlbumDetails.jsx
import React, { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";

export default function AlbumDetails() {
  const { id } = useParams();
  const loc = useLocation();

  // Album prosledjen iz ArtistDetails preko state
  const albumFromState = loc.state?.album || null;
  const artistIdFromState = loc.state?.artistId || albumFromState?.artistId || albumFromState?.artist_id;

  const [album, setAlbum] = useState(albumFromState);
  const [songs, setSongs] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [songsErr, setSongsErr] = useState("");

  // Ako nemamo album u state (npr refresh na /albums/:id), pokusamo fallback:
  // - trenutno nemas /api/content/albums/:id, pa ne mozemo pouzdano.
  // Ostavljamo poruku.
  useEffect(() => {
    if (!albumFromState) {
      // nema backend rute za album by id -> ne mozemo fetchovati album
      // ali i dalje mozemo pokusati songs ako postoji endpoint (kod tebe trenutno ne postoji)
      setAlbum(null);
    }
  }, [albumFromState]);

  // Songs: pokusaj samo ako endpoint postoji (kod tebe ne postoji -> dobices 404)
  // Ostavio sam to kao "best effort". Ako ne zelis ni to, obrisemo ceo ovaj useEffect.
  useEffect(() => {
    let alive = true;

    async function loadSongs() {
      setSongsErr("");
      setLoadingSongs(true);
      try {
        const s = await apiFetch(`/api/content/albums/${id}/songs`);
        if (!alive) return;
        setSongs(Array.isArray(s) ? s : s?.items || []);
      } catch (e) {
        if (!alive) return;
        // Ovde ocekujemo 404 dok ne implementiras endpoint
        setSongsErr(e.message || "Songs endpoint missing");
      } finally {
        if (!alive) return;
        setLoadingSongs(false);
      }
    }

    loadSongs();
    return () => {
      alive = false;
    };
  }, [id]);

  const title = album?.title || album?.name || "(Album)";
  const year = album?.year;
  const genre = album?.genre;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          {artistIdFromState ? (
            <Link to={`/artists/${artistIdFromState}`}>← Back to artist</Link>
          ) : (
            <Link to="/artists">← Back</Link>
          )}

          <h2 style={{ margin: "8px 0 0" }}>{title}</h2>

          <div style={styles.meta}>
            {year ? <span>Year: {year}</span> : null}
            {genre ? <span>Genre: {genre}</span> : null}
            <span style={{ opacity: 0.7 }}>AlbumId: {id}</span>
          </div>

          {!album && (
            <div style={{ marginTop: 10, color: "crimson" }}>
              Album details nisu dostupni jer backend trenutno nema <code>/api/content/albums/:id</code>.
              <br />
              (Ako osvežiš stranicu, state se izgubi pa nema ni osnovnih podataka.)
            </div>
          )}
        </div>
      </div>

      <h3>Songs</h3>

      {loadingSongs ? <div>Loading songs...</div> : null}

      {songsErr ? (
        <div style={{ color: "crimson", marginBottom: 12 }}>
          {songsErr}
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>
            Najverovatnije ti fali endpoint: <code>GET /api/content/albums/:id/songs</code>
          </div>
        </div>
      ) : null}

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

        {!loadingSongs && !songsErr && songs.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No songs.</div>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24 },
  header: { marginBottom: 16 },
  meta: { display: "flex", gap: 12, fontSize: 13, opacity: 0.85, marginTop: 6, flexWrap: "wrap" },
  songList: { display: "grid", gap: 10 },
  songRow: { border: "1px solid #ddd", borderRadius: 12, padding: 12 },
  songMeta: { display: "flex", gap: 12, fontSize: 13, opacity: 0.85, marginTop: 6, flexWrap: "wrap" },
};
