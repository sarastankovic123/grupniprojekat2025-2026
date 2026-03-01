import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { contentApi } from "../api/content";
import { useAuth } from "../auth/AuthContext";
import SearchBar from "../components/SearchBar";
import { theme } from "../theme";

const getInitials = (text) => {
  if (!text) return '🎵';
  const words = text.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const formatDuration = (durationStr) => {
  if (!durationStr) return '--:--';

  const seconds = parseInt(durationStr, 10);
  if (isNaN(seconds) || seconds < 0) return '--:--';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
};

export default function AlbumDetails() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === "ADMIN" || user?.role === "A");

  const artistIdFromState =
    loc.state?.artistId || loc.state?.album?.artistId || loc.state?.album?.artist_id;

  const [album, setAlbum] = useState(loc.state?.album || null);
  const [songs, setSongs] = useState([]);
  const [artist, setArtist] = useState(null);
  const [songSearch, setSongSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [songsLoading, setSongsLoading] = useState(false);
  const [err, setErr] = useState("");
  const [audioErr, setAudioErr] = useState("");
  const [nowPlaying, setNowPlaying] = useState(null); // { id, title }
  const [audioSrc, setAudioSrc] = useState("");
  const audioRef = useRef(null);

  const [userRatings, setUserRatings] = useState({});
  const [hoverRatings, setHoverRatings] = useState({});

  const backLink = useMemo(() => {
    return artistIdFromState ? `/artists/${artistIdFromState}` : "/";
  }, [artistIdFromState]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      const currentAlbumID = album?.id || album?._id || album?.albumId;
      const shouldFetchAlbum = !album || currentAlbumID !== id;

      if (shouldFetchAlbum) {
        setLoading(true);
      } else {
        setSongsLoading(true);
      }

      try {
        const songsUrl = `/api/content/albums/${id}/songs${songSearch ? `?search=${encodeURIComponent(songSearch)}` : ""}`;

        let a = album;
        if (shouldFetchAlbum) {
          a = await apiFetch(`/api/content/albums/${id}`);
          if (!alive) return;
          setAlbum(a);
        }

        const s = await apiFetch(songsUrl);

        if (!alive) return;

        const songsArray = Array.isArray(s) ? s : [];
        setSongs(songsArray);

        if (isAuthenticated && songsArray.length > 0) {
          loadUserRatings(songsArray);
        } else if (!isAuthenticated || songsArray.length === 0) {
          setUserRatings({});
        }

        if (shouldFetchAlbum && (a.artistId || a.artist_id)) {
          try {
            const artistData = await apiFetch(`/api/content/artists/${a.artistId || a.artist_id}`);
            if (alive) setArtist(artistData);
          } catch (e) {
            console.log('Could not fetch artist:', e);
          }
        }
      } catch (e) {
        if (!alive) return;

        const msg = e.message || "Failed to load album";

        if (msg.toLowerCase().includes("authorization") || msg.includes("401")) {
          setErr("You must be logged in to view album details and songs.");
        } else {
          setErr(msg);
        }
      } finally {
        if (!alive) return;
        setLoading(false);
        setSongsLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, songSearch, isAuthenticated]);

  useEffect(() => {
    if (!audioSrc) return;
    setAudioErr("");

    const el = audioRef.current;
    if (!el) return;

    el.load();
    el.play().catch(() => {});
  }, [audioSrc]);

  async function handleDeleteAlbum() {
    if (!window.confirm(`Delete album "${album?.title || 'this album'}"? This will fail if songs exist.`)) {
      return;
    }

    try {
      await contentApi.deleteAlbum(id);
      navigate(backLink, { replace: true });
    } catch (err) {
      alert(err.message || "Failed to delete album");
    }
  }

  async function handleDeleteSong(songId, songTitle) {
    if (!window.confirm(`Delete song "${songTitle}"?`)) {
      return;
    }

    try {
      await contentApi.deleteSong(songId);
      const songsUrl = `/api/content/albums/${id}/songs${songSearch ? `?search=${encodeURIComponent(songSearch)}` : ""}`;
      const updatedSongs = await apiFetch(songsUrl);
      setSongs(Array.isArray(updatedSongs) ? updatedSongs : []);
    } catch (err) {
      alert(err.message || "Failed to delete song");
    }
  }

  async function loadUserRatings(songsArray) {
    const ratingsMap = {};

    await Promise.all(
      songsArray.map(async (song) => {
        const songId = song.id || song._id || song.songId;
        if (!songId) return;

        try {
          const response = await contentApi.getUserRating(songId);
          if (response && response.rating) {
            ratingsMap[songId] = response.rating;
          }
        } catch (err) {
          console.log(`No rating for song ${songId}`);
        }
      })
    );

    setUserRatings(ratingsMap);
  }

  async function handleSetRating(songId, rating) {
    if (!isAuthenticated) {
      alert('Please log in to rate songs');
      return;
    }

    try {
      await contentApi.setRating(songId, rating);
      setUserRatings(prev => ({ ...prev, [songId]: rating }));
    } catch (err) {
      alert(err.message || 'Failed to save rating');
    }
  }

  async function handleDeleteRating(songId, event) {
    event.stopPropagation();

    if (!userRatings[songId]) return;

    if (!window.confirm('Delete your rating for this song?')) {
      return;
    }

    try {
      await contentApi.deleteRating(songId);
      setUserRatings(prev => {
        const updated = { ...prev };
        delete updated[songId];
        return updated;
      });
    } catch (err) {
      alert(err.message || 'Failed to delete rating');
    }
  }

  async function togglePlay(song) {
    setAudioErr("");

    if (!isAuthenticated) {
      setErr("You must be logged in to play songs.");
      return;
    }

    const songId = song.id || song._id || song.songId;
    if (!songId) return;

    if (!song.audioFile) {
      setAudioErr("Audio is not available for this song yet.");
      return;
    }

    const el = audioRef.current;
    const isSame = nowPlaying?.id === songId;

    if (!isSame) {
      setNowPlaying({ id: songId, title: song.title || song.name || `Track ${songId}` });
      setAudioSrc(`/api/content/songs/${songId}/audio`);
      return;
    }

    if (!el) return;
    if (el.paused) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }

  async function handleUploadAudio(songId, file) {
    if (!file) return;
    try {
      await contentApi.uploadSongAudio(songId, file);
      setSongs((prev) =>
        prev.map((s) => {
          const id = s.id || s._id || s.songId;
          if (id !== songId) return s;
          return { ...s, audioFile: s.audioFile || "uploaded" };
        })
      );
      alert("Audio uploaded.");
    } catch (e) {
      alert(e.message || "Failed to upload audio");
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;

  if (err) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ color: "crimson", marginBottom: 10 }}>{err}</div>
        {err.includes("logged in") ? <Link to="/login">Login</Link> : <Link to={backLink}>← Back</Link>}
      </div>
    );
  }

  const title = album?.title || album?.name || "(Album)";
  const release = album?.release || album?.releaseDate || album?.year;
  const genres = Array.isArray(album?.genres) ? album.genres : [];
  const initials = getInitials(title);
  const artistName = artist?.name || artist?.artistName || "Unknown Artist";

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.albumCover}>
            <div style={styles.albumCoverInitials}>{initials}</div>
          </div>

          <div style={styles.albumInfo}>
            <Link to={backLink} style={styles.backLink}>
              ← Back to {artistIdFromState ? 'Artist' : 'Artists'}
            </Link>

            <h1 style={styles.albumTitle}>{title}</h1>

            {artist && (
              <Link to={`/artists/${artistIdFromState}`} style={styles.artistLink}>
                {artistName}
              </Link>
            )}

            <div style={styles.metaBadges}>
              {release && <span style={styles.metaBadge}>{release}</span>}
              {genres.slice(0, 3).map((genre, idx) => (
                <span key={idx} style={styles.metaBadge}>{genre}</span>
              ))}
              {songs.length > 0 && (
                <span style={styles.metaBadge}>{songs.length} track{songs.length !== 1 ? 's' : ''}</span>
              )}
            </div>

            {isAdmin && (
              <div style={styles.heroActions}>
                <Link to={`/admin/albums/${id}/edit`} style={styles.heroActionBtn}>
                  Edit Album
                </Link>
                <button onClick={handleDeleteAlbum} style={styles.heroDangerBtn}>
                  Delete Album
                </button>
                <Link to={`/admin/albums/${id}/songs/new`} style={styles.heroPrimaryBtn}>
                  + Add Song
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.songsSection}>
        <h2 style={styles.sectionTitle}>Songs</h2>
        <div style={styles.searchRow}>
          <SearchBar
            value={songSearch}
            onChange={setSongSearch}
            placeholder="Search songs by title..."
          />
        </div>
        {songsLoading && <div style={styles.inlineLoading}>Filtering songs...</div>}

        {audioErr && <div style={styles.audioError}>{audioErr}</div>}

        {nowPlaying && (
          <div style={styles.playerBar}>
            <div style={styles.playerTitle}>
              Now playing: <strong>{nowPlaying.title}</strong>
            </div>
            <audio
              ref={audioRef}
              src={audioSrc}
              controls
              preload="metadata"
              onError={() => setAudioErr("Failed to load audio. Try again or upload audio for this song.")}
            />
          </div>
        )}

        {songs.length === 0 ? (
          <div style={styles.emptyState}>No songs yet</div>
        ) : (
          <div style={styles.grid}>
            {songs.map((s, index) => {
              const songId = s.id || s._id || s.songId;
              const trackNo = s.trackNo || index + 1;
              const canPlay = Boolean(s.audioFile);
              const isCurrent = nowPlaying?.id === songId;

              return (
                <div
                  key={songId || index}
                  className="song-card"
                  style={{
                    ...styles.card,
                    animation: 'fadeIn 0.6s ease-out',
                    animationDelay: `${0.05 * index}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <div style={styles.trackBadge}>
                    {String(trackNo).padStart(2, '0')}
                  </div>

                  <button
                    style={canPlay ? styles.playButton : styles.playButtonDisabled}
                    disabled={!canPlay}
                    title={canPlay ? (isCurrent ? "Play / pause" : "Play") : "No audio uploaded"}
                    onClick={() => togglePlay(s)}
                  >
                    {isCurrent ? "⏯" : "▶"}
                  </button>

                  <div style={styles.songTitle}>
                    {s.title || s.name || `Track ${index + 1}`}
                  </div>

                  {isAuthenticated && (
                    <div style={styles.ratingContainer}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = userRatings[songId] || 0;
                        const hoverRating = hoverRatings[songId] || 0;
                        const displayRating = hoverRating || currentRating;
                        const isFilled = star <= displayRating;

                        return (
                          <span
                            key={star}
                            style={{
                              ...styles.star,
                              color: isFilled ? theme.colors.primary : theme.colors.border,
                            }}
                            onMouseEnter={() => setHoverRatings(prev => ({ ...prev, [songId]: star }))}
                            onMouseLeave={() => setHoverRatings(prev => ({ ...prev, [songId]: 0 }))}
                            onClick={() => handleSetRating(songId, star)}
                            title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                          >
                            {isFilled ? '★' : '☆'}
                          </span>
                        );
                      })}
                      {userRatings[songId] && (
                        <button
                          style={styles.deleteRatingBtn}
                          onClick={(e) => handleDeleteRating(songId, e)}
                          title="Delete rating"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}

                  {s.duration && (
                    <div style={styles.durationBadge}>
                      {formatDuration(s.duration)}
                    </div>
                  )}

                  {isAdmin && (
                    <div style={styles.cardActionsVisible}>
                      <Link to={`/admin/songs/${songId}/edit`} style={styles.editBtnSmall}>
                        Edit
                      </Link>
                      <label style={styles.uploadBtnSmall}>
                        Upload audio
                        <input
                          type="file"
                          accept="audio/*"
                          style={{ display: "none" }}
                          onChange={(e) => handleUploadAudio(songId, e.target.files?.[0])}
                        />
                      </label>
                      <button onClick={() => handleDeleteSong(songId, s.title)} style={styles.deleteBtnSmall}>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    background: theme.colors.background,
    minHeight: "100vh",
  },
  hero: {
    background: theme.gradients.heroOlive,
    padding: `${theme.spacing['3xl']} ${theme.spacing.xl}`,
    marginBottom: theme.spacing['2xl'],
  },
  heroContent: {
    display: 'flex',
    gap: theme.spacing.xl,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  albumCover: {
    width: '240px',
    height: '240px',
    borderRadius: theme.radius.lg,
    background: 'linear-gradient(135deg, #6B8E23 0%, #556B2F 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: theme.shadows.lg,
    flexShrink: 0,
  },
  albumCoverInitials: {
    fontSize: '80px',
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    userSelect: 'none',
  },
  albumInfo: {
    flex: 1,
    minWidth: '300px',
  },
  backLink: {
    color: 'white',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: theme.spacing.md,
    transition: theme.transitions.base,
    opacity: 0.9,
  },
  albumTitle: {
    fontSize: '48px',
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    margin: `${theme.spacing.sm} 0`,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  artistLink: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.medium,
    textDecoration: 'none',
    display: 'inline-block',
    marginBottom: theme.spacing.md,
    transition: theme.transitions.base,
  },
  metaBadges: {
    display: 'flex',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
  },
  metaBadge: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '6px 16px',
    borderRadius: theme.radius.sm,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  heroActions: {
    display: 'flex',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
    flexWrap: 'wrap',
  },
  heroActionBtn: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    textDecoration: 'none',
    display: 'inline-block',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: theme.transitions.base,
    cursor: 'pointer',
  },
  heroDangerBtn: {
    background: 'rgba(168, 72, 66, 0.9)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: theme.transitions.base,
    cursor: 'pointer',
  },
  heroPrimaryBtn: {
    background: 'white',
    color: theme.colors.primary,
    padding: '10px 20px',
    borderRadius: theme.radius.md,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    textDecoration: 'none',
    display: 'inline-block',
    border: 'none',
    transition: theme.transitions.base,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  songsSection: {
    padding: `0 ${theme.spacing.xl} ${theme.spacing.xl}`,
  },
  searchRow: {
    maxWidth: "420px",
    marginBottom: theme.spacing.lg,
  },
  inlineLoading: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    marginTop: `-${theme.spacing.md}`,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  playerBar: {
    display: "flex",
    gap: theme.spacing.md,
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    background: theme.colors.surface,
    boxShadow: theme.shadows.sm,
  },
  playerTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.md,
  },
  audioError: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    border: "1px solid rgba(168, 72, 66, 0.35)",
    background: "rgba(168, 72, 66, 0.08)",
    color: theme.colors.text.primary,
  },
  emptyState: {
    padding: theme.spacing['2xl'],
    textAlign: 'center',
    color: theme.colors.text.light,
    fontSize: theme.typography.fontSize.md,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: theme.spacing.lg,
  },
  card: {
    position: 'relative',
    minHeight: '180px',
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    boxShadow: theme.shadows.sm,
    transition: theme.transitions.base,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'default',
  },
  trackBadge: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: 'rgba(85, 107, 47, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  playButton: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(85, 107, 47, 0.1)',
    border: `2px solid ${theme.colors.primary}`,
    color: theme.colors.primary,
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 1,
    transition: theme.transitions.base,
    marginBottom: theme.spacing.md,
  },
  playButtonDisabled: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(85, 107, 47, 0.06)',
    border: `2px solid ${theme.colors.border}`,
    color: theme.colors.text.light,
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'not-allowed',
    opacity: 0.7,
    transition: theme.transitions.base,
    marginBottom: theme.spacing.md,
  },
  songTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  ratingContainer: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  star: {
    fontSize: '20px',
    cursor: 'pointer',
    transition: theme.transitions.fast,
    userSelect: 'none',
  },
  deleteRatingBtn: {
    marginLeft: theme.spacing.xs,
    background: 'transparent',
    border: 'none',
    color: theme.colors.text.light,
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
    transition: theme.transitions.fast,
    opacity: 0.7,
  },
  durationBadge: {
    background: 'rgba(85, 107, 47, 0.1)',
    color: theme.colors.primary,
    padding: '4px 12px',
    borderRadius: theme.radius.sm,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  cardActions: {
    position: 'absolute',
    bottom: theme.spacing.sm,
    display: 'flex',
    gap: theme.spacing.xs,
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  cardActionsVisible: {
    display: 'flex',
    gap: theme.spacing.xs,
    marginTop: 'auto',
    paddingTop: theme.spacing.sm,
  },
  editBtnSmall: {
    ...theme.components.button('secondary'),
    padding: '6px 12px',
    fontSize: theme.typography.fontSize.sm,
  },
  uploadBtnSmall: {
    ...theme.components.button('secondary'),
    padding: '6px 12px',
    fontSize: theme.typography.fontSize.sm,
    cursor: 'pointer',
  },
  deleteBtnSmall: {
    ...theme.components.button('danger'),
    padding: '6px 12px',
    fontSize: theme.typography.fontSize.sm,
  },
};
