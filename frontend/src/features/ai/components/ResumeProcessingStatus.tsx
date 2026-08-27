import { Box, CircularProgress, Stack, Typography } from "@mui/material";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";

export type ResumeProcessingStep = "uploading" | "extracting" | "done";

const STEPS: Array<{ key: ResumeProcessingStep; label: string; icon: React.ReactNode }> = [
  { key: "uploading", label: "Enviando archivo", icon: <CloudUploadRoundedIcon fontSize="small" /> },
  { key: "extracting", label: "Extrayendo datos con IA", icon: <AutoAwesomeRoundedIcon fontSize="small" /> },
];

/** Feedback visual del progreso de carga + extracción vía IA (item 3/7 del alcance). */
export function ResumeProcessingStatus({ step, fileName }: { step: ResumeProcessingStep; fileName: string }) {
  const activeIndex = STEPS.findIndex((s) => s.key === step);
  return (
    <Box sx={{ py: 5, textAlign: "center" }}>
      <Typography fontWeight={750} sx={{ mb: 3 }}>Procesando "{fileName}"…</Typography>
      <Stack spacing={2} sx={{ maxWidth: 320, mx: "auto" }}>
        {STEPS.map((s, i) => {
          const done = i < activeIndex || step === "done";
          const active = i === activeIndex && step !== "done";
          return (
            <Stack key={s.key} direction="row" spacing={1.5} alignItems="center" sx={{ opacity: i > activeIndex && step !== "done" ? 0.4 : 1 }}>
              <Box sx={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: done ? "#e7f7ee" : active ? "action.hover" : "transparent", color: done ? "#1c8a54" : "text.secondary" }}>
                {done ? <CheckCircleRoundedIcon fontSize="small" /> : active ? <CircularProgress size={16} /> : s.icon}
              </Box>
              <Typography variant="body2" fontWeight={active ? 700 : 500}>{s.label}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
