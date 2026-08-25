import { useMemo, useState } from "react";
import { Box, Button, Chip, InputAdornment, Skeleton, Stack, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import { useNavigate } from "react-router-dom";
import { useVacancies } from "../queries";
import { useVacancyCandidateCounts } from "../../candidate/queries";
import { VacancyCard } from "../components/VacancyCard";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import { VACANCY_STATUSES, type VacancyStatus } from "../types";

export function VacanciesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<VacancyStatus | null>(null);
  const navigate = useNavigate();

  const { data, isLoading, isError, error, refetch } = useVacancies({ search, status: status ?? undefined });
  const vacancies = data?.items ?? [];
  const { data: counts } = useVacancyCandidateCounts(vacancies.map((v) => v.id));

  const summary = useMemo(() => `${data?.total ?? 0} vagas encontradas`, [data?.total]);

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Vagas</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Gerencie processos seletivos e acompanhe cada pipeline.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/criar-vaga")}>Criar vaga</Button>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} sx={{ mb: 1 }}>
        <TextField
          placeholder="Buscar por vaga, departamento ou localização…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 380 }, bgcolor: "background.paper" }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
        />
        <Stack direction="row" gap={0.75} flexWrap="wrap">
          <Chip label="Todas" size="small" onClick={() => setStatus(null)} color={!status ? "primary" : "default"} variant={!status ? "filled" : "outlined"} />
          {VACANCY_STATUSES.map((s) => (
            <Chip key={s} label={s} size="small" onClick={() => setStatus(s)} color={status === s ? "primary" : "default"} variant={status === s ? "filled" : "outlined"} />
          ))}
        </Stack>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>{!isLoading && summary}</Typography>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={168} />)}
        </Box>
      ) : vacancies.length === 0 ? (
        <EmptyState
          icon={<WorkOutlineRoundedIcon />}
          title="Nenhuma vaga encontrada"
          description="Ajuste a busca ou os filtros, ou crie uma nova vaga para começar a receber candidatos."
          action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => navigate("/criar-vaga")}>Criar vaga</Button>}
        />
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr 1fr 1fr" }, gap: 2 }}>
          {vacancies.map((vacancy) => <VacancyCard key={vacancy.id} vacancy={vacancy} candidateCount={counts?.[vacancy.id]} />)}
        </Box>
      )}
    </Box>
  );
}
