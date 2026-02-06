import React, { useMemo, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { apiFetch } from "../api/apiFetch";
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Typography,
  Alert,
  Stack,
  Link,
  Divider,
  InputAdornment,
  IconButton,
  Grid,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Email as EmailIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  PersonAdd as PersonAddIcon,
  Login as LoginIcon,
} from "@mui/icons-material";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const normalized = useMemo(() => {
    return {
      email: email.trim(),
      username: username.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      password: password,
      confirmPassword: confirmPassword,
    };
  }, [email, username, firstName, lastName, password, confirmPassword]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setError("");

    const { email, username, firstName, lastName, password, confirmPassword } =
      normalized;

    if (!email || !username || !firstName || !lastName || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          username,
          firstName,
          lastName,
          password,
          confirmPassword,
        }),
      });

      navigate("/confirm");
    } catch (err) {
      setError(err?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #556B2F 0%, #3D4B1F 50%, #2A3416 100%)",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card
          elevation={8}
          sx={{
            background: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(10px)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              background: "linear-gradient(135deg, #556B2F 0%, #6B8E23 100%)",
              p: 3,
              textAlign: "center",
            }}
          >
            <PersonAddIcon sx={{ fontSize: 48, color: "white", mb: 1 }} />
            <Typography variant="h4" component="h1" sx={{ color: "white", fontWeight: 600 }}>
              Create Your Account
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", mt: 1 }}>
              Join our music platform and discover amazing artists
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@gmail.com"
                  required
                  fullWidth
                  autoComplete="email"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Marko"
                      required
                      fullWidth
                      autoComplete="given-name"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Marković"
                      required
                      fullWidth
                      autoComplete="family-name"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <TextField
                  label="Username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  required
                  fullWidth
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircleIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  fullWidth
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          size="small"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && (
                  <Alert severity="error" onClose={() => setError("")}>
                    {error}
                  </Alert>
                )}

                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={loading}
                  loadingPosition="start"
                  startIcon={<PersonAddIcon />}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </LoadingButton>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?
                  </Typography>
                </Divider>

                <Link
                  component={RouterLink}
                  to="/login"
                  underline="none"
                  sx={{ textDecoration: "none" }}
                >
                  <LoadingButton
                    variant="outlined"
                    fullWidth
                    startIcon={<LoginIcon />}
                    sx={{
                      py: 1.5,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Go to Login
                  </LoadingButton>
                </Link>
              </Stack>
            </form>
          </CardContent>
        </Card>

        <Typography
          variant="body2"
          align="center"
          sx={{ mt: 3, color: "rgba(255, 255, 255, 0.8)" }}
        >
          By registering, you'll receive a confirmation email to verify your account
        </Typography>
      </Container>
    </Box>
  );
}
