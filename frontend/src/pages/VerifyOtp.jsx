import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Button,
  Paper,
  Chip,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import {
  VerifiedUser as VerifiedUserIcon,
  Pin as PinIcon,
  ArrowBack as ArrowBackIcon,
  Email as EmailIcon,
  Info as InfoIcon,
} from "@mui/icons-material";

export default function VerifyOtp() {
  const nav = useNavigate();
  const loc = useLocation();
  const { verifyOtp } = useAuth();

  const loginState = loc.state || {};
  const emailFromState = loginState.email || "";
  const sessionIdFromState = loginState.sessionId || loginState.sessionID || loginState.sid || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const payloadHint = useMemo(() => {
    return sessionIdFromState ? "Using sessionId + otp" : "Using email + otp";
  }, [sessionIdFromState]);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const payload = sessionIdFromState
        ? { sessionId: sessionIdFromState, otp }
        : { email: emailFromState, otp };

      await verifyOtp(payload);

      nav("/artists", { replace: true });
    } catch (e) {
      setErr(e.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  }

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
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
            <VerifiedUserIcon sx={{ fontSize: 48, color: "white", mb: 1 }} />
            <Typography variant="h4" component="h1" sx={{ color: "white", fontWeight: 600 }}>
              Verify Your Identity
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.9)", mt: 1 }}>
              Enter the 6-digit code sent to your email
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                background: "linear-gradient(135deg, #f0f4e8 0%, #e8f0dc 100%)",
                borderRadius: 2,
                border: "1px solid #d0ddc0",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <EmailIcon sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  Email Address
                </Typography>
              </Stack>
              <Typography variant="body1" sx={{ mb: 2, wordBreak: "break-all" }}>
                {emailFromState || "(missing - please go back to login)"}
              </Typography>

              <Stack direction="row" alignItems="center" spacing={1}>
                <InfoIcon sx={{ fontSize: 20, color: "primary.main" }} />
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  Verification Mode
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                <Chip
                  label={payloadHint}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 500 }}
                />
              </Stack>
            </Paper>

            <form onSubmit={onSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="OTP Code"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                  fullWidth
                  placeholder="000000"
                  inputProps={{
                    maxLength: 6,
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    style: {
                      fontSize: "1.5rem",
                      letterSpacing: "0.5rem",
                      textAlign: "center",
                      fontWeight: 600,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <PinIcon color="action" sx={{ mr: 1 }} />
                    ),
                  }}
                  helperText="Check your email for the 6-digit verification code"
                />

                {err && (
                  <Alert severity="error" onClose={() => setErr("")}>
                    {err}
                  </Alert>
                )}

                <LoadingButton
                  type="submit"
                  variant="contained"
                  size="large"
                  loading={loading}
                  loadingPosition="start"
                  startIcon={<VerifiedUserIcon />}
                  fullWidth
                  disabled={otp.length !== 6}
                  sx={{
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  {loading ? "Verifying..." : "Verify OTP"}
                </LoadingButton>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<ArrowBackIcon />}
                  onClick={() => nav("/login", { state: { email: emailFromState } })}
                  sx={{
                    py: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Back to Login
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        <Typography
          variant="body2"
          align="center"
          sx={{ mt: 3, color: "rgba(255, 255, 255, 0.8)" }}
        >
          Didn't receive the code? Check your spam folder or try logging in again
        </Typography>
      </Container>
    </Box>
  );
}
