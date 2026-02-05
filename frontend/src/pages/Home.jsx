import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/apiFetch';
import { theme } from '../theme';

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [stats, setStats] = useState({ artists: 0, albums: 0, songs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  async function loadHomeData() {
    try {
      const [artists, genres] = await Promise.all([
        apiFetch('/api/content/artists'),
        apiFetch('/api/content/artists/genres'),
      ]);

      // Set featured artists (first 6)
      setFeaturedArtists(artists.slice(0, 6));

      // Count artists per genre
      const genreCounts = {};
      artists.forEach(artist => {
        artist.genres?.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });

      // Map genres with counts and assign gradients/icons
      const topGenresData = genres
        .map(g => ({
          name: g,
          count: genreCounts[g] || 0,
          gradient: getGenreGradient(g),
          icon: getGenreIcon(g),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      setTopGenres(topGenresData);

      // Count albums and songs from all artists
      let totalAlbums = 0;
      let totalSongs = 0;

      // Fetch albums and songs for each artist to get accurate counts
      for (const artist of artists) {
        try {
          const artistId = artist.id || artist._id;
          if (artistId) {
            const albums = await apiFetch(`/api/content/artists/${artistId}/albums`);
            if (Array.isArray(albums)) {
              totalAlbums += albums.length;

              // Count songs in each album
              for (const album of albums) {
                try {
                  const albumId = album.id || album._id;
                  if (albumId) {
                    const songs = await apiFetch(`/api/content/albums/${albumId}/songs`);
                    if (Array.isArray(songs)) {
                      totalSongs += songs.length;
                    }
                  }
                } catch (err) {
                  // Skip if error fetching songs (might require auth)
                  console.warn(`Failed to fetch songs for album ${album.title}:`, err);
                }
              }
            }
          }
        } catch (err) {
          // Skip if error fetching albums for this artist
          console.warn(`Failed to fetch albums for artist ${artist.name}:`, err);
        }
      }

      setStats({
        artists: artists.length,
        albums: totalAlbums,
        songs: totalSongs
      });
    } catch (err) {
      console.error('Failed to load home data:', err);
    } finally {
      setLoading(false);
    }
  }

  // Get gradient for genre
  function getGenreGradient(genre) {
    const genreLower = genre.toLowerCase();
    if (genreLower.includes('rock')) return theme.gradients.genreRock;
    if (genreLower.includes('pop')) return theme.gradients.genrePop;
    if (genreLower.includes('jazz')) return theme.gradients.genreJazz;
    if (genreLower.includes('metal')) return theme.gradients.genreMetal;
    if (genreLower.includes('electronic') || genreLower.includes('edm')) return theme.gradients.genreElectronic;
    if (genreLower.includes('classical')) return theme.gradients.genreClassical;
    if (genreLower.includes('hip')) return theme.gradients.genreHipHop;
    if (genreLower.includes('blues')) return theme.gradients.genreBlues;
    return theme.gradients.genreRock; // Default
  }

  // Get icon for genre
  function getGenreIcon(genre) {
    const genreLower = genre.toLowerCase();
    if (genreLower.includes('rock')) return '🎸';
    if (genreLower.includes('pop')) return '🎤';
    if (genreLower.includes('jazz')) return '🎺';
    if (genreLower.includes('metal')) return '🥁';
    if (genreLower.includes('electronic') || genreLower.includes('edm')) return '🎧';
    if (genreLower.includes('classical')) return '🎻';
    if (genreLower.includes('hip')) return '🎙️';
    if (genreLower.includes('blues')) return '🎷';
    return '🎵'; // Default
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Navigation Topbar */}
      <div style={styles.topbar}>
        <Link to="/" style={styles.logoLink}>
          <h2 style={styles.logo}>🎵 Music Platform</h2>
        </Link>
        <div style={styles.topbarRight}>
          <Link to="/" style={styles.navLink}>Home</Link>
          {!isAuthenticated && (
            <>
              <Link to="/register" style={styles.navLink}>Register</Link>
              <Link to="/login" style={styles.navLink}>Login</Link>
            </>
          )}
          {isAuthenticated && (
            <>
              <Link to="/profile" style={styles.navLink}>Profile</Link>
              <button onClick={logout} style={styles.logoutBtn}>Logout</button>
            </>
          )}
        </div>
      </div>

      {/* Hero Section */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Discover Your Sound</h1>
          <p style={styles.heroSubtitle}>
            Explore thousands of artists, albums, and songs in our curated music catalog
          </p>
          <div style={styles.heroCTA}>
            <Link to="/artists" style={styles.primaryButton}>
              Browse Artists
            </Link>
            {!isAuthenticated && (
              <Link to="/register" style={styles.secondaryButtonFixed}>
                Get Started
              </Link>
            )}
            {isAuthenticated && (
              <button onClick={logout} style={styles.logoutButton}>
                Logout
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Featured Artists Section */}
      {featuredArtists.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Featured Artists</h2>
          <div style={styles.featuredGrid}>
            {featuredArtists.map((artist, index) => (
              <Link
                to={`/artists/${artist.id}`}
                style={{
                  ...styles.featuredCard,
                  animationDelay: `${0.1 * index}s`,
                }}
                key={artist.id}
              >
                <div style={styles.cardImage}>
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt={artist.name}
                      style={styles.cardImg}
                    />
                  ) : (
                    <div style={styles.cardPlaceholder}>🎵</div>
                  )}
                </div>
                <div style={styles.cardOverlay}>
                  <h3 style={styles.cardTitle}>{artist.name}</h3>
                  {artist.genres && artist.genres.length > 0 && (
                    <div style={styles.cardGenres}>
                      {artist.genres.slice(0, 2).map(g => (
                        <span style={styles.genreBadge} key={g}>
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Browse by Genre Section */}
      {topGenres.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Browse by Genre</h2>
          <div style={styles.genreGrid}>
            {topGenres.map((genre, index) => (
              <Link
                to={`/artists?genres=${genre.name}`}
                style={{
                  ...styles.genreCard,
                  background: genre.gradient,
                  animationDelay: `${0.1 * index}s`,
                }}
                key={genre.name}
              >
                <div style={styles.genreIcon}>{genre.icon}</div>
                <h3 style={styles.genreName}>{genre.name}</h3>
                <p style={styles.genreCount}>
                  {genre.count} {genre.count === 1 ? 'artist' : 'artists'}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.artists}</div>
            <div style={styles.statLabel}>Artists</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.albums}</div>
            <div style={styles.statLabel}>Albums</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.songs}</div>
            <div style={styles.statLabel}>Songs</div>
          </div>
        </div>

        {!isAuthenticated && (
          <div style={styles.ctaBox}>
            <h2 style={styles.ctaTitle}>Ready to explore?</h2>
            <p style={styles.ctaText}>
              Create an account to unlock personalized recommendations and more features
            </p>
            <Link to="/register" style={styles.ctaButton}>
              Sign Up Now
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: theme.colors.background,
  },

  // Topbar Navigation
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${theme.spacing.lg} ${theme.spacing.xl}`,
    background: theme.colors.surface,
    boxShadow: theme.shadows.sm,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logoLink: {
    textDecoration: 'none',
  },
  logo: {
    margin: 0,
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
  },
  topbarRight: {
    display: 'flex',
    gap: theme.spacing.lg,
    alignItems: 'center',
  },
  navLink: {
    ...theme.components.link(),
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  },
  logoutBtn: {
    ...theme.components.button('danger'),
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    fontSize: theme.typography.fontSize.base,
  },

  // Loading
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.colors.background,
  },
  loadingSpinner: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.secondary,
  },

  // Hero Section
  hero: {
    minHeight: '80vh',
    background: theme.gradients.heroOlive,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: `${theme.spacing['3xl']} ${theme.spacing.xl}`,
    animation: 'fadeIn 1s ease-out',
  },
  heroContent: {
    maxWidth: '1200px',
    width: '100%',
    textAlign: 'center',
    zIndex: 1,
  },
  heroTitle: {
    fontSize: '56px',
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    marginBottom: theme.spacing.lg,
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
    lineHeight: 1.2,
  },
  heroSubtitle: {
    fontSize: '20px',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing['3xl'],
    maxWidth: '700px',
    margin: `0 auto ${theme.spacing['3xl']}`,
    lineHeight: 1.6,
  },
  heroCTA: {
    display: 'flex',
    gap: theme.spacing.lg,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    ...theme.components.button('primary'),
    background: 'white',
    color: theme.colors.primary,
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: theme.typography.fontWeight.semibold,
    boxShadow: theme.shadows.md,
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    display: 'inline-block',
  },
  secondaryButtonFixed: {
    background: 'transparent',
    border: '2px solid white',
    color: 'white',
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: theme.typography.fontWeight.semibold,
    borderRadius: theme.radius.md,
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  logoutButton: {
    ...theme.components.button('danger'),
    padding: '14px 32px',
    fontSize: '16px',
  },

  // Section
  section: {
    padding: `${theme.spacing['3xl']} ${theme.spacing.xl}`,
    maxWidth: '1400px',
    margin: '0 auto',
    animation: 'fadeInUp 0.8s ease-out',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing['2xl'],
    textAlign: 'center',
  },

  // Featured Artists Grid
  featuredGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: theme.spacing.xl,
  },
  featuredCard: {
    position: 'relative',
    height: '400px',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    textDecoration: 'none',
    boxShadow: theme.shadows.md,
    transition: 'all 0.3s ease',
    animation: 'fadeInUp 0.6s ease-out forwards',
    ':hover': {
      transform: 'translateY(-8px) scale(1.02)',
      boxShadow: '0 12px 40px rgba(85, 107, 47, 0.3)',
    },
  },
  cardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '80px',
    background: theme.colors.primaryLight,
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.xl,
    background: theme.gradients.cardOverlay,
  },
  cardTitle: {
    color: 'white',
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.sm,
  },
  cardGenres: {
    display: 'flex',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  genreBadge: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    borderRadius: theme.radius.sm,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Genre Grid
  genreGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: theme.spacing.lg,
  },
  genreCard: {
    height: '200px',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    boxShadow: theme.shadows.md,
    transition: 'all 0.3s ease',
    animation: 'scaleIn 0.5s ease-out forwards',
    ':hover': {
      filter: 'brightness(1.2)',
      transform: 'translateY(-4px)',
    },
  },
  genreIcon: {
    fontSize: '48px',
    marginBottom: theme.spacing.md,
  },
  genreName: {
    color: 'white',
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.xs,
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  genreCount: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: theme.typography.fontSize.sm,
    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
  },

  // Stats Section
  statsSection: {
    padding: `${theme.spacing['3xl']} ${theme.spacing.xl}`,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing.xl,
    marginBottom: theme.spacing['3xl'],
  },
  statCard: {
    background: theme.gradients.statCard,
    padding: theme.spacing['2xl'],
    borderRadius: theme.radius.lg,
    textAlign: 'center',
    boxShadow: theme.shadows.md,
  },
  statNumber: {
    fontSize: '48px',
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // CTA Box
  ctaBox: {
    background: theme.gradients.heroOlive,
    padding: theme.spacing['3xl'],
    borderRadius: theme.radius.lg,
    textAlign: 'center',
    boxShadow: theme.shadows.lg,
  },
  ctaTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    color: 'white',
    marginBottom: theme.spacing.md,
  },
  ctaText: {
    fontSize: theme.typography.fontSize.lg,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: theme.spacing['2xl'],
    maxWidth: '600px',
    margin: `0 auto ${theme.spacing['2xl']}`,
  },
  ctaButton: {
    ...theme.components.button('primary'),
    background: 'white',
    color: theme.colors.primary,
    padding: '14px 32px',
    fontSize: '16px',
    fontWeight: theme.typography.fontWeight.semibold,
    boxShadow: theme.shadows.md,
  },

  // Quick Links
  quickLinksSection: {
    padding: `${theme.spacing['2xl']} ${theme.spacing.xl} ${theme.spacing['3xl']}`,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  quickLinksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: theme.spacing.lg,
  },
  quickLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing.xl,
    background: theme.colors.surface,
    borderRadius: theme.radius.lg,
    textDecoration: 'none',
    color: theme.colors.text.primary,
    boxShadow: theme.shadows.sm,
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows.md,
    },
  },
  quickLinkIcon: {
    fontSize: '32px',
    marginBottom: theme.spacing.sm,
  },
};
