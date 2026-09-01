import { useEffect, useState } from "react";
import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateCustomKpi, useUpdateCustomKpi } from "../queries";
import { WORKSPACE_CATEGORIES, type CreateCustomKpiInput, type CustomKpi } from "../types";

const empty: CreateCustomKpiInput = { label: "", value: 0, unit: "", category: "Personal", note: "" };

export function AddKpiModal({ open, onClose, kpi }: { open: boolean; onClose: () => void; kpi?: CustomKpi | null }) {
  const isEditing = !!kpi;
  const [form, setForm] = useState<CreateCustomKpiInput>(empty);
  const createKpi = useCreateCustomKpi();
  const updateKpi = useUpdateCustomKpi();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(kpi ? { label: kpi.label, value: kpi.value, unit: kpi.unit, category: kpi.category, note: kpi.note } : empty);
    }
  }, [open, kpi]);

  const isSaving = createKpi.isPending || updateKpi.isPending;
  const set = <K extends keyof CreateCustomKpiInput>(key: K, value: CreateCustomKpiInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handleClose = () => { setForm(empty); onClose(); };

  const handleSubmit = () => {
    if (!form.label.trim()) {
      toast.error("Ingresa un nombre para el KPI.");
      return;
    }
    if (isEditing && kpi) {
      updateKpi.mutate(
        { id: kpi.id, input: form },
        {
          onSuccess: () => { toast.success("KPI actualizado."); handleClose(); },
          onError: (error) => toast.error(errorMessage(error, "No se pudieron guardar los cambios.")),
        },
      );
      return;
    }
    createKpi.mutate(form, {
      onSuccess: () => { toast.success("KPI agregado."); handleClose(); },
      onError: (error) => toast.error(errorMessage(error, "No fue posible agregar el KPI.")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar KPI" : "Nuevo KPI"}
      subtitle={isEditing ? undefined : "Un indicador que tú defines y actualizas — de la empresa o personal."}
      width={480}
      footer={
        <>
          <Button variant="text" onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar"}</Button>
        </>
      }
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField label="Nombre del KPI" fullWidth size="small" placeholder="Ej.: Ventas del mes, Horas de estudio…" value={form.label} onChange={(e) => set("label", e.target.value)} />
        </Grid>
        <Grid size={7}>
          <TextField label="Valor" type="number" fullWidth size="small" value={form.value} onChange={(e) => set("value", Number(e.target.value))} />
        </Grid>
        <Grid size={5}>
          <TextField label="Unidad (opcional)" fullWidth size="small" placeholder="%, €, un." value={form.unit} onChange={(e) => set("unit", e.target.value)} />
        </Grid>
        <Grid size={12}>
          <TextField select label="Categoría" fullWidth size="small" value={form.category} onChange={(e) => set("category", e.target.value as CreateCustomKpiInput["category"])}>
            {WORKSPACE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={12}>
          <TextField label="Nota (opcional)" fullWidth multiline minRows={2} size="small" value={form.note} onChange={(e) => set("note", e.target.value)} />
        </Grid>
      </Grid>
    </Modal>
  );
}
