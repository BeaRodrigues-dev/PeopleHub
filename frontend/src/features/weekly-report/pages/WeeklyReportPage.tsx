import { useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import { useToast } from "../../../components/common/ToastProvider";

const INITIAL = {
  deliveries: "— Concluí X candidaturas em processo de entrevista\n— Avancei o onboarding de novos colaboradores\n— Adicionei talentos ao Talent Pool\n— Dei seguimento a propostas de consulting",
  observations: "— O time to hire de algumas vagas está acima do objetivo\n— Onboardings recentes têm ritmos de conclusão diferentes\n— Pipeline de consulting com boas oportunidades em aberto",
  proposals: "— Padronizar o processo de onboarding\n— Revisar a estratégia de sourcing para vagas mais difíceis\n— Agendar pulse survey com a equipa",
  nextSteps: "— Follow-up nos processos de entrevista em aberto\n— Retomar contacto com leads de consulting parados\n— Publicar novas vagas em aberto\n— Completar weekly report e partilhar",
};

const SECTIONS: Array<{ key: keyof typeof INITIAL; icon: string; label: string; bg: string; border: string }> = [
  { key: "deliveries", icon: "✅", label: "Esta semana fiz:", bg: "#EAF6EE", border: "#BFE3C9" },
  { key: "observations", icon: "👁️", label: "Observei:", bg: "#EAF1FB", border: "#C6D9F3" },
  { key: "proposals", icon: "💡", label: "Proponho:", bg: "#FFF9F0", border: "#B7D8C2" },
  { key: "nextSteps", icon: "🚀", label: "Próximos passos:", bg: "#F1F7F2", border: "#DCE6DE" },
];

function currentWeekLabel(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
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
    `✅ ESTA SEMANA FIZ:\n${report.deliveries}\n\n` +
    `👁️ OBSERVEI:\n${report.observations}\n\n` +
    `💡 PROPONHO:\n${report.proposals}\n\n` +
    `🚀 PRÓXIMOS PASSOS:\n${report.nextSteps}\n\n` +
    `— Beatriz Rodrigues · HR Manager`;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(buildText())
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Não foi possível copiar o relatório."));
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
          <Button variant="contained" startIcon={<IosShareRoundedIcon />} onClick={() => toast.info("Envie o texto copiado para o canal da sua preferência.")}>
            Partilhar
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
        <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>Pré-visualização</Typography>
        <Box component="pre" sx={{ mt: 1.25, fontFamily: "monospace", fontSize: 12.5, whiteSpace: "pre-wrap", bgcolor: "#F1F7F2", borderRadius: 3, p: 2, m: 0, lineHeight: 1.7 }}>
          {buildText()}
        </Box>
      </Box>
    </Box>
  );
}
