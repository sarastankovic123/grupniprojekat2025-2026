import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/apiFetch';
import { theme } from '../theme';
import HomePageSkeleton from '../components/home/HomePageSkeleton';

// Material UI Components
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Grid,
  Chip,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

// Helper functions
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

export default function Home() {
  const { isAuthenticated, user, logout } = useAuth();
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [stats, setStats] = useState({ artists: 0, albums: 0, songs: 0 });
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

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
                  console.warn(`Failed to fetch songs for album ${album.title}:`, err);
                }
              }
            }
          }
        } catch (err) {
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

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <Box>
      {/* Navigation AppBar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Container maxWidth="xl">
          <Toolbar sx={{ px: { xs: 0 } }}>
            {/* Mobile Menu Icon */}
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' }, mr: 2 }}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 'bold',
                flexGrow: { xs: 1, md: 0 },
              }}
            >
              🎵 Music Platform
            </Typography>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, ml: 4 }}>
              <Button component={RouterLink} to="/" color="primary">
                Home
              </Button>
              {!isAuthenticated && (
                <>
                  <Button component={RouterLink} to="/register">
                    Register
                  </Button>
                  <Button component={RouterLink} to="/login">
                    Login
                  </Button>
                </>
              )}
              {isAuthenticated && (
                <>
                  <Button component={RouterLink} to="/profile">
                    Profile
                  </Button>
                  <Button onClick={logout} color="error">
                    Logout
                  </Button>
                </>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        sx={{ display: { md: 'none' } }}
      >
        <Box sx={{ width: 250 }}>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              🎵 Menu
            </Typography>
            <IconButton onClick={handleDrawerToggle}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/" onClick={handleDrawerToggle}>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            {!isAuthenticated && (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/register" onClick={handleDrawerToggle}>
                    <ListItemText primary="Register" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/login" onClick={handleDrawerToggle}>
                    <ListItemText primary="Login" />
                  </ListItemButton>
                </ListItem>
              </>
            )}
            {isAuthenticated && (
              <>
                <ListItem disablePadding>
                  <ListItemButton component={RouterLink} to="/profile" onClick={handleDrawerToggle}>
                    <ListItemText primary="Profile" />
                  </ListItemButton>
                </ListItem>
                <Divider />
                <ListItem disablePadding>
                  <ListItemButton onClick={() => { logout(); handleDrawerToggle(); }}>
                    <ListItemText primary="Logout" sx={{ color: 'error.main' }} />
                  </ListItemButton>
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '80vh',
          background: 'linear-gradient(135deg, #556B2F 0%, #3D4B1F 50%, #2A3416 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2, md: 4 },
          animation: 'fadeIn 1s ease-out',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', zIndex: 1 }}>
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                fontWeight: 'bold',
                color: 'white',
                mb: 2,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                lineHeight: 1.2,
              }}
            >
              Discover Your Sound
            </Typography>
            <Typography
              variant="h5"
              sx={{
                fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                color: 'rgba(255, 255, 255, 0.9)',
                mb: 4,
                maxWidth: '700px',
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Explore thousands of artists, albums, and songs in our curated music catalog
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                component={RouterLink}
                to="/artists"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                Browse Artists
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Featured Artists Section */}
      {featuredArtists.length > 0 && (
        <Container maxWidth="xl" sx={{ py: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'text.primary',
              mb: 4,
              textAlign: 'center',
            }}
          >
            Featured Artists
          </Typography>
          <Grid container spacing={3}>
            {featuredArtists.map((artist, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={artist.id}
                style={{ animationDelay: `${0.1 * index}s` }}
                sx={{ animation: 'fadeInUp 0.6s ease-out forwards' }}
              >
                <Card
                  elevation={2}
                  sx={{
                    position: 'relative',
                    height: 400,
                    overflow: 'hidden',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: 8,
                    },
                  }}
                >
                  <CardActionArea
                    component={RouterLink}
                    to={`/artists/${artist.id}`}
                    sx={{ height: '100%' }}
                  >
                    {artist.image ? (
                      <CardMedia
                        component="img"
                        height="100%"
                        image={artist.image}
                        alt={artist.name}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '80px',
                          bgcolor: 'primary.light',
                        }}
                      >
                        🎵
                      </Box>
                    )}
                    {/* Gradient Overlay */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
                        p: 3,
                      }}
                    >
                      <Typography
                        variant="h5"
                        sx={{
                          color: 'white',
                          fontWeight: 'bold',
                          mb: 1,
                        }}
                      >
                        {artist.name}
                      </Typography>
                      {artist.genres && artist.genres.length > 0 && (
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                          {artist.genres.slice(0, 2).map(genre => (
                            <Chip
                              key={genre}
                              label={genre}
                              size="small"
                              sx={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                color: 'white',
                                fontWeight: 500,
                                border: 'none',
                              }}
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Browse by Genre Section */}
      {topGenres.length > 0 && (
        <Container maxWidth="xl" sx={{ py: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: 'text.primary',
              mb: 4,
              textAlign: 'center',
            }}
          >
            Browse by Genre
          </Typography>
          <Grid container spacing={2}>
            {topGenres.map((genre, index) => (
              <Grid
                item
                xs={6}
                sm={4}
                md={3}
                lg={2}
                key={genre.name}
                style={{ animationDelay: `${0.1 * index}s` }}
                sx={{ animation: 'scaleIn 0.5s ease-out forwards' }}
              >
                <Card
                  elevation={2}
                  sx={{
                    height: 200,
                    background: genre.gradient,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      filter: 'brightness(1.2)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardActionArea
                    component={RouterLink}
                    to={`/artists?genres=${genre.name}`}
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
                      {genre.icon}
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
                      {genre.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      }}
                    >
                      {genre.count} {genre.count === 1 ? 'artist' : 'artists'}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      )}

      {/* Stats Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card
              elevation={2}
              sx={{
                background: theme.gradients.statCard,
                p: 3,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 1,
                }}
              >
                {stats.artists}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.125rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                Artists
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              elevation={2}
              sx={{
                background: theme.gradients.statCard,
                p: 3,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 1,
                }}
              >
                {stats.albums}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.125rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                Albums
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card
              elevation={2}
              sx={{
                background: theme.gradients.statCard,
                p: 3,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: '3rem',
                  fontWeight: 'bold',
                  color: 'primary.main',
                  mb: 1,
                }}
              >
                {stats.songs}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.125rem',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                Songs
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* CTA Box for Non-Authenticated Users */}
        {!isAuthenticated && (
          <Card
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #556B2F 0%, #3D4B1F 50%, #2A3416 100%)',
              mt: 4,
              p: 4,
              textAlign: 'center',
            }}
          >
            <CardContent>
              <Typography
                variant="h4"
                sx={{
                  fontSize: '2rem',
                  color: 'white',
                  mb: 2,
                  fontWeight: 'bold',
                }}
              >
                Ready to explore?
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontSize: '1.125rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  mb: 3,
                  maxWidth: '600px',
                  mx: 'auto',
                }}
              >
                Create an account to unlock personalized recommendations and more features
              </Typography>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                  },
                }}
              >
                Sign Up Now
              </Button>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
