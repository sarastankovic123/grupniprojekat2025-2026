import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { contentApi } from "../api/content";

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

export default function SongForm({ mode = "create" }) {
  const isEdit = mode === "edit";
  const { id, albumId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [durationSec, setDurationSec] = useState(""); // korisnik unosi broj u sekundama
  const [songAlbumId, setSongAlbumId] = useState(albumId || "");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const songId = useMemo(() => (isEdit ? id : null), [isEdit, id]);
  const albumIdTrimmed = useMemo(() => (songAlbumId || "").trim(), [songAlbumId]);

  useEffect(() => {
    if (!isEdit || !songId) return;

    (async () => {
      try {
        setLoading(true);
        const song = await contentApi.getSong(songId);

        setTitle(song?.title ?? "");
        // Duration comes as string from backend, parse it
        const dur = song?.duration ? toInt(song.duration) : "";
        setDurationSec(dur !== "" && Number.isFinite(dur) ? String(dur) : "");
        setSongAlbumId(song?.albumId ?? "");
      } catch (err) {
        setStatus({ type: "error", message: err.message || "Greška pri učitavanju pesme." });
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, songId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    const t = title.trim();
    if (!t) {
      setStatus({ type: "error", message: "Naziv pesme je obavezan." });
      return;
    }

    const dur = toInt(durationSec);
    if (!Number.isFinite(dur) || dur < 1 || dur > 7200) {
      setStatus({
        type: "error",
        message: "Trajanje mora biti broj u sekundama (1–7200).",
      });
      return;
    }

    const payload = {
      title: t,
      duration: dur,      // INT po backendu
      albumId: albumIdTrimmed, // OBAVEZNO po backendu
    };

    try {
      setLoading(true);

      if (isEdit) {
        await contentApi.updateSong(songId, payload);
        setStatus({ type: "success", message: "Pesma je izmenjena." });
        navigate(`/albums/${albumIdTrimmed}`, { replace: true });
      } else {
        await contentApi.createSong(albumIdTrimmed, payload);
        setStatus({ type: "success", message: "Pesma je kreirana." });
        navigate(`/albums/${albumIdTrimmed}`, { replace: true });
      }
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Greška pri čuvanju.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h2>{isEdit ? "Izmena pesme" : "Kreiranje pesme"}</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Naziv pesme
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Trajanje (sekunde)
          <input
            value={durationSec}
            onChange={(e) => setDurationSec(e.target.value)}
            inputMode="numeric"
            placeholder="npr. 225"
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
          <Link to={`/albums/${albumIdTrimmed}`}>Nazad na album</Link>
        </div>
      </form>
    </div>
  );
}
