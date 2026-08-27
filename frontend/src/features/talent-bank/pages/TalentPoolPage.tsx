import { useEffect, useState } from "react";
import { Box, Button, Chip, Skeleton, Stack, TextField, Typography, InputAdornment } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useTalentPool } from "../queries";
import { useVacancies } from "../../vacancy/queries";
import { useCreateApplication } from "../../kanban/queries";
import { TalentPoolCard } from "../components/TalentPoolCard";
import { FiltersDrawer } from "../../../components/filters/FiltersDrawer";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { useToast } from "../../../components/common/ToastProvider";
import { useUIStore } from "../../../store/uiStore";
import type { Vacancy } from "../../vacancy/types";

export function TalentPoolPage() {
  const filters = useUIStore((s) => s.filters);
  const openCandidate = useUIStore((s) => s.openCandidate);
  const openAddCandidate = useUIStore((s) => s.openAddCandidate);
  const toast = useToast();

  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(typed), 300);
    return () => clearTimeout(handle);
  }, [typed]);

  const { data, isLoading, isError, error, refetch } = useTalentPool({ search, skills: filters.skills, locations: filters.locations, limit: 60 });
  const { data: vacanciesPage } = useVacancies({ status: "Abierta", limit: 100 });
  const openVacancies = vacanciesPage?.items ?? [];
  const createApplication = useCreateApplication();

  const handleAssign = (candidateId: string, vacancy: Vacancy) => {
    createApplication.mutate(
      { candidateId, vacancyId: vacancy.id },
      {
        onSuccess: () => toast.success(`Candidato agregado a la vacante "${vacancy.title}"`),
        onError: (err) => toast.error(errorMessage(err, "No fue posible asignar el candidato")),
      },
    );
  };

  const activeFilters = filters.locations.length + filters.skills.length;
  const candidates = data?.items ?? [];

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1600, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Banco de Talentos</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Candidatos sin vacante vinculada, listos para ser evaluados en nuevos procesos.</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddAltRoundedIcon />} onClick={() => openAddCandidate(null)}>Agregar candidato</Button>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} sx={{ mb: 2.5 }}>
        <TextField
          placeholder="Buscar por nombre, email o competencia…"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 380 }, bgcolor: "background.paper" }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
        />
        <Button onClick={() => setFiltersOpen(true)} variant="outlined" startIcon={<FilterListRoundedIcon />}>
          Filtros {activeFilters > 0 && <Chip label={activeFilters} size="small" color="primary" sx={{ ml: 0.75, height: 20 }} />}
        </Button>
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 1.75 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={180} />)}
        </Box>
      ) : candidates.length === 0 ? (
        <EmptyState icon={<GroupsRoundedIcon />} title="Banco de talentos vacío" description="No se encontró ningún candidato sin vacante con los filtros actuales." />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 1.75 }}>
          {candidates.map((candidate) => (
            <TalentPoolCard key={candidate.id} candidate={candidate} vacancies={openVacancies} onOpen={openCandidate} onAssign={handleAssign} />
          ))}
        </Box>
      )}

      <FiltersDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </Box>
  );
}
