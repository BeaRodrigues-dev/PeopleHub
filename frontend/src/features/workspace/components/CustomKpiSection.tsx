import { useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import { useCustomKpis, useDeleteCustomKpi } from "../queries";
import { AddKpiModal } from "./AddKpiModal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { EmptyState } from "../../../components/common/EmptyState";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { useToast } from "../../../components/common/ToastProvider";
import type { CustomKpi } from "../types";

const CATEGORY_COLOR: Record<string, { bg: string; fg: string }> = {
  Empresa: { bg: "#E7E2FB", fg: "#5646C4" },
  Personal: { bg: "#E7E2FB", fg: "#5646C4" },
};

export function CustomKpiSection() {
  const { data: kpis, isLoading, isError, error, refetch } = useCustomKpis();
  const deleteKpi = useDeleteCustomKpi();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CustomKpi | null>(null);
  const [toDelete, setToDelete] = useState<CustomKpi | null>(null);

  const items = kpis ?? [];
  const maxValue = Math.max(1, ...items.map((k) => Math.abs(k.value)));

  const handleDelete = () => {
    if (!toDelete) return;
    deleteKpi.mutate(toDelete.id, {
      onSuccess: () => { toast.success("KPI eliminado."); setToDelete(null); },
      onError: (err) => toast.error(errorMessage(err, "No fue posible eliminar.")),
    });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          <Typography fontWeight={800} fontSize={17}>📌 Tus KPIs</Typography>
          <Typography variant="body2" color="text.secondary">Indicadores de la empresa y personales, 100% editables por ti.</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon fontSize="small" />} onClick={() => setAddOpen(true)}>Agregar KPI</Button>
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={110} />)}
        </Box>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<QueryStatsRoundedIcon />}
          title="Todavía no agregaste ningún KPI"
          description="Crea el primero — puede ser una métrica de la empresa o algo tuyo que quieras seguir."
          action={<Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setAddOpen(true)}>Agregar KPI</Button>}
        />
      ) : (
        <Stack spacing={2}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
            {items.map((kpi) => {
              const color = CATEGORY_COLOR[kpi.category] ?? CATEGORY_COLOR.Personal;
              return (
                <Box key={kpi.id} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.25, position: "relative" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.75 }}>
                    <Chip label={kpi.category} size="small" sx={{ bgcolor: color.bg, color: color.fg, fontWeight: 700, height: 20 }} />
                    <Stack direction="row" spacing={0.25}>
                      <IconButton size="small" onClick={() => setEditing(kpi)}><EditRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
                      <IconButton size="small" onClick={() => setToDelete(kpi)}><DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
                    </Stack>
                  </Stack>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" noWrap>{kpi.label}</Typography>
                  <Typography sx={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, mt: 0.25 }}>
                    {kpi.value}{kpi.unit && <Typography component="span" fontSize={14} fontWeight={700} color="text.secondary"> {kpi.unit}</Typography>}
                  </Typography>
                  {kpi.note && <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.4 }}>{kpi.note}</Typography>}
                </Box>
              );
            })}
          </Box>

          <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
            <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>Comparativa (generada automáticamente)</Typography>
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {items.map((kpi) => {
                const color = CATEGORY_COLOR[kpi.category] ?? CATEGORY_COLOR.Personal;
                const pct = Math.max(4, (Math.abs(kpi.value) / maxValue) * 100);
                return (
                  <Stack key={kpi.id} direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="body2" color="text.secondary" sx={{ width: 160, flexShrink: 0 }} noWrap>{kpi.label}</Typography>
                    <Box sx={{ flex: 1, height: 20, bgcolor: "#EFEDFB", borderRadius: 2, overflow: "hidden" }}>
                      <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: color.fg, display: "flex", alignItems: "center", px: 1 }}>
                        <Typography variant="caption" color="#fff" fontWeight={700}>{kpi.value}{kpi.unit}</Typography>
                      </Box>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          </Box>

          <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#F3F1FC" }}>
                  {["KPI", "Categoría", "Valor", "Nota"].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "text.secondary" }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((kpi) => (
                  <TableRow key={kpi.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={700}>{kpi.label}</Typography></TableCell>
                    <TableCell>
                      <Chip label={kpi.category} size="small" sx={{ bgcolor: (CATEGORY_COLOR[kpi.category] ?? CATEGORY_COLOR.Personal).bg, color: (CATEGORY_COLOR[kpi.category] ?? CATEGORY_COLOR.Personal).fg, fontWeight: 700 }} />
                    </TableCell>
                    <TableCell><Typography variant="body2" fontWeight={700}>{kpi.value} {kpi.unit}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{kpi.note || "—"}</Typography></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Stack>
      )}

      <AddKpiModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddKpiModal open={!!editing} onClose={() => setEditing(null)} kpi={editing} />
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar KPI"
        description={`¿Estás seguro de que deseas eliminar "${toDelete?.label}"? Esta acción no se puede deshacer.`}
        loading={deleteKpi.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
