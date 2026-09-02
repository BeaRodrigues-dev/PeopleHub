import { useState } from "react";
import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { useUpdateVacancyStageCounts } from "../queries";
import { isHireStage, isRejectStage, type PipelineStage } from "../types";

const BAR_COLORS = ["#6C5CE0", "#4C7DE0", "#9B8FEA", "#5646C4", "#D6A65D", "#2FA36B"];

/**
 * Resumen manual de postulaciones por etapa — reemplaza el conteo automático
 * de candidatos reales (esta app ya no es la fuente de verdad del ATS de
 * quien la usa): People carga a mano cuántas personas hay hoy en cada etapa.
 * Las etapas se resaltan por su NOMBRE (ej. "Contratado", "Rechazado"), no
 * por ser la última de la lista — una vaga puede terminar en "Rechazado".
 */
export function StageCountsEditor({ vacancyId, stages }: { vacancyId: string; stages: PipelineStage[] }) {
  const [draft, setDraft] = useState<Record<string, number>>({});
  const updateStages = useUpdateVacancyStageCounts();

  const ordered = [...stages].sort((a, b) => a.order - b.order);
  const maxCount = Math.max(1, ...ordered.map((s) => s.count ?? 0));
  const total = ordered.reduce((sum, s) => sum + (s.count ?? 0), 0);

  const valueFor = (stage: PipelineStage) => draft[stage.id] ?? stage.count ?? 0;

  const handleChange = (stage: PipelineStage, value: number) => {
    setDraft((d) => ({ ...d, [stage.id]: value }));
  };

  const handleCommit = (stage: PipelineStage) => {
    const value = draft[stage.id];
    if (value === undefined || value === stage.count) return;
    const nextStages = ordered.map((s) => (s.id === stage.id ? { ...s, count: value } : s));
    updateStages.mutate({ id: vacancyId, stages: nextStages });
  };

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" fontWeight={700}>Resumen de postulaciones por etapa</Typography>
        <Typography variant="body2" color="text.secondary">Total en proceso: <Typography component="span" fontWeight={800} color="primary.dark">{total}</Typography></Typography>
      </Stack>
      <Stack spacing={1}>
        {ordered.map((stage, i) => {
          const hired = isHireStage(stage);
          const rejected = !hired && isRejectStage(stage);
          return (
          <Box key={stage.id} sx={{ bgcolor: hired ? "#E1F3EA" : rejected ? "#F5E3E8" : "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 1.5 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: { xs: 130, sm: 190 }, flexShrink: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{stage.name}</Typography>
                {hired && <Chip label="Contratados" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: "#2FA36B", color: "#fff" }} />}
                {rejected && <Chip label="Rechazados" size="small" sx={{ height: 18, fontSize: 9.5, fontWeight: 700, bgcolor: "#C9748A", color: "#fff" }} />}
              </Stack>
              <Box sx={{ flex: 1, height: 10, bgcolor: "#EFEDFB", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ width: `${Math.min(100, (valueFor(stage) / maxCount) * 100)}%`, height: "100%", bgcolor: hired ? "#2FA36B" : rejected ? "#C9748A" : BAR_COLORS[i % BAR_COLORS.length] }} />
              </Box>
              <TextField
                type="number"
                size="small"
                value={valueFor(stage)}
                onChange={(e) => handleChange(stage, Math.max(0, Number(e.target.value)))}
                onBlur={() => handleCommit(stage)}
                slotProps={{ htmlInput: { min: 0 } }}
                sx={{ width: 72, flexShrink: 0 }}
              />
            </Stack>
          </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
