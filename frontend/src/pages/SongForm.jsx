import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { contentApi } from "../api/content";
import { theme } from "../theme";

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
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isEdit ? "Izmena pesme" : "Kreiranje pesme"}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Naziv pesme
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Trajanje (sekunde)
            <input
              value={durationSec}
              onChange={(e) => setDurationSec(e.target.value)}
              inputMode="numeric"
              placeholder="npr. 225"
              style={styles.input}
            />
          </label>

          <button disabled={loading} type="submit" style={styles.btn}>
            {loading ? "Čuvam..." : "Sačuvaj"}
          </button>

          {status.message && (
            <div
              style={{
                ...styles.message,
                ...(status.type === "success" ? styles.success : styles.error),
              }}
            >
              {status.message}
            </div>
          )}

          <div style={styles.linkContainer}>
            <Link to={`/albums/${albumIdTrimmed}`} style={styles.link}>
              Nazad na album
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: theme.colors.background,
    padding: theme.spacing.xl,
  },
  card: {
    ...theme.components.card(),
    width: 640,
    maxWidth: "90%",
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    marginBottom: theme.spacing.lg,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
  },
  label: theme.components.label(),
  input: theme.components.input(),
  btn: {
    ...theme.components.button(),
    marginTop: theme.spacing.sm,
  },
  message: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.base,
  },
  success: {
    background: "#E8F5E9",
    color: theme.colors.semantic.success,
    border: `1px solid ${theme.colors.semantic.success}`,
  },
  error: {
    background: "#FDF5F4",
    color: theme.colors.semantic.error,
    border: `1px solid ${theme.colors.semantic.error}`,
  },
  linkContainer: {
    marginTop: theme.spacing.md,
  },
  link: theme.components.link(),
};
