import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import { useToast } from "../../../components/common/ToastProvider";

const INITIAL = {
  deliveries: "— Completé X candidaturas en proceso de entrevista\n— Avancé el onboarding de nuevos colaboradores\n— Agregué talentos al Talent Pool\n— Di seguimiento a propuestas de consulting",
  observations: "— El time to hire de algunas vacantes está por encima del objetivo\n— Los onboardings recientes tienen ritmos de finalización diferentes\n— El pipeline de consulting tiene buenas oportunidades abiertas",
  proposals: "— Estandarizar el proceso de onboarding\n— Revisar la estrategia de sourcing para vacantes más difíciles\n— Agendar pulse survey con el equipo",
  nextSteps: "— Follow-up en los procesos de entrevista abiertos\n— Retomar contacto con leads de consulting detenidos\n— Publicar nuevas vacantes abiertas\n— Completar weekly report y compartir",
};

const SECTIONS: Array<{ key: keyof typeof INITIAL; icon: string; label: string; bg: string; border: string }> = [
  { key: "deliveries", icon: "✅", label: "Esta semana hice:", bg: "#EAF6EE", border: "#BFE3C9" },
  { key: "observations", icon: "👁️", label: "Observé:", bg: "#EAF1FB", border: "#C6D9F3" },
  { key: "proposals", icon: "💡", label: "Propongo:", bg: "#FFF9F0", border: "#CFE6D9" },
  { key: "nextSteps", icon: "🚀", label: "Próximos pasos:", bg: "#F1F7F2", border: "#DCE6DE" },
];

function currentWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(friday)}`;
}

export function WeeklyReportPage() {
  const [report, setReport] = useState(INITIAL);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const weekLabel = currentWeekLabel();

  const handleChange = (key: keyof typeof INITIAL, value: string) => setReport((r) => ({ ...r, [key]: value }));

  const buildText = () =>
    `📝 WEEKLY HR REPORT — Semana de ${weekLabel}\n\n` +
    `✅ ESTA SEMANA HICE:\n${report.deliveries}\n\n` +
    `👁️ OBSERVÉ:\n${report.observations}\n\n` +
    `💡 PROPONGO:\n${report.proposals}\n\n` +
    `🚀 PRÓXIMOS PASOS:\n${report.nextSteps}\n\n` +
    `— Beatriz Rodrigues · HR Manager`;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(buildText())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("No fue posible copiar el informe."));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 900, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Weekly HR Report</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Semana de {weekLabel}</Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Button variant="outlined" startIcon={copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />} onClick={handleCopy}>
            {copied ? "Copiado!" : "Copiar"}
          </Button>
          <Button variant="contained" startIcon={<IosShareRoundedIcon />} onClick={() => toast.info("Envía el texto copiado al canal de tu preferencia.")}>
            Compartir
          </Button>
        </Stack>
      </Stack>

      <Stack spacing={2}>
        {SECTIONS.map((section) => (
          <Box key={section.key} sx={{ borderRadius: 4, p: 2.25, bgcolor: section.bg, border: "1px solid", borderColor: section.border }}>
            <Typography fontWeight={700} fontSize={14} sx={{ mb: 1 }}>{section.icon} {section.label}</Typography>
            <TextField
              multiline
              minRows={4}
              fullWidth
              value={report[section.key]}
              onChange={(e) => handleChange(section.key, e.target.value)}
              sx={{ bgcolor: "rgba(255,255,255,.7)" }}
            />
          </Box>
        ))}
      </Stack>

      <Box sx={{ mt: 2.5, bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Vista previa</Typography>
        <Box component="pre" sx={{ mt: 1.25, fontFamily: "monospace", fontSize: 12.5, whiteSpace: "pre-wrap", bgcolor: "#F1F7F2", borderRadius: 3, p: 2, m: 0, lineHeight: 1.7 }}>
          {buildText()}
        </Box>
      </Box>
    </Box>
  );
}
