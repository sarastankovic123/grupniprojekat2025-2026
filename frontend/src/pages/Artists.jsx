import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import GenreFilter from "../components/GenreFilter";
import { theme } from "../theme";

export default function Artists() {
  const { isAuthenticated, user } = useAuth();

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);

  useEffect(() => {
    let alive = true;

    async function loadGenres() {
      try {
        const data = await apiFetch("/api/content/artists/genres");
        if (!alive) return;
        setAvailableGenres(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load genres:", e);
      }
    }

    loadGenres();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    async function load() {
      setErr("");
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append("search", searchQuery);
        if (selectedGenres.length) params.append("genres", selectedGenres.join(","));

        const url = `/api/content/artists${params.toString() ? `?${params}` : ""}`;
        const data = await apiFetch(url);
        if (!alive) return;

        const list = Array.isArray(data) ? data : data?.items || [];
        setArtists(list);
      } catch (e) {
        if (!alive) return;
        setErr(e.message || "Failed to load artists");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [searchQuery, selectedGenres]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedGenres([]);
  };

  const hasFilters = searchQuery || selectedGenres.length > 0;

  return (
    <div style={styles.page}>
      <Navbar />

      <section style={styles.heroHeader}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Explore Artists</h1>
          <p style={styles.heroSubtitle}>
            Discover talented artists across all genres
          </p>
        </div>
      </section>

      <div style={styles.filterBar}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search artists by name..."
        />
        <GenreFilter
          selectedGenres={selectedGenres}
          onChange={setSelectedGenres}
          availableGenres={availableGenres}
        />
        {hasFilters && (
          <button onClick={handleClearFilters} style={styles.clearBtn}>
            Clear Filters
          </button>
        )}
      </div>

      <div style={styles.contentSection}>
        {loading && <div style={styles.loadingMessage}>Loading...</div>}
        {err && <div style={styles.error}>{err}</div>}

        {!loading && artists.length === 0 && (
          <div style={styles.emptyState}>
            No artists found. {hasFilters && "Try adjusting your search or filters."}
          </div>
        )}

        {!loading && artists.length > 0 && (
          <div style={styles.grid}>
            {artists.map((a, index) => {
              const id = a.id || a._id || a.artistId;
              return (
                <Link
                  key={id || a.name}
                  to={`/artists/${id}`}
                  style={{
                    ...styles.card,
                    animationDelay: `${0.05 * index}s`,
                  }}
                >
                  <div style={styles.cardImage}>
                    {a.image ? (
                      <img src={a.image} alt={a.name} style={styles.cardImg} />
                    ) : (
                      <div style={styles.cardPlaceholder}>
                        <span style={styles.placeholderIcon}>🎤</span>
                      </div>
                    )}
                  </div>
                  <div style={styles.cardOverlay}>
                    <h3 style={styles.cardTitle}>
                      {a.name || a.artistName || "Unnamed artist"}
                    </h3>
                    {a.genres && a.genres.length > 0 && (
                      <div style={styles.cardGenres}>
                        {a.genres.slice(0, 2).map(g => (
                          <span style={styles.genreBadge} key={g}>{g}</span>
                        ))}
                      </div>
                    )}
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
    minHeight: "100vh",
    background: theme.colors.background,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: theme.spacing.xl,
    animation: 'fadeIn 0.6s ease-out',
  },
  card: {
    position: 'relative',
    height: '320px',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    textDecoration: "none",
    boxShadow: theme.shadows.md,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  title: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  meta: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.light,
    marginTop: theme.spacing.xs,
  },
  error: {
    color: theme.colors.semantic.error,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    background: "#FDF5F4",
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.semantic.error}`,
  },
  filterBar: {
    display: "flex",
    gap: theme.spacing.md,
    padding: `${theme.spacing.xl} ${theme.spacing.xl}`,
    background: theme.colors.surface,
    boxShadow: theme.shadows.sm,
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: 'center',
  },
  clearBtn: {
    ...theme.components.button("danger"),
    padding: "8px 16px",
    fontSize: theme.typography.fontSize.sm,
    whiteSpace: "nowrap",
  },
  loadingMessage: {
    textAlign: "center",
    padding: theme.spacing.xl,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.lg,
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing["3xl"],
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.lg,
    background: theme.colors.surface,
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border}`,
    marginBottom: theme.spacing.lg,
  },

  heroHeader: {
    background: theme.gradients.heroOlive,
    padding: `${theme.spacing['3xl']} ${theme.spacing.xl}`,
    textAlign: 'center',
    animation: 'fadeIn 0.8s ease-out',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    marginBottom: theme.spacing.md,
    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
  },
  heroSubtitle: {
    fontSize: '18px',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 1.6,
  },

  contentSection: {
    padding: `${theme.spacing['3xl']} ${theme.spacing.xl}`,
    maxWidth: '1400px',
    margin: '0 auto',
  },

  cardImage: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    background: theme.gradients.heroOlive,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: '80px',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.lg,
    background: theme.gradients.cardOverlay,
    color: 'white',
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: 'white',
    marginBottom: theme.spacing.sm,
    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
  },
  cardGenres: {
    display: 'flex',
    gap: theme.spacing.xs,
    flexWrap: 'wrap',
  },
  genreBadge: {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: theme.radius.sm,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: 'white',
  },
};
