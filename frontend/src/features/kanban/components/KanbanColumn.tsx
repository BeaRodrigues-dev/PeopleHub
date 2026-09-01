import { memo, useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Box, Button, Typography } from "@mui/material";
import type { PipelineStage } from "../../vacancy/types";
import type { Application } from "../types";
import { getApplicationCandidate } from "../types";
import { CandidateCard } from "./CandidateCard";
import { stageColor } from "../../../utils/stageColor";

const PAGE_SIZE = 30;

function DropPlaceholder() {
  return <Box sx={{ height: 74, border: "2px dashed", borderColor: "primary.light", borderRadius: 2.5, bgcolor: "action.hover" }} />;
}

interface Props {
  stage: PipelineStage;
  applications: Application[];
  onOpen: (candidateId: string) => void;
  isActiveDrop: boolean;
  overApplicationId: string | null;
}

export const KanbanColumn = memo(function KanbanColumn({ stage, applications, onOpen, isActiveDrop, overApplicationId }: Props) {
  const { setNodeRef } = useDroppable({ id: stage.name, data: { type: "column", stage: stage.name } });
  const [visible, setVisible] = useState(PAGE_SIZE);
  const color = stageColor(stage.order);
  const shown = applications.slice(0, visible);
  const applicationIds = shown.map((a) => a.id);

  return (
    <Box
      ref={setNodeRef}
      sx={{
        width: 300,
        flex: "0 0 300px",
        height: "calc(100vh - 240px)",
        minHeight: 480,
        bgcolor: isActiveDrop ? "action.hover" : "#f4f5f9",
        border: "1px solid",
        borderColor: isActiveDrop ? "primary.light" : "#E7F1EB",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        transition: "background .15s ease, border-color .15s ease",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 1.75, py: 1.5, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid", borderColor: "divider", flexShrink: 0 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
        <Typography fontWeight={800} fontSize={13.5} sx={{ flex: 1 }} noWrap>{stage.name}</Typography>
        <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ bgcolor: "background.paper", px: 0.9, py: 0.15, borderRadius: 5, border: "1px solid", borderColor: "divider" }}>
          {applications.length}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain", p: 1.5 }}>
        <SortableContext items={applicationIds} strategy={verticalListSortingStrategy}>
          <Box sx={{ display: "grid", gap: 1.1 }}>
            {shown.map((application) => {
              const candidate = getApplicationCandidate(application);
              if (!candidate) return null;
              return (
                <Box key={application.id}>
                  {isActiveDrop && overApplicationId === application.id && <DropPlaceholder />}
                  <CandidateCard applicationId={application.id} candidate={candidate} matchScore={application.matchScore} onOpen={onOpen} />
                </Box>
              );
            })}
          </Box>
        </SortableContext>
        {isActiveDrop && !overApplicationId && applications.length > 0 && (
          <Box sx={{ mt: 1.1 }}>
            <DropPlaceholder />
          </Box>
        )}
        {applications.length === 0 && (
          <Typography variant="caption" textAlign="center" color="text.secondary" sx={{ display: "block", p: 2 }}>
            Ningún candidato en esta etapa
          </Typography>
        )}
        {visible < applications.length && (
          <Button size="small" fullWidth sx={{ mt: 1 }} onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Cargar más ({applications.length - visible})
          </Button>
        )}
      </Box>
    </Box>
  );
});
