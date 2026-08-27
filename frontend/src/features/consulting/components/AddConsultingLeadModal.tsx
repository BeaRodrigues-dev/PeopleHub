import { useEffect, useState } from "react";
import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateConsultingLead, useUpdateConsultingLead } from "../queries";
import { CONSULTING_STATUSES, type ConsultingLead, type CreateConsultingLeadInput } from "../types";

const empty: CreateConsultingLeadInput = { company: "", sector: "", size: "", contact: "", need: "", status: "Investigado", value: "" };

export function AddConsultingLeadModal({ open, onClose, lead }: { open: boolean; onClose: () => void; lead?: ConsultingLead | null }) {
  const isEditing = !!lead;
  const [form, setForm] = useState<CreateConsultingLeadInput>(empty);
  const createLead = useCreateConsultingLead();
  const updateLead = useUpdateConsultingLead();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(lead ? { company: lead.company, sector: lead.sector, size: lead.size, contact: lead.contact, need: lead.need, status: lead.status, value: lead.value } : empty);
    }
  }, [open, lead]);

  const isSaving = createLead.isPending || updateLead.isPending;
  const set = <K extends keyof CreateConsultingLeadInput>(key: K, value: CreateConsultingLeadInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handleClose = () => { setForm(empty); onClose(); };

  const handleSubmit = () => {
    if (!form.company.trim()) {
      toast.error("Ingresa el nombre de la empresa.");
      return;
    }
    if (isEditing && lead) {
      updateLead.mutate(
        { id: lead.id, input: form },
        {
          onSuccess: () => { toast.success("Empresa actualizada."); handleClose(); },
          onError: (error) => toast.error(errorMessage(error, "No se pudieron guardar los cambios.")),
        },
      );
      return;
    }
    createLead.mutate(form, {
      onSuccess: () => { toast.success("Empresa agregada al pipeline."); handleClose(); },
      onError: (error) => toast.error(errorMessage(error, "No fue posible agregar la empresa.")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar empresa" : "Nueva empresa"}
      subtitle={isEditing ? undefined : "Agregar al pipeline de consulting."}
      width={560}
      footer={
        <>
          <Button variant="text" onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Agregar"}</Button>
        </>
      }
    >
      <Grid container spacing={2}>
        <Grid size={12}><TextField label="Empresa" fullWidth size="small" value={form.company} onChange={(e) => set("company", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Sector" fullWidth size="small" value={form.sector} onChange={(e) => set("sector", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Tamaño" fullWidth size="small" placeholder="ej.: 50–100" value={form.size} onChange={(e) => set("size", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Contacto" fullWidth size="small" value={form.contact} onChange={(e) => set("contact", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Valor estimado" fullWidth size="small" placeholder="ej.: €2.000/mes" value={form.value} onChange={(e) => set("value", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Necesidad" fullWidth size="small" value={form.need} onChange={(e) => set("need", e.target.value)} /></Grid>
        <Grid size={6}>
          <TextField select label="Status" fullWidth size="small" value={form.status} onChange={(e) => set("status", e.target.value as CreateConsultingLeadInput["status"])}>
            {CONSULTING_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </Modal>
  );
}
