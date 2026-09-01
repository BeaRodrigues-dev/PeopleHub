import { useEffect, useState } from "react";
import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateAgendaEvent, useUpdateAgendaEvent } from "../queries";
import { AGENDA_CATEGORIES, type AgendaEvent, type CreateAgendaEventInput } from "../types";

function emptyForm(date?: string): CreateAgendaEventInput {
  return { title: "", eventDate: date ?? new Date().toISOString().slice(0, 10), eventTime: "", notes: "", category: "Personal" };
}

export function AddEventModal({ open, onClose, event, defaultDate }: { open: boolean; onClose: () => void; event?: AgendaEvent | null; defaultDate?: string }) {
  const isEditing = !!event;
  const [form, setForm] = useState<CreateAgendaEventInput>(emptyForm(defaultDate));
  const createEvent = useCreateAgendaEvent();
  const updateEvent = useUpdateAgendaEvent();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(event ? { title: event.title, eventDate: event.eventDate, eventTime: event.eventTime ?? "", notes: event.notes, category: event.category } : emptyForm(defaultDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event, defaultDate]);

  const isSaving = createEvent.isPending || updateEvent.isPending;
  const set = <K extends keyof CreateAgendaEventInput>(key: K, value: CreateAgendaEventInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handleClose = () => { setForm(emptyForm(defaultDate)); onClose(); };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Ingresa un título para el evento.");
      return;
    }
    if (isEditing && event) {
      updateEvent.mutate(
        { id: event.id, input: form },
        {
          onSuccess: () => { toast.success("Evento actualizado."); handleClose(); },
          onError: (error) => toast.error(errorMessage(error, "No se pudieron guardar los cambios.")),
        },
      );
      return;
    }
    createEvent.mutate(form, {
      onSuccess: () => { toast.success("Evento agregado a la agenda."); handleClose(); },
      onError: (error) => toast.error(errorMessage(error, "No fue posible agregar el evento.")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar evento" : "Nuevo evento"}
      subtitle={isEditing ? undefined : "Anota fechas, reuniones o recordatorios en tu agenda personal."}
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
          <TextField label="Título" fullWidth size="small" placeholder="Ej.: Reunión 1:1, Cumpleaños, Entrega de reporte…" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Grid>
        <Grid size={7}>
          <TextField label="Fecha" type="date" fullWidth size="small" value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={5}>
          <TextField label="Hora (opcional)" type="time" fullWidth size="small" value={form.eventTime} onChange={(e) => set("eventTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={12}>
          <TextField select label="Categoría" fullWidth size="small" value={form.category} onChange={(e) => set("category", e.target.value as CreateAgendaEventInput["category"])}>
            {AGENDA_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid size={12}>
          <TextField label="Notas (opcional)" fullWidth multiline minRows={2} size="small" value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </Grid>
      </Grid>
    </Modal>
  );
}
