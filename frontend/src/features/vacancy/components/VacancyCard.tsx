import { Box, Card, Chip, Stack, Typography } from "@mui/material";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import WorkOutlineRoundedIcon from "@mui/icons-material/WorkOutlineRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { useNavigate } from "react-router-dom";
import type { Vacancy, VacancyStatus } from "../types";

const statusStyle: Record<VacancyStatus, { bg: string; color: string }> = {
  Aberta: { bg: "#e7f7ee", color: "#1c8a54" },
  Pausada: { bg: "#fff4e0", color: "#a8681a" },
  Fechada: { bg: "#f1f1f5", color: "#5a5f72" },
  Rascunho: { bg: "#eef0ff", color: "#5546c9" },
};

export function VacancyCard({ vacancy, candidateCount }: { vacancy: Vacancy; candidateCount?: number }) {
  const navigate = useNavigate();
  const status = statusStyle[vacancy.status];
  return (
    <Card
      onClick={() => navigate(`/vagas/${vacancy.id}`)}
      sx={{
        p: 2.25,
        borderRadius: 3.5,
        cursor: "pointer",
        transition: "box-shadow .16s ease, transform .16s ease, border-color .16s ease",
        "&:hover": { boxShadow: "0 14px 32px rgba(23,26,46,.1)", transform: "translateY(-2px)", borderColor: "primary.light" },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.25 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={800} fontSize={16} sx={{ lineHeight: 1.3 }}>{vacancy.title}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{vacancy.department || "—"}</Typography>
        </Box>
        <Chip label={vacancy.status} size="small" sx={{ bgcolor: status.bg, color: status.color, fontWeight: 750, flexShrink: 0 }} />
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mb: 1.5 }}>
        {vacancy.requiredSkills.slice(0, 4).map((skill) => (
          <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ height: 22, fontSize: 10.5, fontWeight: 600 }} />
        ))}
        {vacancy.requiredSkills.length > 4 && (
          <Chip label={`+${vacancy.requiredSkills.length - 4}`} size="small" variant="outlined" sx={{ height: 22, fontSize: 10.5 }} />
        )}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ color: "text.secondary", pt: 1.25, borderTop: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <PlaceOutlinedIcon sx={{ fontSize: 15 }} />
          <Typography variant="caption" noWrap>{vacancy.location || "—"}</Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <WorkOutlineRoundedIcon sx={{ fontSize: 15 }} />
          <Typography variant="caption">{vacancy.workModel} · {vacancy.seniority || "—"}</Typography>
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.5} alignItems="center">
          <GroupsRoundedIcon sx={{ fontSize: 15 }} />
          <Typography variant="caption" fontWeight={700}>{candidateCount ?? "—"}</Typography>
        </Stack>
      </Stack>
    </Card>
  );
}
