import { useState } from "react";
import { Box, Button, Chip, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useCustomNotes, useDeleteCustomNote } from "../queries";
import { AddNoteModal } from "./AddNoteModal";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { ErrorState, errorMessage } from "../../../components/common/ErrorState";
import { useToast } from "../../../components/common/ToastProvider";
import type { CustomNote } from "../types";

const CATEGORY_COLOR: Record<string, { bg: string; fg: string }> = {
  Empresa: { bg: "#E3F2E8", fg: "#5F9678" },
  Personal: { bg: "#E7F3EC", fg: "#5F9678" },
};

export function CustomNotesSection() {
  const { data: notes, isLoading, isError, error, refetch } = useCustomNotes();
  const deleteNote = useDeleteCustomNote();
  const toast = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CustomNote | null>(null);
  const [toDelete, setToDelete] = useState<CustomNote | null>(null);

  const items = notes ?? [];

  const handleDelete = () => {
    if (!toDelete) return;
    deleteNote.mutate(toDelete.id, {
      onSuccess: () => { toast.success("Nota eliminada."); setToDelete(null); },
      onError: (err) => toast.error(errorMessage(err, "No fue posible eliminar.")),
    });
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          <Typography fontWeight={800} fontSize={17}>🗒️ Tus notas</Typography>
          <Typography variant="body2" color="text.secondary">Información suelta que quieras guardar — ideas, recordatorios, lo que sea.</Typography>
        </Box>
        <Button variant="contained" size="small" startIcon={<AddRoundedIcon fontSize="small" />} onClick={() => setAddOpen(true)}>Agregar nota</Button>
      </Stack>

      {isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={120} />)}
        </Box>
      ) : items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">Ninguna nota todavía.</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
          {items.map((note) => {
            const color = CATEGORY_COLOR[note.category] ?? CATEGORY_COLOR.Personal;
            return (
              <Box key={note.id} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 0.75 }}>
                  <Chip label={note.category} size="small" sx={{ bgcolor: color.bg, color: color.fg, fontWeight: 700, height: 20 }} />
                  <Stack direction="row" spacing={0.25}>
                    <IconButton size="small" onClick={() => setEditing(note)}><EditRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
                    <IconButton size="small" onClick={() => setToDelete(note)}><DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
                  </Stack>
                </Stack>
                {note.title && <Typography fontWeight={700} sx={{ mb: 0.5 }}>{note.title}</Typography>}
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{note.body}</Typography>
              </Box>
            );
          })}
        </Box>
      )}

      <AddNoteModal open={addOpen} onClose={() => setAddOpen(false)} />
      <AddNoteModal open={!!editing} onClose={() => setEditing(null)} note={editing} />
      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar nota"
        description={`¿Estás seguro de que deseas eliminar "${toDelete?.title || "esta nota"}"? Esta acción no se puede deshacer.`}
        loading={deleteNote.isPending}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </Box>
  );
}
