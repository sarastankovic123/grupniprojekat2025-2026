import { useState, useEffect, useRef, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/apiFetch';
import { contentApi } from '../api/content';
import { theme } from '../theme';
import { getGenreGradient, getGenreIcon } from '../utils/genreHelpers';
import HomePageSkeleton from '../components/home/HomePageSkeleton';
import Navbar from '../components/Navbar';

// Material UI Components
import {
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
  Tooltip,
  CircularProgress,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AlbumIcon from '@mui/icons-material/Album';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExploreIcon from '@mui/icons-material/Explore';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// ── Utility Hooks ──────────────────────────────────────────────

function useScrollReveal(threshold = 0.15) {
  const [visibleSet, setVisibleSet] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSet((prev) => {
              const next = new Set(prev);
              next.add(entry.target);
              return next;
            });
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    return () => observerRef.current?.disconnect();
  }, [threshold]);

  const observe = useCallback((node) => {
    if (node && observerRef.current) {
      observerRef.current.observe(node);
    }
  }, []);

  const isVisible = useCallback(
    (node) => visibleSet.has(node),
    [visibleSet]
  );

  return { observe, isVisible };
}

function useCountUp(target, duration = 1500, shouldStart = false) {
  const [value, setValue] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!shouldStart || target === 0) {
      if (shouldStart) setValue(target);
      return;
    }
    const startTime = performance.now();
    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration, shouldStart]);

  return value;
}

// ── Floating Circles for Hero ──────────────────────────────────

const HERO_CIRCLES = [
  { size: 300, top: '-10%', left: '-5%', delay: '0s', duration: '7s', opacity: 0.05 },
  { size: 200, top: '60%', right: '-3%', delay: '1s', duration: '9s', opacity: 0.04 },
  { size: 100, bottom: '10%', left: '20%', delay: '3s', duration: '8s', opacity: 0.05 },
];

// ── Equalizer Bar config ──────────────────────────────────────

const EQ_LEFT_BARS = [
  { height: 60, delay: '0s', duration: '1.2s' },
  { height: 90, delay: '0.2s', duration: '0.9s' },
  { height: 45, delay: '0.4s', duration: '1.4s' },
  { height: 75, delay: '0.1s', duration: '1.0s' },
  { height: 55, delay: '0.5s', duration: '1.3s' },
  { height: 85, delay: '0.3s', duration: '0.8s' },
  { height: 40, delay: '0.6s', duration: '1.1s' },
  { height: 70, delay: '0.15s', duration: '1.5s' },
];

const EQ_RIGHT_BARS = [
  { height: 70, delay: '0.3s', duration: '1.1s' },
  { height: 50, delay: '0.1s', duration: '1.3s' },
  { height: 85, delay: '0.5s', duration: '0.9s' },
  { height: 40, delay: '0.2s', duration: '1.4s' },
  { height: 65, delay: '0.4s', duration: '1.0s' },
  { height: 80, delay: '0s', duration: '1.2s' },
  { height: 55, delay: '0.35s', duration: '0.85s' },
  { height: 45, delay: '0.25s', duration: '1.5s' },
];

