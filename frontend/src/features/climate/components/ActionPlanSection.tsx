import { useEffect, useState } from "react";
import { Box, Button, Chip, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import { useCreateClimateActionItem, useDeleteClimateActionItem, useUpdateClimateActionItem } from "../queries";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { ACTION_PRIORITIES, ACTION_STATUSES, type ActionPriority, type ActionStatus, type ClimateActionItem } from "../types";

const PRIORITY_COLOR: Record<ActionPriority, { bg: string; fg: string }> = {
  Alta: { bg: "#F5E3E8", fg: "#C9748A" },
  Media: { bg: "#F7EFE0", fg: "#D6A65D" },
  Baja: { bg: "#E1F3EA", fg: "#2F8F63" },
};

const STATUS_COLOR: Record<ActionStatus, { bg: string; fg: string }> = {
  Pendiente: { bg: "#EFEDFB", fg: "#6B7086" },
  "En curso": { bg: "#E1EAFE", fg: "#4C7DE0" },
  Completado: { bg: "#E1F3EA", fg: "#2F8F63" },
};

const emptyForm = { name: "", description: "", owner: "", dueDate: "", priority: "Media" as ActionPriority };

interface ActionPlanSectionProps {
  roundId: string;
  items: ClimateActionItem[];
  prefill?: { name: string; description: string } | null;
  onPrefillConsumed?: () => void;
}

export function ActionPlanSection({ roundId, items, prefill, onPrefillConsumed }: ActionPlanSectionProps) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const createItem = useCreateClimateActionItem();
  const updateItem = useUpdateClimateActionItem();
  const deleteItem = useDeleteClimateActionItem();
  const toast = useToast();

  useEffect(() => {
    if (prefill) {
      setForm({ ...emptyForm, name: prefill.name, description: prefill.description });
      setAdding(true);
      onPrefillConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleAdd = () => {
    if (!form.name.trim()) return;
    createItem.mutate(
      { roundId, name: form.name.trim(), description: form.description.trim(), owner: form.owner.trim(), dueDate: form.dueDate || null, priority: form.priority, status: "Pendiente", origin: "manual" },
      {
        onSuccess: () => { setForm(emptyForm); setAdding(false); },
        onError: (err) => toast.error(errorMessage(err, "No fue posible crear la acción.")),
      },
    );
  };

  const handleApprove = (item: ClimateActionItem) => {
    updateItem.mutate({ id: item.id, input: { origin: "manual" } }, { onError: (err) => toast.error(errorMessage(err, "No se pudo aprobar.")) });
  };

  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.75 }}>
        <Box>
          <Typography fontWeight={800} fontSize={15}>Plan de acción de People</Typography>
          <Typography variant="body2" color="text.secondary">Transforma los resultados en acciones concretas — la IA puede sugerir, People decide y da seguimiento.</Typography>
        </Box>
        <Button size="small" variant="outlined" startIcon={<AddRoundedIcon fontSize="small" />} onClick={() => setAdding((v) => !v)}>Nueva acción</Button>
      </Stack>

      {adding && (
        <Stack spacing={1.25} sx={{ mb: 2.5, p: 1.75, bgcolor: "#FAFAFD", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <TextField size="small" label="Nombre de la acción" value={form.name} onChange={(e) => set("name", e.target.value)} />
          <TextField size="small" label="Descripción" multiline minRows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          <Stack direction="row" spacing={1.25}>
            <TextField size="small" label="Responsable" fullWidth value={form.owner} onChange={(e) => set("owner", e.target.value)} />
            <TextField size="small" label="Prazo" type="date" fullWidth value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField size="small" select label="Prioridad" fullWidth value={form.priority} onChange={(e) => set("priority", e.target.value as ActionPriority)}>
              {ACTION_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" variant="text" onClick={() => { setAdding(false); setForm(emptyForm); }}>Cancelar</Button>
            <Button size="small" variant="contained" onClick={handleAdd} disabled={!form.name.trim() || createItem.isPending}>Guardar</Button>
          </Stack>
        </Stack>
      )}

      {items.length === 0 && !adding ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">Todavía no hay acciones creadas para esta ronda.</Typography>
      ) : (
        <Stack spacing={1.25}>
          {items.map((item) => (
            <Box key={item.id} sx={{ borderRadius: 3, p: 1.75, border: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography fontWeight={800} fontSize={13.5}>{item.name}</Typography>
                    {item.origin === "ia" && (
                      <Chip icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />} label="Sugerencia IA" size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: "#F1EEFD", color: "primary.dark" }} />
                    )}
                  </Stack>
                  {item.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{item.description}</Typography>}
                  <Stack direction="row" spacing={1.5} sx={{ mt: 1 }} flexWrap="wrap" useFlexGap alignItems="center">
                    {item.owner && <Typography variant="caption" color="text.secondary">👤 {item.owner}</Typography>}
                    {item.dueDate && <Typography variant="caption" color="text.secondary">📅 {item.dueDate}</Typography>}
                  </Stack>
                </Box>
                <IconButton size="small" onClick={() => deleteItem.mutate(item.id)}><DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25 }} flexWrap="wrap" useFlexGap>
                <TextField
                  select
                  size="small"
                  variant="standard"
                  value={item.priority}
                  onChange={(e) => updateItem.mutate({ id: item.id, input: { priority: e.target.value as ActionPriority } })}
                  sx={{ minWidth: 90 }}
                  slotProps={{ select: { renderValue: (v) => <Chip label={v as string} size="small" sx={{ bgcolor: PRIORITY_COLOR[v as ActionPriority].bg, color: PRIORITY_COLOR[v as ActionPriority].fg, fontWeight: 700, height: 22 }} /> } }}
                >
                  {ACTION_PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </TextField>
                <TextField
                  select
                  size="small"
                  variant="standard"
                  value={item.status}
                  onChange={(e) => updateItem.mutate({ id: item.id, input: { status: e.target.value as ActionStatus } })}
                  sx={{ minWidth: 110 }}
                  slotProps={{ select: { renderValue: (v) => <Chip label={v as string} size="small" sx={{ bgcolor: STATUS_COLOR[v as ActionStatus].bg, color: STATUS_COLOR[v as ActionStatus].fg, fontWeight: 700, height: 22 }} /> } }}
                >
                  {ACTION_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
                {item.origin === "ia" && (
                  <Button size="small" variant="text" startIcon={<CheckCircleRoundedIcon fontSize="small" />} onClick={() => handleApprove(item)}>Aprobar</Button>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
