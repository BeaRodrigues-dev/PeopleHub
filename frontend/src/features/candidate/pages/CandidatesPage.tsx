import { useEffect, useState } from "react";
import { Box, Button, Chip, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import { CandidateList } from "../components/CandidateList";
import { FiltersDrawer } from "../../../components/filters/FiltersDrawer";
import { useUIStore } from "../../../store/uiStore";

/** Diretório global de candidatos (atribuídos a vagas + Banco de Talentos). */
export function CandidatesPage() {
  const [typed, setTyped] = useState("");
  const [search, setSearch] = useState("");
  const openCandidate = useUIStore((s) => s.openCandidate);
  const openAddCandidate = useUIStore((s) => s.openAddCandidate);
  const filters = useUIStore((s) => s.filters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setSearch(typed), 300);
    return () => clearTimeout(handle);
  }, [typed]);

  const activeFilters = filters.locations.length + filters.skills.length;

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1600, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Candidatos</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>Todos os candidatos da organização, atribuídos ou não a uma vaga.</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddAltRoundedIcon />} onClick={() => openAddCandidate(null)}>Adicionar candidato</Button>
      </Stack>
      <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} sx={{ mb: 2.5 }}>
        <TextField
          placeholder="Busque por nome, email ou competência…"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 420 }, bgcolor: "background.paper" }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
        />
        <Button onClick={() => setFiltersOpen(true)} variant="outlined" startIcon={<FilterListRoundedIcon />}>
          Filtros {activeFilters > 0 && <Chip label={activeFilters} size="small" color="primary" sx={{ ml: 0.75, height: 20 }} />}
        </Button>
      </Stack>
      <CandidateList onOpen={openCandidate} search={search} filters={filters} />
      <FiltersDrawer open={filtersOpen} onClose={() => setFiltersOpen(false)} />
    </Box>
  );
}
