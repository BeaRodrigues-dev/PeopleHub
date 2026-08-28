import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Box, IconButton, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { zIndex } from "../../theme/zIndex";
import { lockBodyScroll } from "../../lib/scrollLock";

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
  headerExtra?: ReactNode;
}

/**
 * Painel lateral renderizado via createPortal diretamente em document.body.
 * Esto garantiza que nunca quede atrapado detrás de elementos con posición
 * fixa (como o header) nem seja cortado por `overflow:hidden` de containers
 * pais — o único jeito confiável de resolver esse tipo de bug em layouts
 * com header fixo. z-index vem da escala central em theme/zIndex.ts.
 */
export function SidePanel({ open, onClose, title, subtitle, width = 480, children, footer, headerExtra }: SidePanelProps) {
  useEffect(() => {
    if (!open) return;
    const unlock = lockBodyScroll();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <Box sx={{ position: "fixed", inset: 0, zIndex: zIndex.sidePanelBackdrop }}>
      <Box
        onClick={onClose}
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(15,18,32,.44)",
          backdropFilter: "blur(2px)",
          animation: "fadeIn .18s ease",
          "@keyframes fadeIn": { from: { opacity: 0 }, to: { opacity: 1 } },
        }}
      />
      <Box
        role="dialog"
        aria-modal="true"
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100dvh",
          width: { xs: "100%", sm: width },
          maxWidth: "100%",
          bgcolor: "background.paper",
          boxShadow: "-24px 0 64px rgba(15,18,32,.18)",
          display: "flex",
          flexDirection: "column",
          zIndex: zIndex.sidePanel,
          animation: "slideIn .22s cubic-bezier(.2,.8,.25,1)",
          "@keyframes slideIn": { from: { transform: "translateX(24px)", opacity: 0 }, to: { transform: "translateX(0)", opacity: 1 } },
        }}
      >
        {(title || headerExtra) && (
          <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {title && <Typography variant="h6" fontWeight={800} noWrap>{title}</Typography>}
              {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
            </Box>
            {headerExtra}
            <IconButton onClick={onClose} size="small" aria-label="Cerrar panel">
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
        <Box sx={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", px: 3, py: 2.5 }}>{children}</Box>
        {footer && (
          <Box sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: "divider", px: 3, py: 2, bgcolor: "background.paper" }}>
            {footer}
          </Box>
        )}
      </Box>
    </Box>,
    document.body,
  );
}
