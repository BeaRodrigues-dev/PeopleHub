import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Paper, TextField, Typography } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { authApi } from "../api";
import { useAuthStore } from "../authStore";
import { ApiError } from "../../../api/httpClient";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login(email.trim(), password);
      setSession({ token: res.token, email: res.email, expiresAt: res.expiresAt });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#241019",
        backgroundImage: "linear-gradient(160deg, #241019 0%, #3A1D2A 60%, #241019 100%)",
        p: 2,
      }}
    >
      <Paper elevation={0} sx={{ width: "100%", maxWidth: 380, p: 4, borderRadius: 3, bgcolor: "background.paper" }}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              background: "linear-gradient(135deg, #7D3A52, #C4849A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              mb: 1.5,
            }}
          >
            <LockRoundedIcon fontSize="small" />
          </Box>
          <Typography fontWeight={800} fontSize={19} letterSpacing="-0.01em">People Hub</Typography>
          <Typography fontSize={12.5} color="text.secondary">Entre para acessar o HR OS</Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <TextField
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            size="small"
          />
          <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 0.5 }}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
