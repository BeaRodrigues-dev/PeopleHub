import { Box, Button, Typography } from "@mui/material";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";

export function errorMessage(error: unknown, fallback = "Não foi possível completar a operação."): string {
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

/** Estado de erro padrão para telas que dependem de uma chamada ao Supabase (sem conexão, credenciais erradas, RLS, etc.). */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 1, py: 7, px: 3 }}>
      <ErrorOutlineRoundedIcon sx={{ fontSize: 34, color: "error.main" }} />
      <Typography fontWeight={800} fontSize={15}>Não foi possível carregar os dados</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
        {errorMessage(error)} Verifique se o Supabase está configurado corretamente (ver README.md).
      </Typography>
      {onRetry && <Button variant="outlined" onClick={onRetry} sx={{ mt: 1.5 }}>Tentar novamente</Button>}
    </Box>
  );
}
