import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getArtistById, getAlbumsByArtist } from "../api/artists";

export default function ArtistDetails() {
  const { id } = useParams();

  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);

    getArtistById(id)
      .then(setArtist)
      .catch((e) => setError(e.message));

    getAlbumsByArtist(id)
      .then(setAlbums)
      .catch(() => setAlbums([]));
  }, [id]);

  if (error) return <p>Error: {error}</p>;
  if (!artist) return <p>Loading...</p>;

  return (
    <div style={{ padding: 24 }}>
      <Link to="/">← Back</Link>

      <h1>{artist.name}</h1>
      {artist.biography && <p>{artist.biography}</p>}
      {artist.genres?.length > 0 && (
        <p>
          <b>Genres:</b> {artist.genres.join(", ")}
        </p>
      )}

      <h2>Albums</h2>
      {albums.length === 0 ? (
        <p>No albums.</p>
      ) : (
        <ul>
          {albums.map((al) => (
            <li key={al.id ?? al._id}>{al.title ?? al.name ?? "Album"}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
