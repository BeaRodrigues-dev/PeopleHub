import { useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LightbulbRoundedIcon from "@mui/icons-material/LightbulbRounded";
import { useCreateInsight, useDeleteInsight, useGenerateInsightsWithAi, useInsights } from "../queries";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { useToast } from "../../../components/common/ToastProvider";
import { INSIGHT_TYPES, type InsightType } from "../types";

const TYPE_CONFIG: Record<InsightType, { label: string; icon: string; bg: string; border: string; badge: string; badgeFg: string }> = {
  problem: { label: "Problema", icon: "🔴", bg: "#F5E6E9", border: "#E6D4D9", badge: "#F0DEE2", badgeFg: "#C17E8B" },
  opportunity: { label: "Oportunidad", icon: "🟡", bg: "#EEF7F1", border: "#D9EEDE", badge: "#E7F3EC", badgeFg: "#7FB396" },
  suggestion: { label: "Sugerencia", icon: "🔵", bg: "#E3F2E8", border: "#DDEEE3", badge: "#E3F2E8", badgeFg: "#5F9678" },
};

export function InsightsPage() {
  const { data, isLoading, isError, error, refetch } = useInsights();
  const insights = data?.items ?? [];
  const [filter, setFilter] = useState<"all" | InsightType>("all");
  const [showForm, setShowForm] = useState(false);
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState<InsightType>("suggestion");
  const createInsight = useCreateInsight();
  const deleteInsight = useDeleteInsight();
  const generateInsights = useGenerateInsightsWithAi();
  const toast = useToast();

  const filtered = insights.filter((i) => filter === "all" || i.type === filter);

  const handleAdd = () => {
    if (!newText.trim()) return;
    createInsight.mutate(
      { type: newType, text: newText.trim() },
      {
        onSuccess: () => { setNewText(""); setShowForm(false); },
        onError: (err) => toast.error(errorMessage(err, "No fue posible guardar el insight.")),
      },
    );
  };

  const handleGenerate = () => {
    generateInsights.mutate(undefined, {
      onSuccess: (created) => toast.success(created.length ? `${created.length} nuevo(s) insight(s) generado(s).` : "Ningún insight nuevo identificado por el momento."),
      onError: (err) => toast.error(errorMessage(err, "No fue posible generar insights.")),
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1100, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 2.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">HR Insights</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Observaciones, oportunidades y sugerencias — manuales o generadas por IA a partir de los datos del sistema.</Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Button variant="outlined" startIcon={<AutoAwesomeRoundedIcon />} onClick={handleGenerate} disabled={generateInsights.isPending}>
            {generateInsights.isPending ? "Generando…" : "Generar con IA"}
          </Button>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setShowForm((v) => !v)}>Nuevo insight</Button>
        </Stack>
      </Stack>

      {showForm && (
        <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5, mb: 2.5 }}>
          <Typography fontWeight={800} sx={{ mb: 1.5 }}>Nuevo insight</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            {INSIGHT_TYPES.map((t) => (
              <Chip
                key={t}
                label={`${TYPE_CONFIG[t].icon} ${TYPE_CONFIG[t].label}`}
                onClick={() => setNewType(t)}
                sx={{
                  fontWeight: 700,
                  bgcolor: newType === t ? TYPE_CONFIG[t].badge : "#ECF5EF",
                  color: newType === t ? TYPE_CONFIG[t].badgeFg : "text.secondary",
                }}
              />
            ))}
          </Stack>
          <TextField multiline minRows={3} fullWidth placeholder="Describe el insight…" value={newText} onChange={(e) => setNewText(e.target.value)} sx={{ bgcolor: "#fff" }} />
          <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
            <Button variant="contained" onClick={handleAdd} disabled={createInsight.isPending}>Guardar</Button>
            <Button variant="text" onClick={() => setShowForm(false)}>Cancelar</Button>
          </Stack>
        </Box>
      )}

      <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
        <Chip label="Todos" onClick={() => setFilter("all")} sx={{ fontWeight: 700, bgcolor: filter === "all" ? "primary.main" : "#ECF5EF", color: filter === "all" ? "#fff" : "text.secondary" }} />
        {INSIGHT_TYPES.map((t) => (
          <Chip key={t} label={`${TYPE_CONFIG[t].icon} ${TYPE_CONFIG[t].label}`} onClick={() => setFilter(t)} sx={{ fontWeight: 700, bgcolor: filter === t ? "primary.main" : "#ECF5EF", color: filter === t ? "#fff" : "text.secondary" }} />
        ))}
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={120} />)}</Box>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<LightbulbRoundedIcon />} title="Ningún insight registrado" description='Agrega uno manualmente o haz clic en "Generar con IA".' />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {filtered.map((insight) => {
            const conf = TYPE_CONFIG[insight.type];
            return (
              <Box key={insight.id} sx={{ borderRadius: 4, p: 2.25, bgcolor: conf.bg, border: "1px solid", borderColor: conf.border }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Chip label={`${conf.icon} ${conf.label}`} size="small" sx={{ fontWeight: 800, bgcolor: conf.badge, color: conf.badgeFg }} />
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {insight.source === "ai" && <Chip label="IA" size="small" sx={{ bgcolor: "primary.main", color: "#fff", fontWeight: 700, height: 20 }} />}
                    <IconButton size="small" onClick={() => deleteInsight.mutate(insight.id)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1.25 }}>{insight.text}</Typography>
                <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5 }}>
                  {insight.area && <Chip label={insight.area} size="small" variant="outlined" />}
                  <Typography variant="caption" color="text.secondary">{insight.date}</Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
