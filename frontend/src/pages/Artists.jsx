import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getArtists, createArtist } from "../api/artists";

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [biography, setBiography] = useState("");
  const [genres, setGenres] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);

    getArtists()
      .then((data) => setArtists(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await createArtist({
        name,
        biography,
        genres: genres
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
      });

      setName("");
      setBiography("");
      setGenres("");
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Artists</h1>

      <h2>Add artist</h2>
      <form onSubmit={onSubmit} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            required
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <textarea
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
            placeholder="Biography"
            rows={3}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            value={genres}
            onChange={(e) => setGenres(e.target.value)}
            placeholder='Genres (comma separated, e.g. "House, Electronic")'
          />
        </div>

        <button type="submit">Create</button>
      </form>

      {loading && <p>Loading artists...</p>}
      {error && <p>Error: {error}</p>}

      {!loading && artists.length === 0 ? (
        <p>No artists found.</p>
      ) : (
        <ul>
          {artists.map((a) => (
            <li key={a.id ?? a._id} style={{ marginBottom: 16 }}>
              <div>
                <b>
                  <Link to={`/artists/${a.id ?? a._id}`}>{a.name}</Link>
                </b>
              </div>

              {a.biography && <div>{a.biography}</div>}
              {a.genres?.length > 0 && (
                <div>Genres: {a.genres.join(", ")}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
