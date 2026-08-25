import { useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, InputAdornment, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useNavigate, useParams } from "react-router-dom";
import { useVacancy, useTimeToFill } from "../queries";
import { KanbanBoard } from "../../kanban/components/KanbanBoard";
import { TalentBankMatchModal } from "../../talent-bank/components/TalentBankMatchModal";
import { useUIStore } from "../../../store/uiStore";
import { ErrorState } from "../../../components/common/ErrorState";

export function VacancyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: vacancy, isLoading, isError, error, refetch } = useVacancy(id);
  const { data: timeToFill } = useTimeToFill(vacancy?.status === "Aberta" ? id : null);
  const openCandidate = useUIStore((s) => s.openCandidate);
  const openMatchModal = useUIStore((s) => s.openMatchModal);
  const openAddCandidate = useUIStore((s) => s.openAddCandidate);
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <Box sx={{ height: "60vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }
  if (isError) return <Box sx={{ p: 4 }}><ErrorState error={error} onRetry={() => refetch()} /></Box>;
  if (!vacancy) return <Box sx={{ p: 4 }}><Alert severity="error">Vaga não encontrada.</Alert></Box>;

  const stages = [...vacancy.stages].sort((a, b) => a.order - b.order);

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1800, mx: "auto" }}>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => navigate("/vagas")} sx={{ mb: 1.5 }}>Voltar para vagas</Button>

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
          <Button variant="outlined" startIcon={<PersonAddAltRoundedIcon />} onClick={() => openAddCandidate(vacancy.id)}>
            Adicionar candidato
          </Button>
          <Button variant="contained" startIcon={<PersonAddAltRoundedIcon />} onClick={() => openMatchModal(vacancy.id)}>
            Banco de Talentos
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.75} alignItems="center" sx={{ mb: 2.5 }}>
        {vacancy.requiredSkills.map((skill) => (
          <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
        ))}
        {timeToFill && (
          <Tooltip title={timeToFill.reasoning}>
            <Chip
              icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 15 }} />}
              label={`IA: ~${timeToFill.estimatedDays}d para preencher (confiança ${timeToFill.confidence.toLowerCase()})`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: "#F5EEE8", color: "primary.main", ml: 0.5 }}
            />
          </Tooltip>
        )}
      </Stack>

      <TextField
        placeholder="Buscar candidato por nome ou competência…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ width: { xs: "100%", sm: 380 }, bgcolor: "background.paper", mb: 2.5 }}
        slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
      />

      {stages.length === 0 ? (
        <Skeleton variant="rounded" height={400} />
      ) : (
        <KanbanBoard vacancyId={vacancy.id} stages={stages} search={search} onOpen={openCandidate} />
      )}

      <TalentBankMatchModal />
    </Box>
  );
}
