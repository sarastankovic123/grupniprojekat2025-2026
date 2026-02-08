import React, { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { fetchNotifications, markAsRead, markAsUnread } from "../api/notifications";
import { apiFetch } from "../api/apiFetch";
import { contentApi } from "../api/content";

// Material UI Components
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Divider,
  AppBar,
  Toolbar,
  Breadcrumbs,
  Link,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  Snackbar,
  Alert,
  Badge,
  Grid,
  ButtonGroup,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";

// Material UI Icons
import {
  Email as EmailIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Edit as EditIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  Lock as LockIcon,
  Logout as LogoutIcon,
  Mail as MailIcon,
  MailOutline as MailOutlineIcon,
  Done as DoneIcon,
  MarkAsUnread as MarkAsUnreadIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Home as HomeIcon,
  Save as SaveIcon,
} from "@mui/icons-material";

// Skeleton Components
import ProfileSkeleton from "../components/ProfileSkeleton";
import NotificationsSkeleton from "../components/NotificationsSkeleton";

// Helper functions
function getNotifId(n) {
  return n?.id || n?._id || n?.notificationId;
}

function getCreatedAt(n) {
  return n?.createdAt || n?.created_at || n?.timestamp || n?.time;
}

function getIsRead(n) {
  return Boolean(n?.isRead ?? n?.read);
}

function formatDateTime(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return String(timestamp);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Tab Panel Component
function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </Box>
  );
}

