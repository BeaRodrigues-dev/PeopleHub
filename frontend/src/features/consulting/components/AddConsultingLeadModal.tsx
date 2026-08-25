import { useState } from "react";
import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateConsultingLead } from "../queries";
import { CONSULTING_STATUSES, type CreateConsultingLeadInput } from "../types";

const empty: CreateConsultingLeadInput = { company: "", sector: "", size: "", contact: "", need: "", status: "Pesquisado", value: "" };

export function AddConsultingLeadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<CreateConsultingLeadInput>(empty);
  const createLead = useCreateConsultingLead();
  const toast = useToast();

  const set = <K extends keyof CreateConsultingLeadInput>(key: K, value: CreateConsultingLeadInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handleClose = () => { setForm(empty); onClose(); };

  const handleSubmit = () => {
    if (!form.company.trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    createLead.mutate(form, {
      onSuccess: () => { toast.success("Empresa adicionada ao pipeline."); handleClose(); },
      onError: (error) => toast.error(errorMessage(error, "Não foi possível adicionar a empresa.")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nova empresa"
      subtitle="Adicionar ao pipeline de consulting."
      width={560}
      footer={
        <>
          <Button variant="text" onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={createLead.isPending}>{createLead.isPending ? "Salvando…" : "Adicionar"}</Button>
        </>
      }
    >
      <Grid container spacing={2}>
        <Grid size={12}><TextField label="Empresa" fullWidth size="small" value={form.company} onChange={(e) => set("company", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Setor" fullWidth size="small" value={form.sector} onChange={(e) => set("sector", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Dimensão" fullWidth size="small" placeholder="ex.: 50–100" value={form.size} onChange={(e) => set("size", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Contacto" fullWidth size="small" value={form.contact} onChange={(e) => set("contact", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Valor estimado" fullWidth size="small" placeholder="ex.: €2.000/mês" value={form.value} onChange={(e) => set("value", e.target.value)} /></Grid>
        <Grid size={6}><TextField label="Necessidade" fullWidth size="small" value={form.need} onChange={(e) => set("need", e.target.value)} /></Grid>
        <Grid size={6}>
          <TextField select label="Status" fullWidth size="small" value={form.status} onChange={(e) => set("status", e.target.value as CreateConsultingLeadInput["status"])}>
            {CONSULTING_STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </Modal>
  );
}
