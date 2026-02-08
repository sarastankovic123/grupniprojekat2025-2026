import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { contentApi } from "../api/content";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";

// Helper function to generate initials from album title
const getInitials = (text) => {
  if (!text) return '🎵';
  const words = text.trim().split(' ');
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Helper function to format duration (converts seconds to MM:SS or HH:MM:SS)
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

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Rating state: map of songId -> rating (1-5)
  const [userRatings, setUserRatings] = useState({});
  const [hoverRatings, setHoverRatings] = useState({});

  const backLink = useMemo(() => {
    return artistIdFromState ? `/artists/${artistIdFromState}` : "/";
  }, [artistIdFromState]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);

      try {
        const [a, s] = await Promise.all([
          apiFetch(`/api/content/albums/${id}`),
          apiFetch(`/api/content/albums/${id}/songs`),
        ]);

        if (!alive) return;
        setAlbum(a);
        const songsArray = Array.isArray(s) ? s : [];
        setSongs(songsArray);

        // Load user ratings for all songs (if authenticated)
        if (isAuthenticated && songsArray.length > 0) {
          loadUserRatings(songsArray);
        }

        // Fetch artist info if we have artistId
        if (a.artistId || a.artist_id) {
          try {
            const artistData = await apiFetch(`/api/content/artists/${a.artistId || a.artist_id}`);
            if (alive) setArtist(artistData);
          } catch (e) {
            // Artist fetch is optional, don't fail the whole page
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
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

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
      const updatedSongs = await apiFetch(`/api/content/albums/${id}/songs`);
      setSongs(Array.isArray(updatedSongs) ? updatedSongs : []);
    } catch (err) {
      alert(err.message || "Failed to delete song");
    }
  }

  // Load user ratings for all songs
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
          // Silently ignore errors (e.g., 404 for no rating)
          console.log(`No rating for song ${songId}`);
        }
      })
    );

    setUserRatings(ratingsMap);
  }

  // Handle setting a rating
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

  // Handle deleting a rating
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
      {/* Hero Section */}
      <div style={styles.hero}>
        <div style={styles.heroContent}>
          {/* Album Cover Placeholder */}
          <div style={styles.albumCover}>
            <div style={styles.albumCoverInitials}>{initials}</div>
          </div>

          {/* Album Info */}
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

            {/* Admin Actions */}
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

      {/* Songs Section */}
      <div style={styles.songsSection}>
        <h2 style={styles.sectionTitle}>Songs</h2>

        {songs.length === 0 ? (
          <div style={styles.emptyState}>No songs yet</div>
        ) : (
          <div style={styles.grid}>
            {songs.map((s, index) => {
              const songId = s.id || s._id || s.songId;
              const trackNo = s.trackNo || index + 1;

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
                  {/* Track Number Badge */}
                  <div style={styles.trackBadge}>
                    {String(trackNo).padStart(2, '0')}
                  </div>

                  {/* Play Button Placeholder */}
                  <button
                    style={styles.playButton}
                    disabled
                    title="Audio playback coming soon"
                  >
                    ▶
                  </button>

                  {/* Song Title */}
                  <div style={styles.songTitle}>
                    {s.title || s.name || `Track ${index + 1}`}
                  </div>

                  {/* Star Rating */}
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

                  {/* Duration Badge */}
                  {s.duration && (
                    <div style={styles.durationBadge}>
                      {formatDuration(s.duration)}
                    </div>
                  )}

                  {/* Admin Actions (revealed on hover) */}
                  {isAdmin && (
                    <div className="song-card-actions" style={styles.cardActions}>
                      <Link to={`/admin/songs/${songId}/edit`} style={styles.editBtnSmall}>
                        Edit
                      </Link>
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
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
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
  editBtnSmall: {
    ...theme.components.button('secondary'),
    padding: '6px 12px',
    fontSize: theme.typography.fontSize.sm,
  },
  deleteBtnSmall: {
    ...theme.components.button('danger'),
    padding: '6px 12px',
    fontSize: theme.typography.fontSize.sm,
  },
};
