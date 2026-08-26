import { useState } from "react";
import { Avatar, Box, Button, Chip, IconButton, InputAdornment, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { useDeleteEmployee, useEmployees } from "../queries";
import { AddEmployeeModal } from "../components/AddEmployeeModal";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { useToast } from "../../../components/common/ToastProvider";
import { LIFECYCLE_STAGES, type Employee, type LifecycleStage } from "../types";

const LIFECYCLE_COLOR: Record<LifecycleStage, { bg: string; fg: string }> = {
  Recruitment: { bg: "#E3ECFA", fg: "#2E5AA8" },
  Onboarding: { bg: "#FBEBD2", fg: "#A66A1E" },
  Development: { bg: "#DCEFE1", fg: "#2E7D4F" },
  Performance: { bg: "#E9DFF5", fg: "#6A3FA0" },
  Offboarding: { bg: "#E4EDE6", fg: "#6E7D74" },
};

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function PeoplePage() {
  const [view, setView] = useState<"database" | "lifecycle">("database");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [toDelete, setToDelete] = useState<Employee | null>(null);
  const toast = useToast();
  const deleteEmployee = useDeleteEmployee();

  const { data, isLoading, isError, error, refetch } = useEmployees({ search });
  const employees = data?.items ?? [];
  const activeCount = employees.filter((e) => e.status === "Active").length;

  const handleDelete = () => {
    if (!toDelete) return;
    deleteEmployee.mutate(toDelete.id, {
      onSuccess: () => { toast.success("Colaborador removido."); setToDelete(null); },
      onError: (err) => toast.error(errorMessage(err, "Não foi possível remover.")),
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: "auto" }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4">People</Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mt: 0.4 }}>{isLoading ? "…" : activeCount} colaboradores ativos</Typography>
        </Box>
        <ToggleButtonGroup exclusive size="small" value={view} onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="database" sx={{ px: 2, textTransform: "none", fontWeight: 700 }}>Base de dados</ToggleButton>
          <ToggleButton value="lifecycle" sx={{ px: 2, textTransform: "none", fontWeight: 700 }}>Lifecycle</ToggleButton>
        </ToggleButtonGroup>
        <Button variant="contained" startIcon={<PersonAddRoundedIcon />} onClick={() => setAddOpen(true)}>Adicionar</Button>
      </Stack>

      {view === "database" && (
        <TextField
          placeholder="Buscar colaborador…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 320 }, mb: 2, bgcolor: "background.paper" }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
        />
      )}

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Stack spacing={1}>{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="rounded" height={48} />)}</Stack>
      ) : employees.length === 0 ? (
        <EmptyState icon={<PeopleAltRoundedIcon />} title="Nenhum colaborador encontrado" description="Ajuste a busca ou adicione um novo colaborador." action={<Button variant="contained" startIcon={<PersonAddRoundedIcon />} onClick={() => setAddOpen(true)}>Adicionar colaborador</Button>} />
      ) : view === "database" ? (
        <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#F1F7F2" }}>
                {["Colaborador", "Cargo", "Área", "País", "Entrada", "Manager", "Contrato", "Fase", "Status", ""].map((h) => (
                  <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28, fontSize: 12, fontWeight: 700, bgcolor: "secondary.light", color: "primary.dark" }}>{initials(e.name)}</Avatar>
                      <Typography variant="body2" fontWeight={700}>{e.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{e.role}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{e.area}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{e.country}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{e.startDate}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{e.manager || "—"}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{e.contract}</Typography></TableCell>
                  <TableCell>
                    <Chip label={e.lifecycle} size="small" sx={{ bgcolor: LIFECYCLE_COLOR[e.lifecycle].bg, color: LIFECYCLE_COLOR[e.lifecycle].fg, fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={e.status} size="small" sx={{ bgcolor: e.status === "Active" ? "#DCEFE1" : "#E4EDE6", color: e.status === "Active" ? "#2E7D4F" : "#6E7D74", fontWeight: 700 }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => setEditing(e)}><EditRoundedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => setToDelete(e)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      ) : (
        <LifecycleBoard employees={employees} />
      )}

      <AddEmployeeModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddEmployeeModal open={!!editing} onClose={() => setEditing(null)} employee={editing} />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir colaborador"
        description={`Tem certeza que deseja excluir "${toDelete?.name}"? Essa ação não pode ser desfeita.`}
        loading={deleteEmployee.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}

function LifecycleBoard({ employees }: { employees: Employee[] }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(5, 1fr)" }, gap: 2 }}>
      {LIFECYCLE_STAGES.map((stage) => {
        const group = employees.filter((e) => e.lifecycle === stage);
        return (
          <Box key={stage}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
              <Chip label={stage} size="small" sx={{ bgcolor: LIFECYCLE_COLOR[stage].bg, color: LIFECYCLE_COLOR[stage].fg, fontWeight: 700 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={700}>{group.length}</Typography>
            </Stack>
            <Stack spacing={1}>
              {group.map((e) => (
                <Box key={e.id} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, p: 1.4 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.4 }}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: 10, fontWeight: 700, bgcolor: "secondary.light", color: "primary.dark" }}>{initials(e.name)}</Avatar>
                    <Typography variant="caption" fontWeight={700} lineHeight={1.2}>{e.name}</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{e.role}</Typography>
                </Box>
              ))}
              {group.length === 0 && <Typography variant="caption" color="text.secondary" fontStyle="italic">Nenhum</Typography>}
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}
