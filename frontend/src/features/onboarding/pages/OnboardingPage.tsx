import { useState } from "react";
import { Box, Button, Checkbox, Chip, LinearProgress, Skeleton, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RocketLaunchRoundedIcon from "@mui/icons-material/RocketLaunchRounded";
import { useOnboardings, useToggleChecklistItem } from "../queries";
import { AddOnboardingModal } from "../components/AddOnboardingModal";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import type { ChecklistPhase, OnboardingEntry } from "../types";

const PHASE_LABEL: Record<ChecklistPhase, string> = { before: "📋 Antes do 1º dia", day1: "🌅 1º dia", week1: "📆 1ª semana" };

export function OnboardingPage() {
  const { data, isLoading, isError, error, refetch } = useOnboardings();
  const entries = data?.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const toggleItem = useToggleChecklistItem();

  const selected = entries.find((e) => e.id === selectedId) ?? entries[0];

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Onboarding Center</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>{isLoading ? "…" : entries.length} onboardings ativos</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Novo onboarding</Button>
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" }, gap: 2.5 }}>
          <Skeleton variant="rounded" height={280} />
          <Skeleton variant="rounded" height={420} />
        </Box>
      ) : entries.length === 0 ? (
        <EmptyState icon={<RocketLaunchRoundedIcon />} title="Nenhum onboarding ativo" description="Crie o processo de entrada de um novo colaborador." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Novo onboarding</Button>} />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" }, gap: 2.5 }}>
          <Stack spacing={1.5}>
            {entries.map((entry) => (
              <Box
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                sx={{
                  borderRadius: 4, p: 2, cursor: "pointer", border: "1px solid",
                  borderColor: selected?.id === entry.id ? "primary.main" : "divider",
                  bgcolor: selected?.id === entry.id ? "#FAF8F5" : "background.paper",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography fontWeight={800} fontSize={14}>{entry.employeeName}</Typography>
                    <Typography variant="caption" color="text.secondary">{entry.role}</Typography>
                  </Box>
                  <Chip
                    label={entry.status}
                    size="small"
                    sx={{ fontWeight: 700, bgcolor: entry.status === "In Progress" ? "secondary.light" : entry.status === "Completed" ? "#DCEFE1" : "#F5EEE8", color: entry.status === "In Progress" ? "primary.dark" : entry.status === "Completed" ? "#2E7D4F" : "text.secondary" }}
                  />
                </Stack>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.25, mb: 0.4 }}>
                  <Typography variant="caption" color="text.secondary">Progresso</Typography>
                  <Typography variant="caption" fontWeight={700} color="primary.main">{entry.progress}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={entry.progress} sx={{ height: 6, borderRadius: 3, bgcolor: "#F0EBE5" }} />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>📅 Entrada: {entry.startDate}</Typography>
              </Box>
            ))}
          </Stack>

          {selected && <ChecklistDetail entry={selected} onToggle={(phase, index) => toggleItem.mutate({ id: selected.id, phase, index })} />}
        </Box>
      )}

      <AddOnboardingModal open={addOpen} onClose={() => setAddOpen(false)} />
    </Box>
  );
}

function ChecklistDetail({ entry, onToggle }: { entry: OnboardingEntry; onToggle: (phase: ChecklistPhase, index: number) => void }) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
        <Box>
          <Typography fontWeight={800} fontSize={16}>{entry.employeeName}</Typography>
          <Typography variant="body2" color="text.secondary">{entry.role} · Entrada {entry.startDate}</Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography sx={{ fontSize: 26, fontWeight: 800, color: "primary.main", lineHeight: 1 }}>{entry.progress}%</Typography>
          <Typography variant="caption" color="text.secondary">completo</Typography>
        </Box>
      </Stack>
      <Stack spacing={2}>
        {(["before", "day1", "week1"] as const).map((phase) => {
          const items = entry.checklist[phase];
          const done = items.filter((i) => i.done).length;
          return (
            <Box key={phase} sx={{ border: "1px solid", borderColor: "#F0EBE5", borderRadius: 3, p: 2 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight={700}>{PHASE_LABEL[phase]}</Typography>
                <Typography variant="caption" color="text.secondary">{done}/{items.length}</Typography>
              </Stack>
              <Stack spacing={0.5}>
                {items.map((item, i) => (
                  <Stack key={i} direction="row" alignItems="center" spacing={0.5} sx={{ cursor: "pointer" }} onClick={() => onToggle(phase, i)}>
                    <Checkbox checked={item.done} size="small" sx={{ p: 0.6 }} />
                    <Typography variant="body2" sx={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "text.secondary" : "text.primary" }}>
                      {item.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
