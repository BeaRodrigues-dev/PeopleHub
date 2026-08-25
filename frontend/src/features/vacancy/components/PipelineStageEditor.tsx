import { useState } from "react";
import { Box, Chip, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import { stageColor } from "../../../utils/stageColor";

export interface DraftStage { id: string; name: string; }

/** Editor de etapas do pipeline da vaga: adicionar, remover e reordenar. */
export function PipelineStageEditor({ stages, onChange }: { stages: DraftStage[]; onChange: (stages: DraftStage[]) => void }) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    onChange([...stages, { id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name }]);
    setDraft("");
  };
  const remove = (id: string) => onChange(stages.filter((s) => s.id !== id));
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= stages.length) return;
    const next = [...stages];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };
  const rename = (id: string, name: string) => onChange(stages.map((s) => (s.id === id ? { ...s, name } : s)));

  return (
    <Box>
      <Stack spacing={1}>
        {stages.map((stage, index) => (
          <Stack key={stage.id} direction="row" spacing={1} alignItems="center" sx={{ p: 1, borderRadius: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: stageColor(index), flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" sx={{ width: 18, textAlign: "center", flexShrink: 0 }}>{index + 1}</Typography>
            <TextField
              value={stage.name}
              onChange={(e) => rename(stage.id, e.target.value)}
              size="small"
              variant="standard"
              fullWidth
              slotProps={{ input: { disableUnderline: true } }}
            />
            <IconButton size="small" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUpwardRoundedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => move(index, 1)} disabled={index === stages.length - 1}><ArrowDownwardRoundedIcon fontSize="small" /></IconButton>
            <IconButton size="small" onClick={() => remove(stage.id)} disabled={stages.length <= 1}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Nova etapa (ex.: Entrevista Técnica)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
        />
        <Chip icon={<AddRoundedIcon fontSize="small" />} label="Adicionar etapa" clickable onClick={add} sx={{ fontWeight: 650, flexShrink: 0 }} />
      </Stack>
    </Box>
  );
}
