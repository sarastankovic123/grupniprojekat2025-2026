import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";

function splitGenres(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AlbumForm() {
  const { artistId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [releaseDate, setReleaseDate] = useState(""); // yyyy-mm-dd
  const [genresText, setGenresText] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!title.trim()) {
      setStatus({ type: "error", message: "Naziv albuma je obavezan." });
      return;
    }

    const payload = {
      title: title.trim(),
      artistId, // OBAVEZNO po backendu
      releaseDate: releaseDate ? releaseDate : undefined,
      genres: splitGenres(genresText),
    };

    try {
      setLoading(true);
      const created = await apiFetch("/api/content/albums", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const albumId = created?.id || created?._id;
      setStatus({ type: "success", message: "Album je kreiran." });

      navigate(albumId ? `/albums/${albumId}` : `/artists/${artistId}`, { replace: true });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Greška pri kreiranju albuma." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h2>Kreiranje albuma</h2>

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
          <Link to={`/artists/${artistId}`}>Nazad na umetnika</Link>
        </div>
      </form>
    </div>
  );
}
