import { useState } from "react";
import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import type { ChecklistPhase, OnboardingChecklist } from "../types";

const PHASE_LABEL: Record<ChecklistPhase, string> = { before: "Antes del 1er día", day1: "1er día", week1: "1ª semana" };
const PHASES: ChecklistPhase[] = ["before", "day1", "week1"];

/** Editor de los pasos del checklist de onboarding: agregar, renombrar y eliminar ítems por fase. */
export function OnboardingChecklistEditor({ checklist, onChange }: { checklist: OnboardingChecklist; onChange: (checklist: OnboardingChecklist) => void }) {
  const [drafts, setDrafts] = useState<Record<ChecklistPhase, string>>({ before: "", day1: "", week1: "" });

  const renameItem = (phase: ChecklistPhase, index: number, label: string) => {
    const items = checklist[phase].map((item, i) => (i === index ? { ...item, label } : item));
    onChange({ ...checklist, [phase]: items });
  };

  const removeItem = (phase: ChecklistPhase, index: number) => {
    onChange({ ...checklist, [phase]: checklist[phase].filter((_, i) => i !== index) });
  };

  const addItem = (phase: ChecklistPhase) => {
    const label = drafts[phase].trim();
    if (!label) return;
    onChange({ ...checklist, [phase]: [...checklist[phase], { label, done: false }] });
    setDrafts((d) => ({ ...d, [phase]: "" }));
  };

  return (
    <Stack spacing={1.5}>
      {PHASES.map((phase) => (
        <Box key={phase} sx={{ bgcolor: "#F1F7F2", borderRadius: 2.5, p: 1.5 }}>
          <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ textTransform: "uppercase" }}>
            {PHASE_LABEL[phase]}
          </Typography>
          <Stack spacing={0.75} sx={{ mt: 1 }}>
            {checklist[phase].map((item, i) => (
              <Stack key={i} direction="row" alignItems="center" spacing={0.75}>
                <TextField
                  value={item.label}
                  onChange={(e) => renameItem(phase, i, e.target.value)}
                  size="small"
                  variant="standard"
                  fullWidth
                  slotProps={{ input: { disableUnderline: true, sx: { bgcolor: "#fff", borderRadius: 1.5, px: 1, py: 0.4, fontSize: 13.5 } } }}
                />
                <IconButton size="small" onClick={() => removeItem(phase, i)}>
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            {checklist[phase].length === 0 && (
              <Typography variant="caption" color="text.secondary" fontStyle="italic">Ningún paso todavía.</Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Agregar paso…"
              value={drafts[phase]}
              onChange={(e) => setDrafts((d) => ({ ...d, [phase]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(phase))}
              sx={{ bgcolor: "#fff", borderRadius: 1.5 }}
            />
            <Button size="small" variant="outlined" startIcon={<AddRoundedIcon fontSize="small" />} onClick={() => addItem(phase)} sx={{ flexShrink: 0 }}>
              Agregar
            </Button>
          </Stack>
        </Box>
      ))}
    </Stack>
  );
}
