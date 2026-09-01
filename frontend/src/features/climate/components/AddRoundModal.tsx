import { useEffect, useState } from "react";
import { Button, Grid, TextField } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateClimateRound, useUpdateClimateRound } from "../queries";
import type { ClimateSurveyRound, CreateClimateSurveyRoundInput } from "../types";

const empty: CreateClimateSurveyRoundInput = { name: "", roundDate: new Date().toISOString().slice(0, 10), respondents: 0, notes: "" };

export function AddRoundModal({ open, onClose, round }: { open: boolean; onClose: () => void; round?: ClimateSurveyRound | null }) {
  const isEditing = !!round;
  const [form, setForm] = useState<CreateClimateSurveyRoundInput>(empty);
  const createRound = useCreateClimateRound();
  const updateRound = useUpdateClimateRound();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(round ? { name: round.name, roundDate: round.roundDate, respondents: round.respondents, notes: round.notes } : empty);
    }
  }, [open, round]);

  const isSaving = createRound.isPending || updateRound.isPending;
  const set = <K extends keyof CreateClimateSurveyRoundInput>(key: K, value: CreateClimateSurveyRoundInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handleClose = () => { setForm(empty); onClose(); };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Ingresa un nombre para la ronda.");
      return;
    }
    if (isEditing && round) {
      updateRound.mutate(
        { id: round.id, input: form },
        {
          onSuccess: () => { toast.success("Ronda actualizada."); handleClose(); },
          onError: (error) => toast.error(errorMessage(error, "No se pudieron guardar los cambios.")),
        },
      );
      return;
    }
    createRound.mutate(form, {
      onSuccess: () => { toast.success("Ronda creada."); handleClose(); },
      onError: (error) => toast.error(errorMessage(error, "No fue posible crear la ronda.")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar ronda" : "Nueva ronda de encuesta"}
      subtitle={isEditing ? undefined : "Cada ronda agrupa los resultados de una encuesta de clima aplicada en una fecha."}
      width={480}
      footer={
        <>
          <Button variant="text" onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={isSaving}>{isSaving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear ronda"}</Button>
        </>
      }
    >
      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField label="Nombre de la ronda" fullWidth size="small" placeholder="Ej.: Ronda 1 — Q1 2026" value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Grid>
        <Grid size={7}>
          <TextField label="Fecha de la ronda" type="date" fullWidth size="small" value={form.roundDate} onChange={(e) => set("roundDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={5}>
          <TextField label="Respondientes" type="number" fullWidth size="small" value={form.respondents} onChange={(e) => set("respondents", Number(e.target.value))} />
        </Grid>
        <Grid size={12}>
          <TextField label="Notas (opcional)" fullWidth multiline minRows={2} size="small" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Grid>
      </Grid>
    </Modal>
  );
}
