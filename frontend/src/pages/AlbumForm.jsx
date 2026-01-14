import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { contentApi } from "../api/content";

function splitGenres(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AlbumForm({ mode = "create" }) {
  const isEdit = mode === "edit";
  const { id, artistId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [releaseDate, setReleaseDate] = useState(""); // yyyy-mm-dd
  const [genresText, setGenresText] = useState("");
  const [albumArtistId, setAlbumArtistId] = useState(artistId || "");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const albumId = useMemo(() => (isEdit ? id : null), [isEdit, id]);

  useEffect(() => {
    if (!isEdit || !albumId) return;

    (async () => {
      try {
        setLoading(true);
        const album = await contentApi.getAlbum(albumId);

        setTitle(album?.title ?? "");
        setReleaseDate(album?.releaseDate ?? "");
        const g = album?.genres ?? [];
        setGenresText(Array.isArray(g) ? g.join(", ") : "");
        setAlbumArtistId(album?.artistId ?? "");
      } catch (err) {
        setStatus({ type: "error", message: err.message || "Greška pri učitavanju albuma." });
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, albumId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!title.trim()) {
      setStatus({ type: "error", message: "Naziv albuma je obavezan." });
      return;
    }

    const payload = {
      title: title.trim(),
      artistId: albumArtistId, // OBAVEZNO po backendu
      releaseDate: releaseDate ? releaseDate : undefined,
      genres: splitGenres(genresText),
    };

    try {
      setLoading(true);

      if (isEdit) {
        await contentApi.updateAlbum(albumId, payload);
        setStatus({ type: "success", message: "Album je izmenjen." });
        navigate(`/albums/${albumId}`, { replace: true });
      } else {
        const created = await contentApi.createAlbum(artistId, payload);
        const newAlbumId = created?.id || created?._id;
        setStatus({ type: "success", message: "Album je kreiran." });
        navigate(newAlbumId ? `/albums/${newAlbumId}` : `/artists/${artistId}`, { replace: true });
      }
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Greška pri čuvanju." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h2>{isEdit ? "Izmena albuma" : "Kreiranje albuma"}</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Naziv albuma
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Datum izlaska (opciono)
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Žanrovi (zarezom odvojeni, max 10)
          <input
            value={genresText}
            onChange={(e) => setGenresText(e.target.value)}
            placeholder="npr. Rock, Pop, Jazz"
          />
        </label>

        <button disabled={loading} type="submit">
          {loading ? "Čuvam..." : "Sačuvaj"}
        </button>

        {status.message && (
          <div
            style={{
              padding: 10,
              borderRadius: 8,
              background: status.type === "success" ? "#e9f7ef" : "#fdecea",
            }}
          >
            {status.message}
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <Link to="/">Nazad</Link>
          {isEdit && <Link to={`/albums/${albumId}`}>Detalji</Link>}
        </div>
      </form>
    </div>
  );
}
