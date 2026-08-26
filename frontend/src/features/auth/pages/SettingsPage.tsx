import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, Stack, TextField, Typography } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { authApi } from "../api";
import { useAuthStore } from "../authStore";
import { ApiError } from "../../../api/httpClient";
import { useToast } from "../../../components/common/ToastProvider";

export function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  const setSession = useAuthStore((s) => s.setSession);
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(session?.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("A nova senha e a confirmação não coincidem.");
      return;
    }
    if (!newEmail.trim() && !newPassword) {
      setError("Altere o email e/ou a senha antes de salvar.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.updateCredentials({
        currentPassword,
        newEmail: newEmail.trim() !== session?.email ? newEmail.trim() : undefined,
        newPassword: newPassword || undefined,
      });
      setSession({ token: res.token, email: res.email, expiresAt: res.expiresAt });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Credenciais atualizadas.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível atualizar as credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 560, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Configurações</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Gerencie o email e a senha de acesso ao People Hub.</Typography>

      <Card sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#E7F2EA", display: "grid", placeItems: "center", color: "primary.main" }}>
            <LockRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography fontWeight={800}>Login</Typography>
            <Typography variant="caption" color="text.secondary">Email atual: {session?.email}</Typography>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Senha atual"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            fullWidth
            size="small"
            helperText="Obrigatória para confirmar qualquer alteração."
          />
          <TextField
            label="Novo email"
            type="email"
            autoComplete="username"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            size="small"
            helperText="Deixe em branco para manter a senha atual."
          />
          {newPassword && (
            <TextField
              label="Confirmar nova senha"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              size="small"
            />
          )}
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start", mt: 0.5 }}>
            {loading ? "Salvando…" : "Salvar alterações"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
