import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Chip,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ViewKanbanRoundedIcon from "@mui/icons-material/ViewKanbanRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import { useNavigate } from "react-router-dom";
import { KanbanBoard } from "../components/kanban/KanbanBoard";
import { CandidateList } from "../components/candidates/CandidateList";
import { FiltersDrawer } from "../components/filters/FiltersDrawer";
import { useCandidateStore } from "../store/candidateStore";
export function CandidatesPage() {
  const [drawer, setDrawer] = useState(false),
    [typed, setTyped] = useState("");
  const navigate = useNavigate();
  const viewMode = useCandidateStore((s) => s.viewMode),
    setView = useCandidateStore((s) => s.setViewMode),
    search = useCandidateStore((s) => s.search),
    setSearch = useCandidateStore((s) => s.setSearch),
    reset = useCandidateStore((s) => s.resetBoard),
    select = useCandidateStore((s) => s.selectCandidate),
    filters = useCandidateStore((s) => s.filters);
  useEffect(() => setTyped(search), []);
  useEffect(() => {
    const h = setTimeout(() => {
      if (typed !== search) {
        setSearch(typed);
        reset();
      }
    }, 300);
    return () => clearTimeout(h);
  }, [typed, search, setSearch, reset]);
  const activeFilters = useMemo(
    () =>
      filters.statuses.length +
      filters.seniorities.length +
      filters.locations.length +
      (filters.appliedFrom ? 1 : 0) +
      (filters.salary[0] > 0 || filters.salary[1] < 30000 ? 1 : 0),
    [filters],
  );
  const open = (id: string) => {
    select(id);
    navigate(`/candidate/${id}`);
  };
  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1800, mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">Candidatos</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>
            Acompanhe cada pessoa ao longo do processo seletivo.
          </Typography>
        </Box>
        <ToggleButtonGroup
          exclusive
          value={viewMode}
          onChange={(_, v) => v && setView(v)}
          size="small"
          sx={{ height: 40 }}
        >
          <ToggleButton value="kanban">
            <ViewKanbanRoundedIcon sx={{ mr: 0.7, fontSize: 18 }} />
            Kanban
          </ToggleButton>
          <ToggleButton value="list">
            <FormatListBulletedRoundedIcon sx={{ mr: 0.7, fontSize: 18 }} />
            Lista
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        gap={1.25}
        sx={{ mb: 2.5 }}
      >
        <TextField
          placeholder="Busque por nome, email, cargo ou empresa..."
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 420 }, bgcolor: "background.paper" }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          onClick={() => setDrawer(true)}
          variant="outlined"
          startIcon={<FilterListRoundedIcon />}
        >
          Filtros{" "}
          {activeFilters > 0 && (
            <Chip
              label={activeFilters}
              size="small"
              color="primary"
              sx={{ ml: 0.5, height: 20 }}
            />
          )}
        </Button>
      </Stack>
      {viewMode === "kanban" ? (
        <KanbanBoard onOpen={open} />
      ) : (
        <CandidateList onOpen={open} />
      )}
      <FiltersDrawer open={drawer} onClose={() => setDrawer(false)} />
    </Box>
  );
}