export default function Profile() {
  const { user, logout, setAuthToken } = useAuth();

  // Profile state
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingIds, setUpdatingIds] = useState(new Set());

  // Subscriptions state
  const [artistSubscriptions, setArtistSubscriptions] = useState([]);
  const [genreSubscriptions, setGenreSubscriptions] = useState([]);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [unsubscribingIds, setUnsubscribingIds] = useState(new Set());

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Load profile data
  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      setProfileStatus({ type: "", message: "" });
      setProfileLoading(true);

      try {
        const data = await apiFetch("/api/auth/me");
        if (!alive) return;

        const u = data?.user || null;
        setProfile(u);
        setProfileForm({
          username: u?.username || "",
          firstName: u?.firstName || "",
          lastName: u?.lastName || "",
        });
      } catch (err) {
        if (!alive) return;
        setProfileStatus({
          type: "error",
          message: err.message || "Failed to load profile",
        });
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, []);

  // Load notifications
  useEffect(() => {
    let alive = true;

    async function loadNotifications() {
      setError("");
      setNotificationsLoading(true);
      try {
        const data = await fetchNotifications();
        if (!alive) return;
        setNotifications(Array.isArray(data) ? data : data?.items || []);
      } catch (err) {
        if (!alive) return;
        setError(err.message || "Failed to load notifications");
      } finally {
        if (!alive) return;
        setNotificationsLoading(false);
      }
    }

    loadNotifications();
    return () => {
      alive = false;
    };
  }, []);

  // Refresh notifications
  async function refresh() {
    setError("");
    setNotificationsLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : data?.items || []);
    } catch (err) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setNotificationsLoading(false);
    }
  }

  // Toggle notification read status
  async function toggleReadStatus(notif) {
    const notifId = getNotifId(notif);
    if (!notifId) {
      setError("Notification ID missing");
      return;
    }

    if (updatingIds.has(notifId)) return;

    setUpdatingIds((prev) => {
      const next = new Set(prev);
      next.add(notifId);
      return next;
    });

    try {
      const currentlyRead = getIsRead(notif);

      if (currentlyRead) {
        await markAsUnread(notifId);
      } else {
        await markAsRead(notifId);
      }

      setNotifications((prev) =>
        prev.map((n) => {
          const id = getNotifId(n);
          if (id !== notifId) return n;

          const nextRead = !currentlyRead;
          return { ...n, isRead: nextRead, read: nextRead };
        })
      );
    } catch (err) {
      console.error("Failed to toggle read status:", err);
      setError(err.message || "Failed to update notification");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(notifId);
        return next;
      });
    }
  }

  // Save profile
  async function saveProfile(e) {
    e.preventDefault();
    setProfileStatus({ type: "", message: "" });
    setProfileSaving(true);

    try {
      const payload = {
        username: profileForm.username,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      };

      const data = await apiFetch("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const jwt = data?.accessToken || data?.access_token;
      if (jwt) setAuthToken(jwt);
      if (data?.user) setProfile(data.user);

      setProfileStatus({ type: "success", message: "Profile updated successfully!" });
    } catch (err) {
      setProfileStatus({
        type: "error",
        message: err.message || "Failed to save profile",
      });
    } finally {
      setProfileSaving(false);
    }
  }

  // Load subscriptions when Subscriptions tab is active
  useEffect(() => {
    if (activeTab !== 2) return; // Only load when Subscriptions tab is active

    let alive = true;

    async function loadSubscriptions() {
      setSubscriptionsLoading(true);
      try {
        const [artists, genres] = await Promise.all([
          contentApi.getUserArtistSubscriptions(),
          contentApi.getUserGenreSubscriptions(),
        ]);
        if (!alive) return;
        setArtistSubscriptions(Array.isArray(artists) ? artists : []);
        setGenreSubscriptions(Array.isArray(genres) ? genres : []);
      } catch (err) {
        if (!alive) return;
        console.error("Failed to load subscriptions:", err);
      } finally {
        if (!alive) return;
        setSubscriptionsLoading(false);
      }
    }

    loadSubscriptions();
    return () => {
      alive = false;
    };
  }, [activeTab]);

  // Unsubscribe from artist
  async function handleUnsubscribeArtist(artistId) {
    setUnsubscribingIds((prev) => new Set(prev).add(artistId));
    try {
      await contentApi.unsubscribeFromArtist(artistId);
      setArtistSubscriptions((prev) => prev.filter((s) => s.artistId !== artistId));
    } catch (err) {
      alert(err.message || "Failed to unsubscribe");
    } finally {
      setUnsubscribingIds((prev) => {
        const next = new Set(prev);
        next.delete(artistId);
        return next;
      });
    }
  }

  // Unsubscribe from genre
  async function handleUnsubscribeGenre(genre) {
    setUnsubscribingIds((prev) => new Set(prev).add(genre));
    try {
      await contentApi.unsubscribeFromGenre(genre);
      setGenreSubscriptions((prev) => prev.filter((s) => s.genre !== genre));
    } catch (err) {
      alert(err.message || "Failed to unsubscribe");
    } finally {
      setUnsubscribingIds((prev) => {
        const next = new Set(prev);
        next.delete(genre);
        return next;
      });
    }
  }

  // Calculate unread count
  const unreadCount = useMemo(
    () => notifications.filter((n) => !getIsRead(n)).length,
    [notifications]
  );

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Show skeleton while loading initial profile
  if (profileLoading) {
    return (
      <Box>
        <AppBar position="static" color="default" elevation={1}>
          <Container maxWidth="lg">
            <Toolbar sx={{ px: { xs: 0 } }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Profile
              </Typography>
            </Toolbar>
          </Container>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <ProfileSkeleton />
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      {/* Top Navigation Bar */}
      <AppBar position="static" color="default" elevation={1}>
        <Container maxWidth="lg">
          <Toolbar sx={{ px: { xs: 0 } }}>
            <Breadcrumbs sx={{ flexGrow: 1 }}>
              <Link
                component={RouterLink}
                to="/"
                underline="hover"
                color="inherit"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <HomeIcon fontSize="small" />
                Home
              </Link>
              <Typography color="text.primary">Profile</Typography>
            </Breadcrumbs>

            <ButtonGroup variant="outlined" size="small" sx={{ display: { xs: "none", sm: "flex" } }}>
              <Button component={RouterLink} to="/profile/password" startIcon={<LockIcon />}>
                Change Password
              </Button>
              <Button onClick={logout} color="error" startIcon={<LogoutIcon />}>
                Logout
              </Button>
            </ButtonGroup>

            {/* Mobile buttons */}
            <Box sx={{ display: { xs: "flex", sm: "none" }, gap: 1 }}>
              <IconButton component={RouterLink} to="/profile/password" size="small">
                <LockIcon />
              </IconButton>
              <IconButton onClick={logout} size="small" color="error">
                <LogoutIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Left Column - Profile Info Card */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={3}
              sx={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}
            >
              <CardContent>
                {/* Avatar Section */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Avatar
                        sx={{
                          bgcolor: 'success.main',
                          width: 28,
                          height: 28,
                          border: '2px solid white',
                        }}
                      >
                        <CheckIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    }
                  >
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        fontSize: 48,
                        bgcolor: 'primary.main',
                        boxShadow: 3,
                      }}
                    >
                      {profile?.username?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  </Badge>
                  <Typography variant="h4" sx={{ mt: 2, fontWeight: 700 }}>
                    {profile?.username || user?.username || 'User'}
                  </Typography>
                  <Chip
                    label={user?.role || 'USER'}
                    color={user?.role === 'ADMIN' ? 'secondary' : 'primary'}
                    size="small"
                    icon={user?.role === 'ADMIN' ? <AdminPanelSettingsIcon /> : <PersonIcon />}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* User Info List */}
                <List disablePadding>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email"
                      secondary={profile?.email || user?.email || 'N/A'}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body2', color: 'text.primary', fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Full Name"
                      secondary={`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'N/A'}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body2', color: 'text.primary', fontWeight: 500 }}
                    />
                  </ListItem>
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <BadgeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="User ID"
                      secondary={user?.userId || 'N/A'}
                      primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                      secondaryTypographyProps={{ variant: 'body2', color: 'text.primary', fontWeight: 400, fontSize: '0.75rem' }}
                    />
                  </ListItem>
                </List>

                {/* Stats Section */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'primary.main',
                      color: 'white',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold">
                      {unreadCount}
                    </Typography>
                    <Typography variant="caption">Unread</Typography>
                  </Paper>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      bgcolor: 'info.main',
                      color: 'white',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h4" fontWeight="bold">
                      {notifications.length}
                    </Typography>
                    <Typography variant="caption">Total</Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Tabbed Content */}
          <Grid item xs={12} md={8}>
            <Card elevation={3}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                <Tab icon={<EditIcon />} iconPosition="start" label="Edit Profile" />
                <Tab icon={<NotificationsIcon />} iconPosition="start" label="Notifications" />
                <Tab
                  icon={
                    <Badge badgeContent={artistSubscriptions.length + genreSubscriptions.length} color="primary">
                      <NotificationsIcon />
                    </Badge>
                  }
                  iconPosition="start"
                  label="Subscriptions"
                />
                <Tab icon={<SettingsIcon />} iconPosition="start" label="Settings" />
              </Tabs>

              {/* Tab 1: Edit Profile */}
              <TabPanel value={activeTab} index={0}>
                <Box component="form" onSubmit={saveProfile}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm((p) => ({ ...p, username: e.target.value }))}
                        disabled={profileSaving}
                        variant="outlined"
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, firstName: e.target.value }))}
                        disabled={profileSaving}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm((p) => ({ ...p, lastName: e.target.value }))}
                        disabled={profileSaving}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <LoadingButton
                        type="submit"
                        variant="contained"
                        loading={profileSaving}
                        loadingIndicator="Saving..."
                        startIcon={<SaveIcon />}
                        size="large"
                      >
                        Save Changes
                      </LoadingButton>
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>

              {/* Tab 2: Notifications */}
              <TabPanel value={activeTab} index={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Your Notifications
                    {unreadCount > 0 && (
                      <Chip
                        label={`${unreadCount} unread`}
                        color="primary"
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    )}
                  </Typography>
                  <Tooltip title="Refresh notifications">
                    <IconButton onClick={refresh} disabled={notificationsLoading} size="small">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {notificationsLoading ? (
                  <NotificationsSkeleton />
                ) : notifications.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                    <NotificationsIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                    <Typography>No notifications yet</Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {notifications.map((notif, idx) => {
                      const id = getNotifId(notif) || idx;
                      const isRead = getIsRead(notif);
                      const createdAt = getCreatedAt(notif);

                      return (
                        <ListItemButton
                          key={id}
                          sx={{
                            bgcolor: isRead ? 'transparent' : 'action.hover',
                            borderLeft: isRead ? 'none' : '4px solid',
                            borderLeftColor: 'primary.main',
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': { bgcolor: 'action.selected' },
                          }}
                        >
                          <ListItemIcon>
                            {isRead ? (
                              <MailOutlineIcon color="disabled" />
                            ) : (
                              <MailIcon color="primary" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={notif.message}
                            secondary={formatDateTime(createdAt)}
                            primaryTypographyProps={{
                              fontWeight: isRead ? 400 : 600,
                            }}
                          />
                          <Tooltip title={isRead ? "Mark Unread" : "Mark Read"}>
                            <IconButton
                              onClick={() => toggleReadStatus(notif)}
                              disabled={updatingIds.has(getNotifId(notif))}
                              size="small"
                            >
                              {isRead ? <MarkAsUnreadIcon /> : <DoneIcon />}
                            </IconButton>
                          </Tooltip>
                        </ListItemButton>
                      );
                    })}
                  </List>
                )}
              </TabPanel>

              {/* Tab 3: Subscriptions */}
              <TabPanel value={activeTab} index={2}>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  My Subscriptions
                </Typography>

                {subscriptionsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                    <Typography>Loading subscriptions...</Typography>
                  </Box>
                ) : (
                  <>
                    {/* Artist Subscriptions */}
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Artist Subscriptions ({artistSubscriptions.length})
                    </Typography>

                    {artistSubscriptions.length === 0 ? (
                      <Paper sx={{ p: 3, textAlign: "center", mb: 4, bgcolor: "grey.50" }}>
                        <Typography color="text.secondary">
                          You are not subscribed to any artists yet.
                        </Typography>
                        <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 2 }}>
                          Browse Artists
                        </Button>
                      </Paper>
                    ) : (
                      <List sx={{ mb: 4 }}>
                        {artistSubscriptions.map((sub) => (
                          <ListItem
                            key={sub.id || sub.artistId}
                            secondaryAction={
                              <LoadingButton
                                loading={unsubscribingIds.has(sub.artistId)}
                                variant="outlined"
                                color="error"
                                size="small"
                                onClick={() => handleUnsubscribeArtist(sub.artistId)}
                              >
                                Unsubscribe
                              </LoadingButton>
                            }
                            sx={{
                              bgcolor: "background.paper",
                              mb: 1,
                              borderRadius: 1,
                              border: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <ListItemButton component={RouterLink} to={`/artists/${sub.artistId}`}>
                              <ListItemIcon>
                                <PersonIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={sub.artistName || "Unknown Artist"}
                                secondary={
                                  <>
                                    {sub.artistGenres && sub.artistGenres.length > 0 && (
                                      <Box
                                        component="span"
                                        sx={{ display: "flex", gap: 0.5, mt: 0.5, flexWrap: "wrap" }}
                                      >
                                        {sub.artistGenres.slice(0, 3).map((genre, idx) => (
                                          <Chip key={idx} label={genre} size="small" />
                                        ))}
                                      </Box>
                                    )}
                                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                      Subscribed {new Date(sub.createdAt).toLocaleDateString()}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {/* Genre Subscriptions */}
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Genre Subscriptions ({genreSubscriptions.length})
                    </Typography>

                    {genreSubscriptions.length === 0 ? (
                      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "grey.50" }}>
                        <Typography color="text.secondary">
                          You are not subscribed to any genres yet.
                        </Typography>
                      </Paper>
                    ) : (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {genreSubscriptions.map((sub) => (
                          <Chip
                            key={sub.id || sub.genre}
                            label={sub.genre}
                            onDelete={() => handleUnsubscribeGenre(sub.genre)}
                            deleteIcon={unsubscribingIds.has(sub.genre) ? <span>...</span> : undefined}
                            color="primary"
                            variant="outlined"
                            sx={{ py: 2.5, fontSize: "0.9rem" }}
                          />
                        ))}
                      </Box>
                    )}
                  </>
                )}
              </TabPanel>

              {/* Tab 4: Settings */}
              <TabPanel value={activeTab} index={3}>
                <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                  <SettingsIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Settings
                  </Typography>
                  <Typography variant="body2">
                    Additional settings will be available here soon.
                  </Typography>
                </Box>
              </TabPanel>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Snackbar for Profile Status Messages */}
      <Snackbar
        open={!!profileStatus.message}
        autoHideDuration={4000}
        onClose={() => setProfileStatus({ type: '', message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={profileStatus.type === 'success' ? 'success' : 'error'}
          variant="filled"
          onClose={() => setProfileStatus({ type: '', message: '' })}
          sx={{ width: '100%' }}
        >
          {profileStatus.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
