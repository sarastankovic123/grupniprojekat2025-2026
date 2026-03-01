import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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

export default function ArtistDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = isAuthenticated && (user?.role === "ADMIN" || user?.role === "A");

  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [albumSearch, setAlbumSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [err, setErr] = useState("");

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      const currentArtistID = artist?.id || artist?._id || artist?.artistId;
      const shouldFetchArtist = !artist || currentArtistID !== id;

      if (shouldFetchArtist) {
        setLoading(true);
      } else {
        setAlbumsLoading(true);
      }

      try {
        const albumsUrl = `/api/content/artists/${id}/albums${albumSearch ? `?search=${encodeURIComponent(albumSearch)}` : ""}`;
        let a = artist;
        if (shouldFetchArtist) {
          a = await apiFetch(`/api/content/artists/${id}`);
          if (!alive) return;
          setArtist(a);
        }

        const al = await apiFetch(albumsUrl);

        if (!alive) return;
        setAlbums(Array.isArray(al) ? al : al?.items || []);

      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load artist");
      } finally {
        if (!alive) return;
        setLoading(false);
        setAlbumsLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, albumSearch]);

  useEffect(() => {
    let alive = true;

    async function loadSubscriptionStatus() {
      if (!isAuthenticated) {
        setCheckingSubscription(false);
        setIsSubscribed(false);
        return;
      }

      setCheckingSubscription(true);
      try {
        const status = await contentApi.getArtistSubscriptionStatus(id);
        if (!alive) return;
        setIsSubscribed(status?.isSubscribed || false);
      } catch {
        if (!alive) return;
        setIsSubscribed(false);
      } finally {
        if (!alive) return;
        setCheckingSubscription(false);
      }
    }

    loadSubscriptionStatus();
    return () => {
      alive = false;
    };
  }, [id, isAuthenticated]);

  async function handleDeleteArtist() {
    if (!window.confirm(`Delete artist "${artist?.name || 'this artist'}"? This will fail if albums exist.`)) {
      return;
    }

    try {
      await contentApi.deleteArtist(id);
      navigate("/", { replace: true });
    } catch (err) {
      alert(err.message || "Failed to delete artist");
    }
  }

  async function handleToggleSubscription() {
    if (!isAuthenticated) {
      alert("Please login to subscribe");
      return;
    }

    setSubscribing(true);
    try {
      if (isSubscribed) {
        await contentApi.unsubscribeFromArtist(id);
        setIsSubscribed(false);
      } else {
        await contentApi.subscribeToArtist(id);
        setIsSubscribed(true);
      }
    } catch (err) {
      alert(err.message || "Failed to update subscription");
    } finally {
      setSubscribing(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (err) return <div style={{ padding: 24, color: "crimson" }}>{err}</div>;

  const name = artist?.name || artist?.artistName || "Artist";
  const genres = artist?.genres || (artist?.genre ? [artist.genre] : []);

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <Link to="/" style={styles.backLink}>← Back to Artists</Link>

        <h1 style={styles.heroTitle}>{name}</h1>

        {genres.length > 0 && (
          <div style={styles.genreBadges}>
            {genres.slice(0, 3).map((genre, idx) => (
              <span key={idx} style={styles.genreBadge}>{genre}</span>
            ))}
          </div>
        )}

        {artist?.country && (
          <div style={styles.countryText}>
            {artist.country}
          </div>
        )}

        {isAuthenticated && !checkingSubscription && (
          <button
            onClick={handleToggleSubscription}
            disabled={subscribing}
            style={{
              ...styles.actionBtn,
              background: isSubscribed ? theme.colors.semantic.success : theme.colors.primary,
              opacity: subscribing ? 0.6 : 1,
              cursor: subscribing ? "not-allowed" : "pointer",
              marginRight: theme.spacing.sm,
              marginTop: theme.spacing.lg,
            }}
          >
            {subscribing ? "..." : isSubscribed ? "✓ Subscribed" : "+ Subscribe"}
          </button>
        )}

        {isAdmin && (
          <div style={styles.heroActions}>
            <Link to={`/admin/artists/${id}/edit`} style={styles.heroActionBtn}>
              Edit Artist
            </Link>
            <button onClick={handleDeleteArtist} style={styles.heroDangerBtn}>
              Delete Artist
            </button>
            <Link to={`/admin/artists/${id}/albums/new`} style={styles.heroPrimaryBtn}>
              + Add Album
            </Link>
          </div>
        )}
      </div>

      <div style={styles.albumsSection}>
        <h2 style={styles.sectionTitle}>Albums</h2>
        <div style={styles.searchRow}>
          <SearchBar
            value={albumSearch}
            onChange={setAlbumSearch}
            placeholder="Search albums by title..."
          />
        </div>
        {albumsLoading && <div style={styles.inlineLoading}>Filtering albums...</div>}

        {albums.length === 0 ? (
          <div style={styles.emptyState}>No albums yet</div>
        ) : (
          <div style={styles.grid}>
            {albums.map((al, index) => {
              const albumId = al.id || al._id || al.albumId;
              const initials = getInitials(al.title || al.name);
              const albumGenres = al.genres || [];

              return (
                <Link
                  key={albumId || al.title}
                  to={`/albums/${albumId}`}
                  state={{ album: al, artistId: id }}
                  className="album-card"
                  style={{
                    ...styles.card,
                    animation: 'fadeIn 0.6s ease-out',
                    animationDelay: `${0.05 * index}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <div style={styles.cardBackground}>
                    <div style={styles.cardInitials}>{initials}</div>
                  </div>

                  <div style={styles.cardOverlay}>
                    <div style={styles.cardTitle}>{al.title || al.name || "Untitled Album"}</div>

                    <div style={styles.cardMeta}>
                      {al.year && <span style={styles.metaBadge}>{al.year}</span>}
                      {albumGenres.slice(0, 2).map((genre, idx) => (
                        <span key={idx} style={styles.metaBadge}>{genre}</span>
                      ))}
                    </div>
                  </div>
                </Link>
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
    position: 'relative',
    marginBottom: theme.spacing['2xl'],
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
  heroTitle: {
    fontSize: '48px',
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    margin: `${theme.spacing.md} 0`,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  genreBadges: {
    display: 'flex',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
  },
  genreBadge: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '6px 16px',
    borderRadius: theme.radius.sm,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  countryText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: theme.typography.fontSize.md,
    marginTop: theme.spacing.sm,
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
  albumsSection: {
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
  emptyState: {
    padding: theme.spacing['2xl'],
    textAlign: 'center',
    color: theme.colors.text.light,
    fontSize: theme.typography.fontSize.md,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: theme.spacing.lg,
  },
  card: {
    position: 'relative',
    height: '280px',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    boxShadow: theme.shadows.md,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'block',
  },
  cardBackground: {
    position: 'relative',
    height: '100%',
    background: theme.gradients.heroOlive,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInitials: {
    fontSize: '60px',
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    userSelect: 'none',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: theme.gradients.cardOverlay,
    padding: theme.spacing.lg,
    color: 'white',
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    marginBottom: theme.spacing.xs,
  },
  cardMeta: {
    display: 'flex',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  metaBadge: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: '4px 12px',
    borderRadius: theme.radius.sm,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
};