// ── Component ──────────────────────────────────────────────────

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [featuredArtists, setFeaturedArtists] = useState([]);
  const [topGenres, setTopGenres] = useState([]);
  const [stats, setStats] = useState({ artists: 0, albums: 0, songs: 0 });
  const [loading, setLoading] = useState(true);
  const [genreSubscriptions, setGenreSubscriptions] = useState([]);
  const [subscribingGenres, setSubscribingGenres] = useState(new Set());
  const [artistSubscriptions, setArtistSubscriptions] = useState([]);
  const [subscribingArtists, setSubscribingArtists] = useState(new Set());
  const [subscribedRecs, setSubscribedRecs] = useState([]);
  const [discoverRecs, setDiscoverRecs] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [activeRecTab, setActiveRecTab] = useState('forYou');

  // Scroll reveal
  const { observe, isVisible } = useScrollReveal(0.12);

  // Refs for scroll-triggered sections
  const artistCardRefs = useRef([]);
  const genreCardRefs = useRef([]);
  const statsSectionRef = useRef(null);
  const artistHeadingRef = useRef(null);
  const genreHeadingRef = useRef(null);
  const carouselRef = useRef(null);
  const ctaRef = useRef(null);

  const [statsVisible, setStatsVisible] = useState(false);

  // Count-up animations for stats
  const artistCount = useCountUp(stats.artists, 1500, statsVisible);
  const albumCount = useCountUp(stats.albums, 1800, statsVisible);
  const songCount = useCountUp(stats.songs, 2000, statsVisible);

  // Register refs for observation once data is loaded
  useEffect(() => {
    if (loading) return;
    artistCardRefs.current.forEach((el) => el && observe(el));
    genreCardRefs.current.forEach((el) => el && observe(el));
    if (artistHeadingRef.current) observe(artistHeadingRef.current);
    if (genreHeadingRef.current) observe(genreHeadingRef.current);
    if (ctaRef.current) observe(ctaRef.current);

    // Stats section observer
    if (statsSectionRef.current) {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setStatsVisible(true);
            obs.disconnect();
          }
        },
        { threshold: 0.2 }
      );
      obs.observe(statsSectionRef.current);
      return () => obs.disconnect();
    }
  }, [loading, observe, featuredArtists.length, topGenres.length]);

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      contentApi.getUserGenreSubscriptions()
        .then(subs => {
          if (Array.isArray(subs)) {
            setGenreSubscriptions(subs.map(s => s.genre));
          }
        })
        .catch(err => console.warn('Failed to load genre subscriptions:', err));

      contentApi.getUserArtistSubscriptions()
        .then(subs => {
          if (Array.isArray(subs)) {
            setArtistSubscriptions(subs.map(s => s.artistId || s.artist_id));
          }
        })
        .catch(err => console.warn('Failed to load artist subscriptions:', err));

      // Fetch recommendations
      setRecsLoading(true);
      contentApi.getRecommendations()
        .then(data => {
          setSubscribedRecs(Array.isArray(data.subscribedGenreSongs) ? data.subscribedGenreSongs : []);
          setDiscoverRecs(Array.isArray(data.discoverNewSongs) ? data.discoverNewSongs : []);
        })
        .catch(err => console.warn('Failed to load recommendations:', err))
        .finally(() => setRecsLoading(false));
    } else {
      setGenreSubscriptions([]);
      setArtistSubscriptions([]);
      setSubscribedRecs([]);
      setDiscoverRecs([]);
    }
  }, [isAuthenticated]);

  async function handleToggleGenreSubscription(e, genreName) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    setSubscribingGenres(prev => new Set(prev).add(genreName));
    try {
      const isSubscribed = genreSubscriptions.includes(genreName);
      if (isSubscribed) {
        await contentApi.unsubscribeFromGenre(genreName);
        setGenreSubscriptions(prev => prev.filter(g => g !== genreName));
      } else {
        await contentApi.subscribeToGenre(genreName);
        setGenreSubscriptions(prev => [...prev, genreName]);
      }
    } catch (err) {
      console.error('Failed to toggle genre subscription:', err);
    } finally {
      setSubscribingGenres(prev => {
        const next = new Set(prev);
        next.delete(genreName);
        return next;
      });
    }
  }

  async function handleToggleArtistSubscription(e, artistId) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;

    setSubscribingArtists(prev => new Set(prev).add(artistId));
    try {
      const isSubscribed = artistSubscriptions.includes(artistId);
      if (isSubscribed) {
        await contentApi.unsubscribeFromArtist(artistId);
        setArtistSubscriptions(prev => prev.filter(id => id !== artistId));
      } else {
        await contentApi.subscribeToArtist(artistId);
        setArtistSubscriptions(prev => [...prev, artistId]);
      }
    } catch (err) {
      console.error('Failed to toggle artist subscription:', err);
    } finally {
      setSubscribingArtists(prev => {
        const next = new Set(prev);
        next.delete(artistId);
        return next;
      });
    }
  }

  async function loadHomeData() {
    try {
      const [artists, genres] = await Promise.all([
        apiFetch('/api/content/artists'),
        apiFetch('/api/content/artists/genres'),
      ]);

      setFeaturedArtists(artists.slice(0, 6));

      const genreCounts = {};
      artists.forEach(artist => {
        artist.genres?.forEach(g => {
          genreCounts[g] = (genreCounts[g] || 0) + 1;
        });
      });

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

      let totalAlbums = 0;
      let totalSongs = 0;

      for (const artist of artists) {
        try {
          const artistId = artist.id || artist._id;
          if (artistId) {
            const albums = await apiFetch(`/api/content/artists/${artistId}/albums`);
            if (Array.isArray(albums)) {
              totalAlbums += albums.length;
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

  if (loading) {
    return <HomePageSkeleton />;
  }

  const statItems = [
    { icon: <PersonIcon sx={{ fontSize: 32 }} />, value: artistCount, label: 'Artists' },
    { icon: <AlbumIcon sx={{ fontSize: 32 }} />, value: albumCount, label: 'Albums' },
    { icon: <MusicNoteIcon sx={{ fontSize: 32 }} />, value: songCount, label: 'Songs' },
  ];

  return (
    <Box>
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────── */}
      <Box
        sx={{
          minHeight: '70vh',
          background: 'linear-gradient(135deg, #556B2F 0%, #3D4B1F 30%, #2A3416 60%, #556B2F 100%)',
          backgroundSize: '300% 300%',
          animation: 'gradientShift 8s ease infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          px: { xs: 2, md: 4 },
          width: '100vw',
          ml: 'calc(-50vw + 50%)',
        }}
      >
        {/* Floating decorative circles */}
        {HERO_CIRCLES.map((c, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: c.size,
              height: c.size,
              borderRadius: '50%',
              background: `rgba(255, 255, 255, ${c.opacity})`,
              top: c.top,
              left: c.left,
              right: c.right,
              bottom: c.bottom,
              animation: `float ${c.duration} ease-in-out ${c.delay} infinite`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Radial spotlight overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(107,142,35,0.18) 0%, transparent 65%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Left Equalizer Bars ── */}
        <Box
          sx={{
            position: 'absolute',
            left: { xs: 12, sm: 30, md: 60 },
            bottom: '15%',
            display: 'flex',
            alignItems: 'flex-end',
            gap: { xs: '3px', sm: '5px' },
            pointerEvents: 'none',
            opacity: 0,
            animation: 'fadeInUp 1s ease-out 1s forwards',
          }}
        >
          {EQ_LEFT_BARS.map((bar, i) => (
            <Box
              key={i}
              sx={{
                width: { xs: 4, sm: 6 },
                height: bar.height,
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.15)',
                transformOrigin: 'bottom',
                animation: `eqBar ${bar.duration} ease-in-out ${bar.delay} infinite`,
              }}
            />
          ))}
        </Box>

        {/* ── Right Equalizer Bars ── */}
        <Box
          sx={{
            position: 'absolute',
            right: { xs: 12, sm: 30, md: 60 },
            bottom: '15%',
            display: 'flex',
            alignItems: 'flex-end',
            gap: { xs: '3px', sm: '5px' },
            pointerEvents: 'none',
            opacity: 0,
            animation: 'fadeInUp 1s ease-out 1.2s forwards',
          }}
        >
          {EQ_RIGHT_BARS.map((bar, i) => (
            <Box
              key={i}
              sx={{
                width: { xs: 4, sm: 6 },
                height: bar.height,
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.15)',
                transformOrigin: 'bottom',
                animation: `eqBar ${bar.duration} ease-in-out ${bar.delay} infinite`,
              }}
            />
          ))}
        </Box>

        {/* ── Scrolling Sound Wave (bottom) ── */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '200%',
            height: { xs: 60, md: 80 },
            pointerEvents: 'none',
            animation: 'waveScroll 12s linear infinite',
            opacity: 0.08,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 2400 80"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,40 Q50,10 100,40 T200,40 T300,40 T400,40 T500,40 T600,40 T700,40 T800,40 T900,40 T1000,40 T1100,40 T1200,40 T1300,40 T1400,40 T1500,40 T1600,40 T1700,40 T1800,40 T1900,40 T2000,40 T2100,40 T2200,40 T2300,40 T2400,40"
              fill="none"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M0,50 Q75,20 150,50 T300,50 T450,50 T600,50 T750,50 T900,50 T1050,50 T1200,50 T1350,50 T1500,50 T1650,50 T1800,50 T1950,50 T2100,50 T2250,50 T2400,50"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
            <path
              d="M0,60 Q60,35 120,60 T240,60 T360,60 T480,60 T600,60 T720,60 T840,60 T960,60 T1080,60 T1200,60 T1320,60 T1440,60 T1560,60 T1680,60 T1800,60 T1920,60 T2040,60 T2160,60 T2280,60 T2400,60"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        </Box>

        {/* ── Second wave layer (top, reversed) ── */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200%',
            height: { xs: 40, md: 50 },
            pointerEvents: 'none',
            animation: 'waveScroll 18s linear infinite reverse',
            opacity: 0.05,
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 2400 50"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0,25 Q80,5 160,25 T320,25 T480,25 T640,25 T800,25 T960,25 T1120,25 T1280,25 T1440,25 T1600,25 T1760,25 T1920,25 T2080,25 T2240,25 T2400,25"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
            />
          </svg>
        </Box>

        {/* ── Hero Content ── */}
        {isAuthenticated ? (
          /* ── Authenticated Hero: Personalized Recommendations ── */
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              {/* Greeting */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  mb: 2,
                }}
              >
                <AutoAwesomeIcon sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 28 }} />
                <Typography
                  variant="h4"
                  sx={{
                    color: 'white',
                    fontWeight: 700,
                    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  }}
                >
                  Welcome back, {user?.username || 'Music Lover'}
                </Typography>
              </Box>

              {/* Tab pills */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 0.5,
                  mb: 4,
                }}
              >
                <Button
                  onClick={() => setActiveRecTab('forYou')}
                  startIcon={<QueueMusicIcon />}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: '50px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    ...(activeRecTab === 'forYou'
                      ? {
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        }
                      : {
                          bgcolor: 'transparent',
                          color: 'rgba(255,255,255,0.6)',
                          border: '1px solid transparent',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }),
                  }}
                >
                  For You
                </Button>
                <Button
                  onClick={() => setActiveRecTab('discover')}
                  startIcon={<ExploreIcon />}
                  sx={{
                    px: 3,
                    py: 1,
                    borderRadius: '50px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    ...(activeRecTab === 'discover'
                      ? {
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        }
                      : {
                          bgcolor: 'transparent',
                          color: 'rgba(255,255,255,0.6)',
                          border: '1px solid transparent',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.9)',
                          },
                        }),
                  }}
                >
                  Discover
                </Button>
              </Box>

              {/* Carousel area */}
              <Box>
                {recsLoading ? (
                  /* Skeleton loading */
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', overflow: 'hidden' }}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Box
                        key={i}
                        sx={{
                          minWidth: 220,
                          height: 120,
                          borderRadius: 3,
                          background: 'rgba(255,255,255,0.08)',
                          animation: 'shimmerPulse 1.5s ease-in-out infinite',
                          animationDelay: `${i * 0.15}s`,
                        }}
                      />
                    ))}
                  </Box>
                ) : (activeRecTab === 'forYou' ? subscribedRecs : discoverRecs).length > 0 ? (
                  /* Card carousel */
                  <Box sx={{ position: 'relative', mx: { xs: 0, md: 4 } }}>
                    {/* Left arrow */}
                    <IconButton
                      onClick={() => {
                        if (carouselRef.current) {
                          carouselRef.current.scrollBy({ left: -240, behavior: 'smooth' });
                        }
                      }}
                      sx={{
                        position: 'absolute',
                        left: { xs: -8, md: -44 },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        backdropFilter: 'blur(8px)',
                        display: { xs: 'none', sm: 'flex' },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                      }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>

                    {/* Scroll container — keyed by tab to re-trigger animations */}
                    <Box
                      key={activeRecTab}
                      ref={carouselRef}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        scrollBehavior: 'smooth',
                        justifyContent: 'center',
                        pb: 1,
                        px: 1,
                        '&::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                      }}
                    >
                      {(activeRecTab === 'forYou' ? subscribedRecs : discoverRecs).map((song, index) => (
                        <Box
                          component={RouterLink}
                          to={`/albums/${song.albumId}`}
                          key={`${activeRecTab}-${song.id}-${index}`}
                          sx={{
                            minWidth: 220,
                            maxWidth: 220,
                            flexShrink: 0,
                            scrollSnapAlign: 'start',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: 3,
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            p: 2.5,
                            textDecoration: 'none',
                            animation: `cardSlideIn 0.4s ease-out ${index * 0.06}s both`,
                            transition: 'background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.18)',
                              transform: 'translateY(-4px)',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                            <Box
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                bgcolor: 'rgba(255, 255, 255, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <MusicNoteIcon sx={{ color: 'white', fontSize: 20 }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  color: 'white',
                                  fontSize: '0.95rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {song.title}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem' }}>
                                {song.duration} {song.trackNo > 0 ? `· Track ${song.trackNo}` : ''}
                              </Typography>
                            </Box>
                          </Box>
                          <Chip
                            label={song.genre}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255, 255, 255, 0.15)',
                              color: 'white',
                              fontWeight: 500,
                              fontSize: '0.7rem',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          />
                        </Box>
                      ))}
                    </Box>

                    {/* Right arrow */}
                    <IconButton
                      onClick={() => {
                        if (carouselRef.current) {
                          carouselRef.current.scrollBy({ left: 240, behavior: 'smooth' });
                        }
                      }}
                      sx={{
                        position: 'absolute',
                        right: { xs: -8, md: -44 },
                        top: '50%',
                        transform: 'translateY(-50%)',
                        zIndex: 2,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        color: 'white',
                        backdropFilter: 'blur(8px)',
                        display: { xs: 'none', sm: 'flex' },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>
                ) : (
                  /* Empty state */
                  <Box
                    sx={{
                      py: 4,
                      px: 3,
                      borderRadius: 3,
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      maxWidth: 480,
                      mx: 'auto',
                    }}
                  >
                    <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 2, fontSize: '1rem' }}>
                      {activeRecTab === 'forYou'
                        ? 'Subscribe to genres to get personalized recommendations'
                        : 'No new genres to discover right now — check back soon!'}
                    </Typography>
                    <Button
                      component={RouterLink}
                      to="/genres"
                      variant="contained"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.25)',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      }}
                    >
                      Browse Genres
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Container>
        ) : (
          /* ── Guest Hero: Original "Discover Your Sound" ── */
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3rem', md: '3.5rem' },
                  fontWeight: 'bold',
                  color: 'white',
                  mb: 2,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                  lineHeight: 1.2,
                  opacity: 0,
                  animation: 'fadeInUp 0.8s ease-out 0.2s forwards',
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
                  opacity: 0,
                  animation: 'fadeInUp 0.8s ease-out 0.5s forwards',
                }}
              >
                Explore thousands of artists, albums, and songs in our curated music catalog
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 2,
                  opacity: 0,
                  animation: 'fadeInUp 0.8s ease-out 0.8s forwards',
                }}
              >
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
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.95)',
                      transform: 'translateY(-3px) scale(1.05)',
                      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                  }}
                >
                  Browse Artists
                </Button>
                <Button
                  component={RouterLink}
                  to="/genres"
                  variant="outlined"
                  size="large"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.6)',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-3px)',
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                  }}
                >
                  Browse Genres
                </Button>
              </Box>
            </Box>
          </Container>
        )}
      </Box>

      {/* ── Featured Artists Section ──────────────────────── */}
      {featuredArtists.length > 0 && (
        <Container maxWidth="lg" sx={{ py: 8 }}>
          {/* Section heading with decorative underline */}
          <Box
            ref={artistHeadingRef}
            sx={{
              textAlign: 'center',
              mb: 5,
              opacity: artistHeadingRef.current && isVisible(artistHeadingRef.current) ? 1 : 0,
              transform: artistHeadingRef.current && isVisible(artistHeadingRef.current)
                ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            <Typography
              variant="h2"
              sx={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: 'text.primary',
                mb: 1.5,
              }}
            >
              Featured Artists
            </Typography>
            <Box
              sx={{
                width: 60,
                height: 4,
                borderRadius: 2,
                bgcolor: 'primary.main',
                mx: 'auto',
              }}
            />
          </Box>

          <Grid container spacing={3} justifyContent="center">
            {featuredArtists.map((artist, index) => {
              const artistId = artist.id || artist._id;
              const isArtistSubscribed = artistSubscriptions.includes(artistId);
              const isArtistSubscribing = subscribingArtists.has(artistId);
              const ref = artistCardRefs.current[index];
              const visible = ref && isVisible(ref);

              return (
                <Grid
                  item
                  xs={12}
                  sm={6}
                  md={4}
                  key={artistId}
                  ref={(el) => (artistCardRefs.current[index] = el)}
                  sx={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(40px)',
                    transition: `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`,
                  }}
                >
                  <Card
                    elevation={2}
                    sx={{
                      position: 'relative',
                      height: 380,
                      overflow: 'hidden',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 60px rgba(85, 107, 47, 0.3)',
                      },
                      '&:hover .artist-card-media': {
                        transform: 'scale(1.1)',
                      },
                      '&:hover .artist-card-overlay': {
                        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
                      },
                    }}
                  >
                    <CardActionArea
                      component={RouterLink}
                      to={`/artists/${artistId}`}
                      sx={{ height: '100%' }}
                    >
                      {artist.image ? (
                        <CardMedia
                          className="artist-card-media"
                          component="img"
                          height="100%"
                          image={artist.image}
                          alt={artist.name}
                          sx={{
                            objectFit: 'cover',
                            transition: 'transform 0.4s ease',
                          }}
                        />
                      ) : (
                        <Box
                          className="artist-card-media"
                          sx={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '80px',
                            bgcolor: 'primary.light',
                            transition: 'transform 0.4s ease',
                          }}
                        >
                          🎵
                        </Box>
                      )}
                      {/* Gradient Overlay */}
                      <Box
                        className="artist-card-overlay"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
                          p: 2.5,
                          transition: 'background 0.3s ease',
                        }}
                      >
                        <Typography
                          variant="h5"
                          sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            mb: 0.5,
                          }}
                        >
                          {artist.name}
                        </Typography>
                        {artist.genres && artist.genres.length > 0 && (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                            {artist.genres.slice(0, 2).map(genre => (
                              <Chip
                                key={genre}
                                label={genre}
                                size="small"
                                sx={{
                                  ...theme.glass,
                                  color: 'white',
                                  fontWeight: 500,
                                  border: '1px solid rgba(255, 255, 255, 0.25)',
                                  height: 24,
                                  fontSize: '0.75rem',
                                }}
                              />
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </CardActionArea>
                    {/* Artist Subscribe Button */}
                    <Tooltip title={!isAuthenticated ? 'Login to subscribe' : isArtistSubscribed ? 'Unsubscribe' : 'Subscribe to notifications'}>
                      <span style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                        <IconButton
                          size="small"
                          disabled={!isAuthenticated || isArtistSubscribing}
                          onClick={(e) => handleToggleArtistSubscription(e, artistId)}
                          sx={{
                            bgcolor: isArtistSubscribed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                            color: isArtistSubscribed ? 'primary.main' : 'white',
                            backdropFilter: 'blur(4px)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isArtistSubscribed ? 'scale(1.1)' : 'scale(1)',
                            boxShadow: isArtistSubscribed ? '0 0 0 3px rgba(85, 107, 47, 0.3)' : 'none',
                            '&:hover': {
                              bgcolor: isArtistSubscribed ? 'white' : 'rgba(255,255,255,0.4)',
                              transform: isArtistSubscribed ? 'scale(1.2)' : 'scale(1.1)',
                            },
                            '&:active': {
                              transform: 'scale(0.9)',
                            },
                            '&.Mui-disabled': {
                              bgcolor: 'rgba(255,255,255,0.15)',
                              color: 'rgba(255,255,255,0.5)',
                            },
                          }}
                        >
                          {isArtistSubscribing ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : isArtistSubscribed ? (
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
        </Container>
      )}

      {/* ── Browse by Genre Section ──────────────────────── */}
      {topGenres.length > 0 && (
        <Box
          sx={{
            py: 8,
            background: 'linear-gradient(180deg, #F5F2ED 0%, #EDE8DF 50%, #F5F2ED 100%)',
            // Full-bleed
            width: '100vw',
            ml: 'calc(-50vw + 50%)',
          }}
        >
          <Container maxWidth="lg">
            {/* Section heading with decorative underline */}
            <Box
              ref={genreHeadingRef}
              sx={{
                textAlign: 'center',
                mb: 5,
                opacity: genreHeadingRef.current && isVisible(genreHeadingRef.current) ? 1 : 0,
                transform: genreHeadingRef.current && isVisible(genreHeadingRef.current)
                  ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
              }}
            >
              <Typography
                variant="h2"
                sx={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: 'text.primary',
                  mb: 1.5,
                }}
              >
                Browse by Genre
              </Typography>
              <Box
                sx={{
                  width: 60,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  mx: 'auto',
                }}
              />
            </Box>

            <Grid container spacing={2} justifyContent="center">
              {topGenres.map((genre, index) => {
                const isSubscribed = genreSubscriptions.includes(genre.name);
                const isSubscribing = subscribingGenres.has(genre.name);
                const ref = genreCardRefs.current[index];
                const visible = ref && isVisible(ref);

                return (
                  <Grid
                    item
                    xs={6}
                    sm={4}
                    md={2}
                    key={genre.name}
                    ref={(el) => (genreCardRefs.current[index] = el)}
                    sx={{
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'scale(1)' : 'scale(0.85)',
                      transition: `opacity 0.5s ease-out ${index * 0.08}s, transform 0.5s ease-out ${index * 0.08}s`,
                    }}
                  >
                    <Card
                      elevation={2}
                      sx={{
                        height: 200,
                        background: genre.gradient,
                        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          filter: 'brightness(1.15)',
                          transform: 'translateY(-8px) scale(1.05)',
                          boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                        },
                        // Shine sweep on hover
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                          transition: 'left 0.6s ease',
                          zIndex: 1,
                          pointerEvents: 'none',
                        },
                        '&:hover::before': {
                          left: '100%',
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
                          position: 'relative',
                          zIndex: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '40px',
                            mb: 0.5,
                            animation: visible ? 'float 4s ease-in-out infinite' : 'none',
                            animationDelay: `${index * 0.3}s`,
                          }}
                        >
                          {genre.icon}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: 'white',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            mb: 0.5,
                            fontSize: '0.95rem',
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
                      {/* Subscribe Button */}
                      <Tooltip title={!isAuthenticated ? 'Login to subscribe' : isSubscribed ? 'Unsubscribe' : 'Subscribe to notifications'}>
                        <span style={{ position: 'absolute', top: 6, right: 6, zIndex: 3 }}>
                          <IconButton
                            size="small"
                            disabled={!isAuthenticated || isSubscribing}
                            onClick={(e) => handleToggleGenreSubscription(e, genre.name)}
                            sx={{
                              bgcolor: isSubscribed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)',
                              color: isSubscribed ? 'primary.main' : 'white',
                              backdropFilter: 'blur(4px)',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              transform: isSubscribed ? 'scale(1.1)' : 'scale(1)',
                              boxShadow: isSubscribed ? '0 0 0 3px rgba(85, 107, 47, 0.3)' : 'none',
                              '&:hover': {
                                bgcolor: isSubscribed ? 'white' : 'rgba(255,255,255,0.4)',
                                transform: isSubscribed ? 'scale(1.2)' : 'scale(1.1)',
                              },
                              '&:active': {
                                transform: 'scale(0.9)',
                              },
                              '&.Mui-disabled': {
                                bgcolor: 'rgba(255,255,255,0.15)',
                                color: 'rgba(255,255,255,0.5)',
                              },
                            }}
                          >
                            {isSubscribing ? (
                              <CircularProgress size={16} color="inherit" />
                            ) : isSubscribed ? (
                              <NotificationsActiveIcon sx={{ fontSize: 16 }} />
                            ) : (
                              <NotificationsNoneIcon sx={{ fontSize: 16 }} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Container>
        </Box>
      )}

      {/* ── Stats Section ────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid
          container
          spacing={3}
          justifyContent="center"
          ref={statsSectionRef}
        >
          {statItems.map((stat, index) => (
              <Grid item xs={12} sm={4} key={stat.label}>
                <Card
                  elevation={2}
                  sx={{
                    background: theme.gradients.statCard,
                    p: 3,
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: statsVisible ? 1 : 0,
                    transform: statsVisible ? 'translateY(0)' : 'translateY(30px)',
                    transitionDelay: `${index * 0.15}s`,
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 30px rgba(85, 107, 47, 0.2)',
                    },
                  }}
                >
                  {/* Icon container */}
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      bgcolor: 'rgba(85, 107, 47, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1.5,
                      color: 'primary.main',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: '3rem',
                      fontWeight: 'bold',
                      color: 'primary.main',
                      mb: 1,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: '0.85rem',
                      color: 'text.secondary',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    {stat.label}
                  </Typography>
                </Card>
              </Grid>
          ))}
        </Grid>

        {/* ── CTA Box for Non-Authenticated Users ────────── */}
        {!isAuthenticated && (
          <Card
            ref={ctaRef}
            elevation={3}
            sx={{
              background: 'linear-gradient(135deg, #556B2F 0%, #3D4B1F 50%, #2A3416 100%)',
              mt: 5,
              p: 4,
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              opacity: ctaRef.current && isVisible(ctaRef.current) ? 1 : 0,
              transform: ctaRef.current && isVisible(ctaRef.current)
                ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
            }}
          >
            {/* Decorative corner circle */}
            <Box
              sx={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                pointerEvents: 'none',
              }}
            />
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
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.95)',
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
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
