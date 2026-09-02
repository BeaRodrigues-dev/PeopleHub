import { useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PollRoundedIcon from "@mui/icons-material/PollRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import SentimentSatisfiedAltRoundedIcon from "@mui/icons-material/SentimentSatisfiedAltRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import {
  useClimateActionItems,
  useClimateResults,
  useClimateRounds,
  useClimateThemeNotes,
  useCreateClimateActionItem,
  useCreateClimateThemeNote,
  useDeleteClimateRound,
  useUpdateClimateRound,
} from "../queries";
import { useEmployees } from "../../people/queries";
import { analyzeClimateRound } from "../../../lib/ai";
import { AddRoundModal } from "../components/AddRoundModal";
import { ClimateResultsEditor } from "../components/ClimateResultsEditor";
import { ThemeNotesSection } from "../components/ThemeNotesSection";
import { ActionPlanSection } from "../components/ActionPlanSection";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/ToastProvider";
import type { ClimateSurveyRound, RoundStatus } from "../types";
import { CLIMATE_SCORE_MAX } from "../types";

const STATUS_COLOR: Record<RoundStatus, { bg: string; fg: string }> = {
  Borrador: { bg: "#EFEDFB", fg: "#6B7086" },
  Activa: { bg: "#F1EEFD", fg: "#6C5CE0" },
  Cerrada: { bg: "#E1F3EA", fg: "#2F8F63" },
};

type SubView = "categorias" | "temas" | "plan";

export function ClimateSurveyPage() {
  const { data: rounds, isLoading, isError, error, refetch } = useClimateRounds();
  const { data: results } = useClimateResults();
  const { data: themeNotes } = useClimateThemeNotes();
  const { data: actionItems } = useClimateActionItems();
  const { data: employeeData } = useEmployees({ limit: 200 });
  const deleteRound = useDeleteClimateRound();
  const updateRound = useUpdateClimateRound();
  const createThemeNote = useCreateClimateThemeNote();
  const createActionItem = useCreateClimateActionItem();
  const toast = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ClimateSurveyRound | null>(null);
  const [toDelete, setToDelete] = useState<ClimateSurveyRound | null>(null);
  const [subView, setSubView] = useState<SubView>("categorias");
  const [actionPrefill, setActionPrefill] = useState<{ name: string; description: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const allRounds = rounds ?? [];
  const allResults = results ?? [];
  const allThemeNotes = themeNotes ?? [];
  const allActionItems = actionItems ?? [];
  const activeEmployeesCount = (employeeData?.items ?? []).filter((e) => e.status === "Activo").length;
  const selected = allRounds.find((r) => r.id === selectedId) ?? allRounds[allRounds.length - 1];

  const roundAverage = (roundId: string) => {
    const items = allResults.filter((r) => r.roundId === roundId);
    return items.length ? items.reduce((sum, r) => sum + r.score, 0) / items.length : null;
  };

  const participationOf = (round: ClimateSurveyRound) => {
    const target = round.targetHeadcount ?? (round.audience === "Toda la empresa" ? activeEmployeesCount : null);
    const rate = target ? Math.round((round.respondents / target) * 100) : null;
    return { target, rate };
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteRound.mutate(toDelete.id, {
      onSuccess: () => { toast.success("Ronda eliminada."); setSelectedId(null); setToDelete(null); },
      onError: (err) => toast.error(errorMessage(err, "No fue posible eliminar.")),
    });
  };

  const handleGenerateAnalysis = async () => {
    if (!selected) return;
    const roundResults = allResults.filter((r) => r.roundId === selected.id);
    const analysis = analyzeClimateRound(selected, roundResults);
    setAiLoading(true);
    try {
      await updateRound.mutateAsync({ id: selected.id, input: { aiSummary: analysis.summary } });
      const existingThemes = allThemeNotes.filter((n) => n.roundId === selected.id);
      for (const s of analysis.strengths) {
        if (existingThemes.some((n) => n.kind === "fortaleza" && n.theme === s.theme)) continue;
        await createThemeNote.mutateAsync({ roundId: selected.id, kind: "fortaleza", theme: s.theme, result: s.score, insight: s.insight, origin: "ia" });
      }
      for (const o of analysis.opportunities) {
        if (existingThemes.some((n) => n.kind === "oportunidad" && n.theme === o.theme)) continue;
        await createThemeNote.mutateAsync({ roundId: selected.id, kind: "oportunidad", theme: o.theme, result: o.score, insight: o.insight, suggestion: o.suggestion ?? "", origin: "ia" });
      }
      const existingActions = allActionItems.filter((a) => a.roundId === selected.id);
      for (const a of analysis.actions) {
        if (existingActions.some((x) => x.name === a.name)) continue;
        await createActionItem.mutateAsync({ roundId: selected.id, name: a.name, description: a.description, priority: a.priority, status: "Pendiente", origin: "ia" });
      }
      toast.success("Análisis generado con IA — revisa las sugerencias en Fortalezas, Oportunidades y Plan de acción.");
      setSubView("temas");
    } catch (err) {
      toast.error(errorMessage(err, "No fue posible generar el análisis."));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Encuestas de Clima</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Centro de People Analytics — resultados, tendencias y plan de acción por ronda.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Nueva ronda</Button>
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" }, gap: 2.5 }}>
          <Skeleton variant="rounded" height={280} />
          <Skeleton variant="rounded" height={420} />
        </Box>
      ) : allRounds.length === 0 ? (
        <EmptyState icon={<PollRoundedIcon />} title="Ninguna ronda registrada" description="Crea la primera ronda para empezar a medir el clima organizacional." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Nueva ronda</Button>} />
      ) : (
        <>
          {allRounds.length > 1 && (
            <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5, mb: 2.5 }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Evolución entre rondas</Typography>
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {allRounds.map((r) => {
                  const avg = roundAverage(r.id);
                  return (
                    <Stack key={r.id} direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 170, flexShrink: 0 }} noWrap>{r.name}</Typography>
                      <Box sx={{ flex: 1, height: 18, bgcolor: "#EFEDFB", borderRadius: 2, overflow: "hidden" }}>
                        {avg !== null && <Box sx={{ width: `${Math.min(100, (avg / CLIMATE_SCORE_MAX) * 100)}%`, height: "100%", bgcolor: "primary.main" }} />}
                      </Box>
                      <Typography variant="caption" fontWeight={700} sx={{ width: 44, textAlign: "right", flexShrink: 0 }}>{avg !== null ? avg.toFixed(1) : "—"}</Typography>
                      {r.enps !== null && (
                        <Typography variant="caption" color="text.secondary" sx={{ width: 90, textAlign: "right", flexShrink: 0 }}>eNPS {r.enps > 0 ? "+" : ""}{r.enps}</Typography>
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          )}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" }, gap: 2.5 }}>
            <Stack spacing={1.5}>
              {allRounds.map((round) => {
                const avg = roundAverage(round.id);
                const { rate } = participationOf(round);
                return (
                  <Box
                    key={round.id}
                    onClick={() => setSelectedId(round.id)}
                    sx={{
                      borderRadius: 4, p: 2, cursor: "pointer", border: "1px solid",
                      borderColor: selected?.id === round.id ? "primary.main" : "divider",
                      bgcolor: selected?.id === round.id ? "#F3F1FC" : "background.paper",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} fontSize={14} noWrap>{round.name}</Typography>
                        <Chip label={round.status} size="small" sx={{ mt: 0.5, height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: STATUS_COLOR[round.status].bg, color: STATUS_COLOR[round.status].fg }} />
                      </Box>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setToDelete(round); }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                      📅 {round.startDate && round.endDate ? `${round.startDate} → ${round.endDate}` : round.roundDate}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {round.respondents} respondiente{round.respondents === 1 ? "" : "s"}{rate !== null ? ` · ${rate}% participación` : ""}
                    </Typography>
                    <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 1 }}>
                      <Typography sx={{ fontSize: 20, fontWeight: 800, color: "primary.dark" }}>
                        ⭐ {avg !== null ? avg.toFixed(1) : "—"} <Typography component="span" fontSize={11} fontWeight={700} color="text.secondary">/ {CLIMATE_SCORE_MAX}</Typography>
                      </Typography>
                      {round.enps !== null && (
                        <Typography variant="caption" fontWeight={700} color="text.secondary">💙 eNPS {round.enps > 0 ? "+" : ""}{round.enps}</Typography>
                      )}
                    </Stack>
                    <Button size="small" variant="text" sx={{ mt: 0.5, px: 0, minWidth: 0 }} onClick={(e) => { e.stopPropagation(); setSelectedId(round.id); }}>Ver resultados →</Button>
                  </Box>
                );
              })}
            </Stack>

            {selected && (
              <Stack spacing={2.5}>
                <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography fontWeight={800} fontSize={16}>{selected.name}</Typography>
                        <Chip label={selected.status} size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: STATUS_COLOR[selected.status].bg, color: STATUS_COLOR[selected.status].fg }} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                        📅 {selected.startDate && selected.endDate ? `${selected.startDate} → ${selected.endDate}` : selected.roundDate}
                        {" · "}{selected.audience === "Equipo específico" && selected.audienceTeam ? `Equipo: ${selected.audienceTeam}` : selected.audience}
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={() => setEditing(selected)}><EditRoundedIcon fontSize="small" /></IconButton>
                  </Stack>

                  <RoundSummaryCards round={selected} average={roundAverage(selected.id)} participation={participationOf(selected)} />

                  <Box sx={{ mt: 2.5, borderRadius: 3, p: 2, bgcolor: "#F7F6FE", border: "1px solid", borderColor: "divider" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <AutoAwesomeRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography fontWeight={800} fontSize={13.5}>Análisis del asistente de IA</Typography>
                      </Stack>
                      <Button size="small" variant="outlined" startIcon={<AutoAwesomeRoundedIcon fontSize="small" />} onClick={handleGenerateAnalysis} disabled={aiLoading}>
                        {aiLoading ? "Generando…" : selected.aiSummary ? "Regenerar análisis" : "Generar análisis con IA"}
                      </Button>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 1.25 }}>
                      {selected.aiSummary || "Todavía no generaste un análisis para esta ronda. La IA revisa los puntajes por categoría y sugiere fortalezas, oportunidades y acciones — vos decidís qué queda."}
                    </Typography>
                  </Box>
                </Box>

                <ToggleButtonGroup exclusive size="small" value={subView} onChange={(_, v) => v && setSubView(v)} sx={{ alignSelf: "flex-start" }}>
                  <ToggleButton value="categorias" sx={{ px: 2, textTransform: "none", fontWeight: 700 }}>Categorías</ToggleButton>
                  <ToggleButton value="temas" sx={{ px: 2, textTransform: "none", fontWeight: 700 }}>Fortalezas y Oportunidades</ToggleButton>
                  <ToggleButton value="plan" sx={{ px: 2, textTransform: "none", fontWeight: 700 }}>Plan de acción</ToggleButton>
                </ToggleButtonGroup>

                {subView === "categorias" && (
                  <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 3 }}>
                    <ClimateResultsEditor roundId={selected.id} categories={selected.categories} results={allResults.filter((r) => r.roundId === selected.id)} />
                  </Box>
                )}
                {subView === "temas" && (
                  <ThemeNotesSection
                    roundId={selected.id}
                    notes={allThemeNotes.filter((n) => n.roundId === selected.id)}
                    onCreateAction={(prefill) => { setActionPrefill(prefill); setSubView("plan"); }}
                  />
                )}
                {subView === "plan" && (
                  <ActionPlanSection
                    roundId={selected.id}
                    items={allActionItems.filter((a) => a.roundId === selected.id)}
                    prefill={actionPrefill}
                    onPrefillConsumed={() => setActionPrefill(null)}
                  />
                )}
              </Stack>
            )}
          </Box>
        </>
      )}

      <AddRoundModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddRoundModal open={!!editing} onClose={() => setEditing(null)} round={editing} />
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar ronda"
        description={`¿Estás seguro de que deseas eliminar la ronda "${toDelete?.name}"? Se eliminarán también todos sus resultados, notas y acciones. Esta acción no se puede deshacer.`}
        loading={deleteRound.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}

