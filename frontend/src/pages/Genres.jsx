import { useEffect, useState } from "react";
import { apiFetch } from "../api/apiFetch";
import { contentApi } from "../api/content";
import { useAuth } from "../auth/AuthContext";
import { theme } from "../theme";

export default function Genres() {
  const { isAuthenticated } = useAuth();
  const [genres, setGenres] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(new Set());

  useEffect(() => {
    async function load() {
      try {
        // Fetch all genres
        const genresData = await apiFetch("/api/content/artists/genres");
        setGenres(Array.isArray(genresData) ? genresData : []);

        // Fetch user subscriptions if authenticated
        if (isAuthenticated) {
          const subs = await contentApi.getUserGenreSubscriptions();
          setSubscriptions(Array.isArray(subs) ? subs.map((s) => s.genre) : []);
        }
      } catch (err) {
        console.error("Failed to load genres:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  async function handleToggleSubscription(genre) {
    if (!isAuthenticated) {
      alert("Please login to subscribe");
      return;
    }

    setSubscribing((prev) => new Set(prev).add(genre));
    try {
      const isSubscribed = subscriptions.includes(genre);
      if (isSubscribed) {
        await contentApi.unsubscribeFromGenre(genre);
        setSubscriptions((prev) => prev.filter((g) => g !== genre));
      } else {
        await contentApi.subscribeToGenre(genre);
        setSubscriptions((prev) => [...prev, genre]);
      }
    } catch (err) {
      alert(err.message || "Failed to update subscription");
    } finally {
      setSubscribing((prev) => {
        const next = new Set(prev);
        next.delete(genre);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={{ textAlign: "center", padding: theme.spacing["3xl"] }}>
          Loading genres...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Music Genres</h1>
      <p style={styles.subtitle}>Subscribe to genres to get notified about new releases</p>

      <div style={styles.grid}>
        {genres.map((genre) => {
          const isSubscribed = subscriptions.includes(genre);
          const isLoading = subscribing.has(genre);

          return (
            <div key={genre} style={styles.card}>
              <div style={styles.genreName}>{genre}</div>
              <button
                onClick={() => handleToggleSubscription(genre)}
                disabled={isLoading || !isAuthenticated}
                style={{
                  ...theme.components.button(isSubscribed ? "primary" : "secondary"),
                  width: "100%",
                  opacity: isLoading ? 0.6 : 1,
                  cursor: isLoading || !isAuthenticated ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "..." : isSubscribed ? "✓ Subscribed" : "Subscribe"}
              </button>
            </div>
          );
        })}
      </div>

      {!isAuthenticated && (
        <div style={{ textAlign: "center", marginTop: theme.spacing["2xl"] }}>
          <p style={{ color: theme.colors.text.secondary }}>Please login to subscribe to genres</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    ...theme.components.page(),
    maxWidth: 1200,
    margin: "0 auto",
  },
  title: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: 700,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: theme.spacing.lg,
  },
  card: {
    ...theme.components.card(),
    padding: theme.spacing.xl,
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
  },
  genreName: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 600,
    color: theme.colors.text.primary,
  },
};
