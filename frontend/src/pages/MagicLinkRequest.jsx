import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  AutoFixHigh as AutoFixHighIcon,
  Email as EmailIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material";

export default function MagicLinkRequest() {
  const { requestMagicLink } = useAuth();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!email.trim()) {
      setStatus({ type: "error", message: "Email je obavezan." });
      return;
    }

    try {
      setLoading(true);
      await requestMagicLink({ email: email.trim() });

      setStatus({
        type: "success",
        message:
          "Ako email postoji u sistemu, magic link je poslat. Proveri inbox ili spam.",
      });
      setEmail("");
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "GreÅ¡ka pri slanju magic linka.",
      });
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
            <AutoFixHighIcon sx={{ fontSize: 48, color: "white", mb: 1 }} />
            <Typography variant="h4" component="h1" sx={{ color: "white", fontWeight: 600 }}>
              Magic Link Prijava
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", mt: 1 }}>
              Prijavi se bez lozinke uz jedan klik
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Email Adresa"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="npr. pera@gmail.com"
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
                  helperText="PoslaÄ‡emo ti link za trenutnu prijavu u tvoj inbox"
                />

                {status.message && (
                  <Alert
                    severity={status.type === "success" ? "success" : "error"}
                    onClose={() => setStatus({ type: "", message: "" })}
                  >
                    {status.message}
                  </Alert>
                )}

                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={loading}
                  loadingPosition="start"
                  startIcon={<SendIcon />}
                  fullWidth
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  {loading ? "Å aljem..." : "PoÅ¡alji Magic Link"}
                </LoadingButton>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ili
                  </Typography>
                </Divider>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <Link
                    component={RouterLink}
                    to="/login"
                    underline="none"
                    sx={{ flex: 1, textDecoration: "none" }}
                  >
                    <LoadingButton
                      variant="outlined"
                      fullWidth
                      startIcon={<ArrowBackIcon />}
                      sx={{
                        py: 1.5,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Nazad na Login
                    </LoadingButton>
                  </Link>
                  <Link
                    component={RouterLink}
                    to="/register"
                    underline="none"
                    sx={{ flex: 1, textDecoration: "none" }}
                  >
                    <LoadingButton
                      variant="outlined"
                      fullWidth
                      startIcon={<PersonAddIcon />}
                      sx={{
                        py: 1.5,
                        textTransform: "none",
                        fontWeight: 600,
                      }}
                    >
                      Registracija
                    </LoadingButton>
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
          Magic link je validan 15 minuta od slanja
        </Typography>
      </Container>
    </Box>
  );
}
