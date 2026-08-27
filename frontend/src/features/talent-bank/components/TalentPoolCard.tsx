import { useState } from "react";
import { Avatar, Box, Button, Card, Chip, Menu, MenuItem, Stack, Typography } from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import type { Candidate } from "../../candidate/types";
import type { Vacancy } from "../../vacancy/types";

export function TalentPoolCard({
  candidate,
  vacancies,
  onOpen,
  onAssign,
}: {
  candidate: Candidate;
  vacancies: Vacancy[];
  onOpen: (id: string) => void;
  onAssign: (candidateId: string, vacancy: Vacancy) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <Card sx={{ p: 2, borderRadius: 3.5, transition: "box-shadow .16s ease, transform .16s ease", "&:hover": { boxShadow: "0 12px 28px rgba(23,26,46,.1)", transform: "translateY(-1px)" } }}>
      <Stack direction="row" spacing={1.35} alignItems="flex-start" onClick={() => onOpen(candidate.id)} sx={{ cursor: "pointer" }}>
        <Avatar src={candidate.avatar ?? undefined} sx={{ width: 46, height: 46 }}>{candidate.name[0]}</Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap fontWeight={750} fontSize={14.5}>{candidate.name}</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
            <LocationOnOutlinedIcon sx={{ fontSize: 13 }} />
            <Typography noWrap variant="caption">{candidate.location || "Ubicación no informada"}</Typography>
          </Stack>
        </Box>
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 1.35 }}>
        {candidate.skills.slice(0, 4).map((skill) => (
          <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ height: 21, fontSize: 10.5, fontWeight: 600 }} />
        ))}
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.1, display: "block" }}>{candidate.seniority || "Nivel de experiencia no informado"}</Typography>
      <Button fullWidth size="small" variant="outlined" startIcon={<PersonAddAltRoundedIcon fontSize="small" />} onClick={(e) => setAnchor(e.currentTarget)} sx={{ mt: 1.35 }}>
        Asignar a vacante
      </Button>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
        {vacancies.length === 0 && <MenuItem disabled>Ninguna vacante abierta</MenuItem>}
        {vacancies.map((vacancy) => (
          <MenuItem key={vacancy.id} onClick={() => { setAnchor(null); onAssign(candidate.id, vacancy); }}>{vacancy.title}</MenuItem>
        ))}
      </Menu>
    </Card>
  );
}
