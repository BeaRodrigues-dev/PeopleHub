import { Alert, Box, Button, Chip, CircularProgress, Stack, TextField, Tooltip, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useVacancy, useTimeToFill, useDeleteVacancy, useUpdateVacancy } from "../queries";
import { StageCountsEditor } from "../components/StageCountsEditor";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/ToastProvider";
import type { CreateVacancyInput } from "../types";

function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function VacancyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: vacancy, isLoading, isError, error, refetch } = useVacancy(id);
  const { data: timeToFill } = useTimeToFill(vacancy?.status === "Abierta" ? id : null);
  const updateVacancy = useUpdateVacancy();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const deleteVacancy = useDeleteVacancy();

  const handleDelete = () => {
    if (!vacancy) return;
    deleteVacancy.mutate(vacancy.id, {
      onSuccess: () => { toast.success("Vacante eliminada."); navigate("/vagas"); },
      onError: (err) => toast.error(errorMessage(err, "No se pudo eliminar la vacante.")),
    });
  };

  const handleMetricBlur = (field: keyof CreateVacancyInput, value: unknown) => {
    if (!vacancy) return;
    updateVacancy.mutate(
      { id: vacancy.id, input: { [field]: value } },
      { onError: (err) => toast.error(errorMessage(err, "No se pudo guardar.")) },
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ height: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (isError) return <Box sx={{ p: 4 }}><ErrorState error={error} onRetry={() => refetch()} /></Box>;
  if (!vacancy) return <Box sx={{ p: 4 }}><Alert severity="error">Vacante no encontrada.</Alert></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1100, mx: "auto" }}>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/vagas")} sx={{ mb: 1.5 }}>Volver a vacantes</Button>

      <Stack direction={{ xs: "column", md: "row" }} alignItems={{ md: "center" }} spacing={2} sx={{ mb: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h4">{vacancy.title}</Typography>
            <Chip label={vacancy.status} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
          </Stack>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>
            {vacancy.department || "—"} · {vacancy.location || "—"} · {vacancy.workModel} · {vacancy.seniority || "—"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25}>
          <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => navigate(`/vagas/${vacancy.id}/editar`)}>
            Editar
          </Button>
          <Button variant="outlined" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => setConfirmDelete(true)}>
            Eliminar
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center" sx={{ mb: 2.5 }}>
        {vacancy.requiredSkills.map((skill) => (
          <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
        ))}
        <Tooltip title={`Abierta desde ${vacancy.openingDate}${vacancy.closedAt ? ` · cerrada el ${vacancy.closedAt}` : ""}`}>
          <Chip
            icon={<EventAvailableRoundedIcon sx={{ fontSize: 15 }} />}
            label={
              vacancy.closedAt
                ? `Cerrada en ${daysBetween(vacancy.openingDate, vacancy.closedAt)} días`
                : `${daysBetween(vacancy.openingDate, new Date().toISOString().slice(0, 10))} días abierta`
            }
            size="small"
            sx={{ fontWeight: 700, bgcolor: "#F1EEFD", color: "#6C5CE0", ml: 0.5 }}
          />
        </Tooltip>
        {timeToFill && (
          <Tooltip title={timeToFill.reasoning}>
            <Chip
              icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />}
              label={`IA: ~${timeToFill.estimatedDays}d para completar (confianza ${timeToFill.confidence.toLowerCase()})`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: "#F2F0FC", color: "primary.main", ml: 0.5 }}
            />
          </Tooltip>
        )}
      </Stack>

      <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 3, mb: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.75 }}>
          <GroupsRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
          <Typography fontWeight={800} fontSize={15}>Métricas de reclutamiento</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Esta app es tu panel de control, no tu ATS — carga a mano los números de tu proceso real; la IA y los KPIs del resto del app se calculan a partir de estos valores.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, mb: 2 }}>
          <TextField
            label="Candidatos recibidos"
            type="number"
            size="small"
            defaultValue={vacancy.candidatesReceived}
            onBlur={(e) => handleMetricBlur("candidatesReceived", Math.max(0, Number(e.target.value)))}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            label="Días a 1ª entrevista"
            type="number"
            size="small"
            placeholder="—"
            defaultValue={vacancy.daysToFirstInterview ?? ""}
            onBlur={(e) => handleMetricBlur("daysToFirstInterview", e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            label="Días a oferta"
            type="number"
            size="small"
            placeholder="—"
            defaultValue={vacancy.daysToFirstOffer ?? ""}
            onBlur={(e) => handleMetricBlur("daysToFirstOffer", e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
            slotProps={{ htmlInput: { min: 0 } }}
          />
          <TextField
            label="Retención de contratados (%)"
            type="number"
            size="small"
            placeholder="—"
            defaultValue={vacancy.retentionRate ?? ""}
            onBlur={(e) => handleMetricBlur("retentionRate", e.target.value === "" ? null : Math.min(100, Math.max(0, Number(e.target.value))))}
            slotProps={{ htmlInput: { min: 0, max: 100 } }}
          />
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "span 2" } }}>
            <TextField
              label="Fuente de los mejores candidatos"
              size="small"
              fullWidth
              placeholder="Ej.: LinkedIn, Referidos, Búsqueda directa…"
              defaultValue={vacancy.bestSource}
              onBlur={(e) => e.target.value !== vacancy.bestSource && handleMetricBlur("bestSource", e.target.value)}
            />
          </Box>
        </Box>

        <StageCountsEditor vacancyId={vacancy.id} stages={vacancy.stages} />
      </Box>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar vacante"
        description={`¿Estás seguro de que deseas eliminar la vacante "${vacancy.title}"? Esta acción no se puede deshacer.`}
        loading={deleteVacancy.isPending}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </Box>
  );
}
