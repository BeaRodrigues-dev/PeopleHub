import { useState } from "react";
import { Box, Button, Chip, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import PlaylistAddRoundedIcon from "@mui/icons-material/PlaylistAddRounded";
import { useCreateClimateThemeNote, useDeleteClimateThemeNote, useUpdateClimateThemeNote } from "../queries";
import { useToast } from "../../../components/common/ToastProvider";
import { errorMessage } from "../../../components/common/ErrorState";
import type { ClimateThemeNote, ThemeNoteKind } from "../types";

const KIND_META: Record<ThemeNoteKind, { title: string; emptyText: string; accent: string; bg: string }> = {
  fortaleza: { title: "Puntos fuertes identificados", emptyText: "Todavía no hay puntos fuertes registrados para esta ronda.", accent: "#2FA36B", bg: "#E1F3EA" },
  oportunidad: { title: "Áreas de mejora", emptyText: "Todavía no hay oportunidades registradas para esta ronda.", accent: "#C9748A", bg: "#F5E3E8" },
};

interface ThemeNotesSectionProps {
  roundId: string;
  notes: ClimateThemeNote[];
  onCreateAction: (prefill: { name: string; description: string }) => void;
}

export function ThemeNotesSection({ roundId, notes, onCreateAction }: ThemeNotesSectionProps) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2.5 }}>
      <ThemeColumn kind="fortaleza" roundId={roundId} notes={notes.filter((n) => n.kind === "fortaleza")} onCreateAction={onCreateAction} />
      <ThemeColumn kind="oportunidad" roundId={roundId} notes={notes.filter((n) => n.kind === "oportunidad")} onCreateAction={onCreateAction} />
    </Box>
  );
}

function ThemeColumn({ kind, roundId, notes, onCreateAction }: { kind: ThemeNoteKind; roundId: string; notes: ClimateThemeNote[] } & Pick<ThemeNotesSectionProps, "onCreateAction">) {
  const meta = KIND_META[kind];
  const [adding, setAdding] = useState(false);
  const [theme, setTheme] = useState("");
  const [insight, setInsight] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const createNote = useCreateClimateThemeNote();
  const toast = useToast();

  const handleAdd = () => {
    if (!theme.trim()) return;
    createNote.mutate(
      { roundId, kind, theme: theme.trim(), insight: insight.trim(), suggestion: suggestion.trim(), origin: "manual" },
      {
        onSuccess: () => { setTheme(""); setInsight(""); setSuggestion(""); setAdding(false); },
        onError: (err) => toast.error(errorMessage(err, "No fue posible agregar.")),
      },
    );
  };

  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 4, p: 2.5 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.75 }}>
        <Typography fontWeight={800} fontSize={15}>{meta.title}</Typography>
        <Button size="small" variant="text" startIcon={<AddRoundedIcon fontSize="small" />} onClick={() => setAdding((v) => !v)}>Agregar</Button>
      </Stack>

      {adding && (
        <Stack spacing={1} sx={{ mb: 2, p: 1.5, bgcolor: "#FAFAFD", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
          <TextField size="small" label="Tema" placeholder="Ej.: Autonomía" value={theme} onChange={(e) => setTheme(e.target.value)} />
          <TextField size="small" label="Análisis" placeholder="Ej.: Los colaboradores valoran la libertad para organizar su trabajo." multiline minRows={2} value={insight} onChange={(e) => setInsight(e.target.value)} />
          {kind === "oportunidad" && (
            <TextField size="small" label="Sugerencia de acción (opcional)" multiline minRows={2} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
          )}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" variant="text" onClick={() => setAdding(false)}>Cancelar</Button>
            <Button size="small" variant="contained" onClick={handleAdd} disabled={!theme.trim() || createNote.isPending}>Guardar</Button>
          </Stack>
        </Stack>
      )}

      {notes.length === 0 && !adding ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">{meta.emptyText}</Typography>
      ) : (
        <Stack spacing={1.25}>
          {notes.map((note) => (
            <ThemeNoteCard key={note.id} note={note} accent={meta.accent} bg={meta.bg} onCreateAction={onCreateAction} />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function ThemeNoteCard({ note, accent, bg, onCreateAction }: { note: ClimateThemeNote; accent: string; bg: string } & Pick<ThemeNotesSectionProps, "onCreateAction">) {
  const [editing, setEditing] = useState(false);
  const [theme, setTheme] = useState(note.theme);
  const [insight, setInsight] = useState(note.insight);
  const [suggestion, setSuggestion] = useState(note.suggestion);
  const updateNote = useUpdateClimateThemeNote();
  const deleteNote = useDeleteClimateThemeNote();
  const toast = useToast();

  const handleSave = () => {
    updateNote.mutate(
      { id: note.id, input: { theme: theme.trim(), insight: insight.trim(), suggestion: suggestion.trim() } },
      {
        onSuccess: () => setEditing(false),
        onError: (err) => toast.error(errorMessage(err, "No se pudo guardar.")),
      },
    );
  };

  if (editing) {
    return (
      <Stack spacing={1} sx={{ p: 1.5, bgcolor: "#FAFAFD", borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
        <TextField size="small" label="Tema" value={theme} onChange={(e) => setTheme(e.target.value)} />
        <TextField size="small" label="Análisis" multiline minRows={2} value={insight} onChange={(e) => setInsight(e.target.value)} />
        {note.kind === "oportunidad" && (
          <TextField size="small" label="Sugerencia de acción" multiline minRows={2} value={suggestion} onChange={(e) => setSuggestion(e.target.value)} />
        )}
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button size="small" variant="text" onClick={() => setEditing(false)}>Cancelar</Button>
          <Button size="small" variant="contained" onClick={handleSave} disabled={updateNote.isPending}>Guardar</Button>
        </Stack>
      </Stack>
    );
  }

  return (
    <Box sx={{ borderRadius: 3, p: 1.75, bgcolor: bg, border: "1px solid", borderColor: "divider" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography fontWeight={800} fontSize={13.5} sx={{ color: accent }}>{note.theme}</Typography>
          {note.result !== null && <Chip label={`${note.result} / 10`} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: "background.paper" }} />}
          {note.origin === "ia" && (
            <Chip icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 13 }} />} label="Sugerencia IA" size="small" sx={{ height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: "background.paper", color: "primary.dark" }} />
          )}
        </Stack>
        <Stack direction="row">
          <IconButton size="small" onClick={() => setEditing(true)}><EditRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
          <IconButton size="small" onClick={() => deleteNote.mutate(note.id)}><DeleteOutlineRoundedIcon sx={{ fontSize: 15 }} /></IconButton>
        </Stack>
      </Stack>
      {note.insight && <Typography variant="body2" sx={{ mt: 0.75 }}>{note.insight}</Typography>}
      {note.kind === "oportunidad" && note.suggestion && (
        <>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block", mt: 1 }}>Sugerencia de People</Typography>
          <Typography variant="body2" sx={{ mt: 0.25 }}>{note.suggestion}</Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlaylistAddRoundedIcon fontSize="small" />}
            sx={{ mt: 1 }}
            onClick={() => onCreateAction({ name: note.suggestion, description: note.insight })}
          >
            Crear acción
          </Button>
        </>
      )}
    </Box>
  );
}
