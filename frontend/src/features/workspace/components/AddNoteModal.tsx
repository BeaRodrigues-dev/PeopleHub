import { useEffect, useState } from "react";
import { Button, Grid, MenuItem, TextField } from "@mui/material";
import { Modal } from "../../../components/common/Modal";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import { useCreateCustomNote, useUpdateCustomNote } from "../queries";
import { WORKSPACE_CATEGORIES, type CreateCustomNoteInput, type CustomNote } from "../types";

const empty: CreateCustomNoteInput = { title: "", body: "", category: "Personal" };

export function AddNoteModal({ open, onClose, note }: { open: boolean; onClose: () => void; note?: CustomNote | null }) {
  const isEditing = !!note;
  const [form, setForm] = useState<CreateCustomNoteInput>(empty);
  const createNote = useCreateCustomNote();
  const updateNote = useUpdateCustomNote();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setForm(note ? { title: note.title, body: note.body, category: note.category } : empty);
    }
  }, [open, note]);

  const isSaving = createNote.isPending || updateNote.isPending;
  const set = <K extends keyof CreateCustomNoteInput>(key: K, value: CreateCustomNoteInput[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handleClose = () => { setForm(empty); onClose(); };

  const handleSubmit = () => {
    if (!form.title.trim() && !form.body.trim()) {
      toast.error("Escribe un título o un contenido para la nota.");
      return;
    }
    if (isEditing && note) {
      updateNote.mutate(
        { id: note.id, input: form },
        {
          onSuccess: () => { toast.success("Nota actualizada."); handleClose(); },
          onError: (error) => toast.error(errorMessage(error, "No se pudieron guardar los cambios.")),
        },
      );
      return;
    }
    createNote.mutate(form, {
      onSuccess: () => { toast.success("Nota agregada."); handleClose(); },
      onError: (error) => toast.error(errorMessage(error, "No fue posible agregar la nota.")),
    });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar nota" : "Nueva nota"}
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
          <TextField label="Título" fullWidth size="small" value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Grid>
        <Grid size={12}>
          <TextField label="Contenido" fullWidth multiline minRows={4} size="small" value={form.body} onChange={(e) => set("body", e.target.value)} />
        </Grid>
        <Grid size={12}>
          <TextField select label="Categoría" fullWidth size="small" value={form.category} onChange={(e) => set("category", e.target.value as CreateCustomNoteInput["category"])}>
            {WORKSPACE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Grid>
      </Grid>
    </Modal>
  );
}
