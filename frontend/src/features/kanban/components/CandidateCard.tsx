import { memo, useMemo } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { Avatar, Box, Card, Chip, Stack, Typography } from "@mui/material";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import type { Candidate } from "../../candidate/types";

const relativeDate = (date: string) => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000));
  return days === 0 ? "hoy" : days === 1 ? "hace 1 día" : `hace ${days} días`;
};

interface Props {
  applicationId: string;
  candidate: Candidate;
  matchScore?: number | null;
  onOpen: (candidateId: string) => void;
}

/**
 * Card del Kanban. El listener de drag queda aislado en el ícono "grip" (no en
 * el card entero) — evita que dnd-kit capture clics en texto/links dentro
 * del card y permite hacer scroll normalmente al tocar cualquier área que no sea
 * el asa de arrastre.
 */
export const CandidateCard = memo(function CandidateCard({ applicationId, candidate, matchScore, onOpen }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: applicationId });
  const style = useMemo(
    () => ({ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }),
    [transform, transition, isDragging],
  );

  return (
    <Card
      ref={setNodeRef}
      style={style}
      onClick={() => onOpen(candidate.id)}
      sx={{
        p: 1.75,
        borderRadius: 3,
        cursor: "pointer",
        bgcolor: "background.paper",
        transition: "box-shadow .16s ease, border-color .16s ease, transform .16s ease",
        "&:hover": { boxShadow: "0 10px 24px rgba(23,26,46,.1)", borderColor: "primary.light", transform: "translateY(-1px)" },
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Avatar src={candidate.avatar ?? undefined} sx={{ width: 40, height: 40, fontSize: 15, fontWeight: 700 }}>
          {candidate.name[0]}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography noWrap fontWeight={750} fontSize={14}>{candidate.name}</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.25, color: "text.secondary" }}>
            <LocationOnOutlinedIcon sx={{ fontSize: 13 }} />
            <Typography noWrap variant="caption">{candidate.location || "Ubicación no informada"}</Typography>
          </Stack>
        </Box>
        <Box
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Arrastrar ${candidate.name}`}
          sx={{
            touchAction: "none",
            cursor: "grab",
            color: "action.disabled",
            display: "grid",
            placeItems: "center",
            width: 22,
            height: 28,
            borderRadius: 1,
            flexShrink: 0,
            "&:hover": { color: "text.secondary", bgcolor: "action.hover" },
            "&:active": { cursor: "grabbing" },
          }}
        >
          <DragIndicatorRoundedIcon fontSize="small" />
        </Box>
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mt: 1.35 }}>
        {candidate.skills.slice(0, 3).map((skill) => (
          <Chip key={skill} label={skill} size="small" variant="outlined" sx={{ height: 21, fontSize: 10.5, fontWeight: 600 }} />
        ))}
      </Stack>

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.35, pt: 1.1, borderTop: "1px solid", borderColor: "divider" }}>
        {typeof matchScore === "number" ? (
          <Chip
            label={`${matchScore}% match`}
            size="small"
            sx={{ height: 20, fontSize: 10.5, fontWeight: 750, bgcolor: matchScore >= 70 ? "#E7F3ED" : matchScore >= 40 ? "#F7ECDC" : "#F7E3E8", color: matchScore >= 70 ? "#4C9B7C" : matchScore >= 40 ? "#BF8A46" : "#C4677E" }}
          />
        ) : (
          <span />
        )}
        <Typography variant="caption" color="text.secondary">Actualizado {relativeDate(candidate.updatedAt)}</Typography>
      </Stack>
    </Card>
  );
});
