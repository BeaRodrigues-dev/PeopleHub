import { useState } from "react";
import { Box, Button, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import PollRoundedIcon from "@mui/icons-material/PollRounded";
import { useClimateResults, useClimateRounds, useDeleteClimateRound } from "../queries";
import { AddRoundModal } from "../components/AddRoundModal";
import { ClimateResultsEditor } from "../components/ClimateResultsEditor";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/ToastProvider";
import type { ClimateSurveyRound } from "../types";
import { CLIMATE_SCORE_MAX } from "../types";

export function ClimateSurveyPage() {
  const { data: rounds, isLoading, isError, error, refetch } = useClimateRounds();
  const { data: results } = useClimateResults();
  const deleteRound = useDeleteClimateRound();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ClimateSurveyRound | null>(null);
  const [toDelete, setToDelete] = useState<ClimateSurveyRound | null>(null);

  const allRounds = rounds ?? [];
  const allResults = results ?? [];
  const selected = allRounds.find((r) => r.id === selectedId) ?? allRounds[allRounds.length - 1];

  const roundAverage = (roundId: string) => {
    const items = allResults.filter((r) => r.roundId === roundId);
    return items.length ? items.reduce((sum, r) => sum + r.score, 0) / items.length : null;
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteRound.mutate(toDelete.id, {
      onSuccess: () => { toast.success("Ronda eliminada."); setSelectedId(null); setToDelete(null); },
      onError: (err) => toast.error(errorMessage(err, "No fue posible eliminar.")),
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Encuestas de Clima</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Resultados de encuestas de clima organizacional, separados por ronda — 100% editable.</Typography>
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
        <EmptyState icon={<PollRoundedIcon />} title="Ninguna ronda registrada" description="Crea la primera ronda para empezar a cargar resultados de la encuesta de clima." action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Nueva ronda</Button>} />
      ) : (
        <>
          {allRounds.length > 1 && (
            <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5, mb: 2.5 }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Evolución del promedio entre rondas</Typography>
              <Stack spacing={1} sx={{ mt: 1.5 }}>
                {allRounds.map((r) => {
                  const avg = roundAverage(r.id);
                  return (
                    <Stack key={r.id} direction="row" alignItems="center" spacing={1.5}>
                      <Typography variant="body2" color="text.secondary" sx={{ width: 170, flexShrink: 0 }} noWrap>{r.name}</Typography>
                      <Box sx={{ flex: 1, height: 18, bgcolor: "#EFEDFB", borderRadius: 2, overflow: "hidden" }}>
                        {avg !== null && <Box sx={{ width: `${Math.min(100, (avg / CLIMATE_SCORE_MAX) * 100)}%`, height: "100%", bgcolor: "primary.main" }} />}
                      </Box>
                      <Typography variant="caption" fontWeight={700} sx={{ width: 60, textAlign: "right", flexShrink: 0 }}>{avg !== null ? avg.toFixed(1) : "—"}</Typography>
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
                      <Box>
                        <Typography fontWeight={800} fontSize={14}>{round.name}</Typography>
                        <Typography variant="caption" color="text.secondary">📅 {round.roundDate}{round.respondents ? ` · ${round.respondents} respondientes` : ""}</Typography>
                      </Box>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); setToDelete(round); }}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, mt: 1, color: "primary.dark" }}>
                      {avg !== null ? avg.toFixed(1) : "—"} <Typography component="span" fontSize={12} fontWeight={700} color="text.secondary">/ {CLIMATE_SCORE_MAX}</Typography>
                    </Typography>
                    {round.notes && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>{round.notes}</Typography>}
                  </Box>
                );
              })}
            </Stack>

            {selected && (
              <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
                  <Box>
                    <Typography fontWeight={800} fontSize={16}>{selected.name}</Typography>
                    <Typography variant="body2" color="text.secondary">📅 {selected.roundDate}{selected.respondents ? ` · ${selected.respondents} respondientes` : ""}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setEditing(selected)}><EditRoundedIcon fontSize="small" /></IconButton>
                </Stack>
                <ClimateResultsEditor roundId={selected.id} results={allResults.filter((r) => r.roundId === selected.id)} />
              </Box>
            )}
          </Box>
        </>
      )}

      <AddRoundModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddRoundModal open={!!editing} onClose={() => setEditing(null)} round={editing} />
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar ronda"
        description={`¿Estás seguro de que deseas eliminar la ronda "${toDelete?.name}"? Se eliminarán también todos sus resultados. Esta acción no se puede deshacer.`}
        loading={deleteRound.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
