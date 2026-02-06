import React, { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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
  Button,
  Link,
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  VerifiedUser as VerifiedIcon,
} from "@mui/icons-material";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();

  const initialEmail = loc.state?.email || "";

  const [form, setForm] = useState({
    email: initialEmail,
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setNotConfirmed(false);
    setLoading(true);

    try {
      const data = await login(form);
      nav("/verify-otp", { state: { ...data, email: form.email } });
    } catch (e) {
      const msg = e?.message || "Login failed";
      setErr(msg);

      if (msg === "Email is not confirmed") {
        setNotConfirmed(true);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleResend = async () => {
    try {
      setResendLoading(true);
      await apiFetch("/api/auth/resend-confirmation", {
        method: "POST",
        body: JSON.stringify({ email: form.email }),
      });

      alert("Confirmation email resent!");
    } catch (e) {
      alert("Failed to resend confirmation");
    } finally {
      setResendLoading(false);
    }
  };

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
      <Container maxWidth="sm">
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
            <LoginIcon sx={{ fontSize: 48, color: "white", mb: 1 }} />
            <Typography variant="h4" component="h1" sx={{ color: "white", fontWeight: 600 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", mt: 1 }}>
              Login with OTP verification for secure access
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={onSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
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

                <TextField
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  fullWidth
                  autoComplete="current-password"
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

                {err && (
                  <Alert severity="error" onClose={() => setErr("")}>
                    {err}
                  </Alert>
                )}

                {notConfirmed && (
                  <Alert
                    severity="warning"
                    action={
                      <Stack direction="row" spacing={1}>
                        <LoadingButton
                          size="small"
                          onClick={handleResend}
                          loading={resendLoading}
                          variant="outlined"
                          color="warning"
                        >
                          Resend
                        </LoadingButton>
                        <Button
                          size="small"
                          onClick={() => nav("/confirm")}
                          variant="outlined"
                          color="warning"
                        >
                          Open Page
                        </Button>
                      </Stack>
                    }
                  >
                    Your email is not confirmed yet. Please check your inbox or resend the
                    confirmation email.
                  </Alert>
                )}

                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={loading}
                  loadingPosition="start"
                  startIcon={<LoginIcon />}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  {loading ? "Sending OTP..." : "Login (Send OTP)"}
                </LoadingButton>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<PersonAddIcon />}
                    onClick={() => nav("/register")}
                    sx={{ textTransform: "none" }}
                  >
                    Create Account
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<VerifiedIcon />}
                    onClick={() => nav("/confirm")}
                    sx={{ textTransform: "none" }}
                  >
                    Confirm Account
                  </Button>
                </Stack>

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Link
                    component={RouterLink}
                    to="/forgot-password"
                    underline="hover"
                    sx={{
                      textAlign: "center",
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      color: "primary.main",
                    }}
                  >
                    Zaboravljena lozinka?
                  </Link>
                  <Link
                    component={RouterLink}
                    to="/recover"
                    underline="hover"
                    sx={{
                      textAlign: "center",
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      color: "primary.main",
                    }}
                  >
                    Prijava preko magic linka
                  </Link>
                </Stack>
              </Stack>
            </form>
          </CardContent>
        </Card>

        <Typography
          variant="body2"
          align="center"
          sx={{ mt: 3, color: "rgba(255, 255, 255, 0.8)" }}
        >
          Secure login with one-time password verification
        </Typography>
      </Container>
    </Box>
  );
}
