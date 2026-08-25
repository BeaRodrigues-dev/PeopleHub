import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Box, IconButton, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { zIndex } from "../../theme/zIndex";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  children: ReactNode;
  footer?: ReactNode;
}

/** Modal centralizado via Portal, mesma abordagem do SidePanel (ver notas lá). */
export function Modal({ open, onClose, title, subtitle, width = 640, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <Box sx={{ position: "fixed", inset: 0, zIndex: zIndex.modalBackdrop, display: "grid", placeItems: { xs: "end", sm: "center" }, p: { xs: 0, sm: 3 } }}>
      <Box
        onClick={onClose}
        sx={{ position: "absolute", inset: 0, bgcolor: "rgba(15,18,32,.48)", backdropFilter: "blur(2px)" }}
      />
      <Box
        role="dialog"
        aria-modal="true"
        sx={{
          position: "relative",
          zIndex: zIndex.modal,
          width: { xs: "100%", sm: width },
          maxWidth: "100%",
          maxHeight: { xs: "92dvh", sm: "88dvh" },
          bgcolor: "background.paper",
          borderRadius: { xs: "20px 20px 0 0", sm: 4 },
          boxShadow: "0 32px 80px rgba(15,18,32,.28)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "modalIn .2s cubic-bezier(.2,.8,.25,1)",
          "@keyframes modalIn": { from: { transform: "translateY(12px)", opacity: 0 }, to: { transform: "translateY(0)", opacity: 1 } },
        }}
      >
        <Box sx={{ px: 3.5, py: 2.5, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "flex-start", gap: 1.5, flexShrink: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800}>{title}</Typography>
            {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{subtitle}</Typography>}
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Fechar">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", px: 3.5, py: 3 }}>{children}</Box>
        {footer && (
          <Box sx={{ flexShrink: 0, borderTop: "1px solid", borderColor: "divider", px: 3.5, py: 2, display: "flex", justifyContent: "flex-end", gap: 1.25 }}>
            {footer}
          </Box>
        )}
      </Box>
    </Box>,
    document.body,
  );
}