function RoundSummaryCards({
  round,
  average,
  participation,
}: {
  round: ClimateSurveyRound;
  average: number | null;
  participation: { target: number | null; rate: number | null };
}) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
      <SummaryCard
        icon={<GroupsRoundedIcon fontSize="small" />}
        label="Participación"
        value={participation.target ? `${round.respondents} / ${participation.target}` : `${round.respondents}`}
        sub={participation.rate !== null ? `${participation.rate}% de participación` : "Definí un headcount objetivo para calcular %"}
      />
      <SummaryCard
        icon={<SentimentSatisfiedAltRoundedIcon fontSize="small" />}
        label="Satisfacción general"
        value={average !== null ? `${average.toFixed(1)} / ${CLIMATE_SCORE_MAX}` : "—"}
        sub="Promedio de todas las categorías"
      />
      <SummaryCard
        icon={<FavoriteRoundedIcon fontSize="small" />}
        label="eNPS"
        value={round.enps !== null ? `${round.enps > 0 ? "+" : ""}${round.enps}` : "—"}
        sub="Métrica separada de la satisfacción"
      />
    </Box>
  );
}

function SummaryCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Box sx={{ borderRadius: 3, p: 1.75, bgcolor: "#FAFAFD", border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
        <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: 22, fontWeight: 800, color: "text.primary" }}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{sub}</Typography>
    </Box>
  );
}
