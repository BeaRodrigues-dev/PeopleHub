import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

export function errorMessage(error: unknown, fallback = "No fue posible completar la operación."): string {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

/** Estado de error predeterminado para pantallas que dependen de una llamada a Supabase (sin conexión, credenciales incorrectas, RLS, etc.). */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1, py: 7, px: 3 }}>
      <ErrorOutlineRoundedIcon sx={{ fontSize: 34, color: "error.main" }} />
      <Typography fontWeight={800} fontSize={15}>No fue posible cargar los datos</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
        {errorMessage(error)} Verifique se o Supabase está configurado corretamente (ver README.md).
      </Typography>
      {onRetry && <Button variant="outlined" onClick={onRetry} sx={{ mt: 1.5 }}>Tentar novamente</Button>}
    </Box>
  );
}
