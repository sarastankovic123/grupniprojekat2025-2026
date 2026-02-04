import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { contentApi } from "../api/content";
import { theme } from "../theme";

function splitGenres(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ArtistForm({ mode = "create" }) {
  const isEdit = mode === "edit";
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [genresText, setGenresText] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const artistId = useMemo(() => (isEdit ? id : null), [isEdit, id]);

  useEffect(() => {
    if (!isEdit || !artistId) return;

    (async () => {
      try {
        setLoading(true);
        const a = await contentApi.getArtist(artistId);

        setName(a?.name ?? "");
        setBio(a?.biography ?? a?.bio ?? "");
        const g = a?.genres ?? [];
        setGenresText(Array.isArray(g) ? g.join(", ") : "");
      } catch (err) {
        setStatus({ type: "error", message: err.message || "Greška pri učitavanju umetnika." });
      } finally {
        setLoading(false);
      }
    })();
  }, [isEdit, artistId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!name.trim()) {
      setStatus({ type: "error", message: "Ime umetnika je obavezno." });
      return;
    }

    const payload = {
      name: name.trim(),
      biography: bio.trim(),
      genres: splitGenres(genresText),
    };

    try {
      setLoading(true);

      if (isEdit) {
        await contentApi.updateArtist(artistId, payload);
        setStatus({ type: "success", message: "Umetnik je izmenjen." });
        navigate(`/artists/${artistId}`, { replace: true });
      } else {
        const created = await contentApi.createArtist(payload);
        const newId = created?.id ?? created?._id;
        setStatus({ type: "success", message: "Umetnik je kreiran." });
        navigate(newId ? `/artists/${newId}` : "/", { replace: true });
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
        <h2 style={styles.title}>{isEdit ? "Izmena umetnika" : "Kreiranje umetnika"}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Ime
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            Biografija
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              style={styles.textarea}
            />
          </label>

          <label style={styles.label}>
            Žanrovi (odvojeni zarezom)
            <input
              value={genresText}
              onChange={(e) => setGenresText(e.target.value)}
              placeholder="npr. Rock, Pop, Jazz"
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

          <div style={styles.links}>
            <Link to="/" style={styles.link}>
              Nazad
            </Link>
            {isEdit && (
              <Link to={`/artists/${artistId}`} style={styles.link}>
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
  textarea: {
    ...theme.components.input(),
    minHeight: 120,
    resize: "vertical",
    fontFamily: "inherit",
  },
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
