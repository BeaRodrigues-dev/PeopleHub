import { useState, type FormEvent } from "react";
import { Alert, Box, Button, Card, Stack, TextField, Typography } from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { authApi } from "../api";
import { useAuthStore } from "../authStore";
import { useToast } from "../../../components/common/ToastProvider";

export function SettingsPage() {
  const session = useAuthStore((s) => s.session);
  const currentEmail = session?.user.email ?? "";
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState(currentEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("La nueva contraseña y la confirmación no coinciden.");
      return;
    }
    if (!newEmail.trim() && !newPassword) {
      setError("Cambia el correo y/o la contraseña antes de guardar.");
      return;
    }

    setLoading(true);
    try {
      await authApi.updateCredentials({
        currentPassword,
        newEmail: newEmail.trim() !== currentEmail ? newEmail.trim() : undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(
        newEmail.trim() !== currentEmail
          ? "Credenciales actualizadas. Si cambiaste el correo, confirma el enlace enviado a la nueva bandeja de entrada."
          : "Credenciales actualizadas.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron actualizar las credenciales.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 560, mx: "auto" }}>
      <Typography variant="h4" sx={{ mb: 0.5 }}>Configuración</Typography>
      <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>Gestiona el correo y la contraseña de acceso a People Hub.</Typography>

      <Card sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4 }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: "#E7F2EA", display: "grid", placeItems: "center", color: "primary.main" }}>
            <LockRoundedIcon fontSize="small" />
          </Box>
          <Box>
            <Typography fontWeight={800}>Inicio de sesión</Typography>
            <Typography variant="caption" color="text.secondary">Correo actual: {currentEmail}</Typography>
          </Box>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            fullWidth
            size="small"
            helperText="Obligatoria para confirmar cualquier cambio."
          />
          <TextField
            label="Nuevo correo"
            type="email"
            autoComplete="username"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            fullWidth
            size="small"
          />
          <TextField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            size="small"
            helperText="Deja en blanco para mantener la contraseña actual."
          />
          {newPassword && (
            <TextField
              label="Confirmar nueva contraseña"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              size="small"
            />
          )}
          <Button type="submit" variant="contained" disabled={loading} sx={{ alignSelf: "flex-start", mt: 0.5 }}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
