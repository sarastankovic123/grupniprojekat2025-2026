import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { apiFetch } from '../api/apiFetch';
import { contentApi } from '../api/content';
import { useAuth } from '../auth/AuthContext';
import { getGenreGradient, getGenreIcon } from '../utils/genreHelpers';

import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardActionArea,
  IconButton,
  Tooltip,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

export default function Genres() {
  const { isAuthenticated } = useAuth();
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(new Set());

  useEffect(() => {
    async function load() {
      try {
        const [genresData, artistsData] = await Promise.all([
          apiFetch('/api/content/artists/genres'),
          apiFetch('/api/content/artists'),
        ]);
        setGenres(Array.isArray(genresData) ? genresData : []);
        setArtists(Array.isArray(artistsData) ? artistsData : []);

        if (isAuthenticated) {
          const subs = await contentApi.getUserGenreSubscriptions();
          setSubscriptions(Array.isArray(subs) ? subs.map(s => s.genre) : []);
        }
      } catch (err) {
        console.error('Failed to load genres:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAuthenticated]);

  function getGenreCount(genre) {
    return artists.filter(a => a.genres?.includes(genre)).length;
  }

  async function handleToggleSubscription(e, genre) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    setSubscribing(prev => new Set(prev).add(genre));
    try {
      const isSubscribed = subscriptions.includes(genre);
      if (isSubscribed) {
        await contentApi.unsubscribeFromGenre(genre);
        setSubscriptions(prev => prev.filter(g => g !== genre));
      } else {
        await contentApi.subscribeToGenre(genre);
        setSubscriptions(prev => [...prev, genre]);
      }
    } catch (err) {
      console.error('Failed to update subscription:', err);
    } finally {
      setSubscribing(prev => {
        const next = new Set(prev);
        next.delete(genre);
        return next;
      });
    }
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Skeleton variant="text" width={300} height={48} sx={{ mx: 'auto', mb: 1 }} />
        <Skeleton variant="text" width={450} height={30} sx={{ mx: 'auto', mb: 4 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 6 }}>
      <Typography
        variant="h2"
        sx={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: 'text.primary',
          mb: 1,
          textAlign: 'center',
        }}
      >
        Music Genres
      </Typography>
      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          textAlign: 'center',
          mb: 4,
          fontSize: '1.05rem',
        }}
      >
        Subscribe to genres to get notified about new releases
      </Typography>

      {genres.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: 'text.secondary', py: 6 }}>
          No genres found.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {genres.map((genre, index) => {
            const isSubscribed = subscriptions.includes(genre);
            const isLoading = subscribing.has(genre);
            const count = getGenreCount(genre);

            return (
              <Grid
                item
                xs={6}
                sm={4}
                md={3}
                lg={2}
                key={genre}
                style={{ animationDelay: `${0.05 * index}s` }}
                sx={{ animation: 'scaleIn 0.5s ease-out forwards' }}
              >
                <Card
                  elevation={2}
                  sx={{
                    height: 220,
                    background: getGenreGradient(genre),
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      filter: 'brightness(1.2)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardActionArea
                    component={RouterLink}
                    to={`/artists?genres=${genre}`}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2,
                    }}
                  >
                    <Typography sx={{ fontSize: '48px', mb: 1 }}>
                      {getGenreIcon(genre)}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mb: 0.5,
                      }}
                    >
                      {genre}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      }}
                    >
                      {count} {count === 1 ? 'artist' : 'artists'}
                    </Typography>
                  </CardActionArea>
                  {/* Subscribe Button */}
                  <Tooltip title={!isAuthenticated ? 'Login to subscribe' : isSubscribed ? 'Unsubscribe' : 'Subscribe to notifications'}>
                    <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                      <IconButton
                        size="small"
                        disabled={!isAuthenticated || isLoading}
                        onClick={(e) => handleToggleSubscription(e, genre)}
                        sx={{
                          bgcolor: isSubscribed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                          color: isSubscribed ? 'primary.main' : 'white',
                          backdropFilter: 'blur(4px)',
                          '&:hover': {
                            bgcolor: isSubscribed ? 'white' : 'rgba(255,255,255,0.4)',
                          },
                          '&.Mui-disabled': {
                            bgcolor: 'rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.5)',
                          },
                        }}
                      >
                        {isLoading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : isSubscribed ? (
                          <NotificationsActiveIcon fontSize="small" />
                        ) : (
                          <NotificationsNoneIcon fontSize="small" />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {!isAuthenticated && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography sx={{ color: 'text.secondary' }}>
            Please login to subscribe to genres
          </Typography>
        </Box>
      )}
    </Container>
  );
}
