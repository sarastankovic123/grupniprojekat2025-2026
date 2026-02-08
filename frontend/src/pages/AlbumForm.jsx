import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { contentApi } from "../api/content";
import { theme } from "../theme";
import GenreChipInput from "../components/GenreChipInput";

export default function AlbumForm({ mode = "create" }) {
  const isEdit = mode === "edit";
  const { id, artistId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [releaseDate, setReleaseDate] = useState(""); // yyyy-mm-dd
  const [genres, setGenres] = useState([]);
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
        setGenres(Array.isArray(album?.genres) ? album.genres : []);
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
      genres,
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
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isEdit ? "Izmena albuma" : "Kreiranje albuma"}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Naziv albuma
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Datum izlaska (opciono)
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              style={styles.input}
            />
          </label>

          <GenreChipInput value={genres} onChange={setGenres} />

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

          <div style={styles.links}>
            <Link to="/" style={styles.link}>
              Nazad
            </Link>
            {isEdit && (
              <Link to={`/albums/${albumId}`} style={styles.link}>
                Detalji
              </Link>
            )}
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
  links: {
    display: "flex",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  link: theme.components.link(),
};
