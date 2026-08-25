import { useState } from "react";
import { Box, Chip, TextField } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

/** Editor de tags reutilizável para "competências" (vaga ou candidato). */
export function SkillsEditor({
  skills,
  onChange,
  placeholder = "Adicionar competência e pressionar Enter",
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const value = draft.trim();
    if (value && !skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      onChange([...skills, value]);
    }
    setDraft("");
  };

  const remove = (skill: string) => onChange(skills.filter((s) => s !== skill));

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: skills.length ? 1.25 : 0 }}>
        {skills.map((skill) => (
          <Chip key={skill} label={skill} onDelete={() => remove(skill)} size="small" sx={{ fontWeight: 650 }} />
        ))}
      </Box>
      <TextField
        fullWidth
        size="small"
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        slotProps={{
          input: {
            endAdornment: (
              <Chip
                icon={<AddRoundedIcon fontSize="small" />}
                label="Adicionar"
                size="small"
                onClick={commit}
                clickable
                sx={{ fontWeight: 650 }}
              />
            ),
          },
        }}
      />
    </Box>
  );
}
