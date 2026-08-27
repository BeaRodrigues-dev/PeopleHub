import { useState } from "react";
import { Avatar, Box, Card, Chip, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import { useCandidates } from "../queries";
import { useVacancies } from "../../vacancy/queries";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState } from "../../../components/common/ErrorState";
import type { CandidateFilters } from "../types";

export function CandidateList({ onOpen, search, filters }: { onOpen: (id: string) => void; search: string; filters: CandidateFilters }) {
  const [page, setPage] = useState(1);
  const { data: vacanciesPage } = useVacancies({ limit: 100 });
  const vacancies = vacanciesPage?.items ?? [];

  const { data, isLoading, isError, error, refetch, isFetching } = useCandidates({
    page,
    limit: 25,
    search,
    skills: filters.skills,
    locations: filters.locations,
  });

  if (isLoading) {
    return <Box sx={{ display: "grid", placeItems: "center", height: 320 }}><CircularProgress /></Box>;
  }
  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;

  const rows = data?.items ?? [];
  if (rows.length === 0) {
    return <EmptyState icon={<PeopleAltRoundedIcon />} title="No se encontró ningún candidato" description="Ajusta la búsqueda o los filtros aplicados." />;
  }

  return (
    <Card sx={{ overflow: "hidden", borderRadius: 4 }}>
      <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {["Candidato", "Vacante", "Ubicación", "Competencias", "Registro"].map((x) => (
                <TableCell key={x} sx={{ fontWeight: 750, bgcolor: "#fafaff" }}>{x}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((c) => {
              const vacancy = vacancies.find((v) => v.id === c.vacancyId);
              return (
                <TableRow hover key={c.id} onClick={() => onOpen(c.id)} sx={{ cursor: "pointer" }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <Avatar src={c.avatar ?? undefined} sx={{ width: 32, height: 32 }} />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography fontWeight={700} fontSize={13.5} noWrap>{c.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{c.email}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{vacancy ? <Typography fontSize={13} noWrap>{vacancy.title}</Typography> : <Chip label="Banco de Talentos" size="small" variant="outlined" />}</TableCell>
                  <TableCell>{c.location || "—"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, maxWidth: 220 }}>
                      {c.skills.slice(0, 3).map((s) => <Chip key={s} label={s} size="small" sx={{ height: 20, fontSize: 10 }} />)}
                    </Box>
                  </TableCell>
                  <TableCell>{new Intl.DateTimeFormat("pt-BR").format(new Date(c.createdAt))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" color="text.secondary">{data?.total ?? 0} candidatos encontrados</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip label="Anterior" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => p - 1)} clickable />
          <Chip label={isFetching ? "Cargando…" : "Siguiente"} disabled={!data?.hasMore || isFetching} onClick={() => setPage((p) => p + 1)} clickable />
        </Box>
      </Box>
    </Card>
  );
}
