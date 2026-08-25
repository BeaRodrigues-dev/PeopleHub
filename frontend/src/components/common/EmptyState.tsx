import type { ReactNode } from "react";
import { Box, Typography, alpha } from "@mui/material";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 1,
        py: 6,
        px: 3,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "16px",
          display: "grid",
          placeItems: "center",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
          color: "primary.main",
          mb: 0.5,
        }}
      >
        {icon}
      </Box>
      <Typography fontWeight={800} fontSize={15}>{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340 }}>
          {description}
        </Typography>
      )}
      {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
    </Box>
  );
}
