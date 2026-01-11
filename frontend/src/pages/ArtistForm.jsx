import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { contentApi } from "../api/content";

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
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 16 }}>
      <h2>{isEdit ? "Izmena umetnika" : "Kreiranje umetnika"}</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Ime
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Biografija
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Žanrovi (odvojeni zarezom)
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
          {isEdit && <Link to={`/artists/${artistId}`}>Detalji</Link>}
        </div>
      </form>
    </div>
  );
}
