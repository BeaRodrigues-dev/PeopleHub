import { useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Box, Skeleton, Stack } from "@mui/material";
import type { PipelineStage } from "../../vacancy/types";
import { KanbanColumn } from "./KanbanColumn";
import { DragPreview } from "./DragPreview";
import { useKanbanDrag } from "../hooks/useKanbanDrag";
import { useVacancyApplications } from "../queries";
import { getApplicationCandidate } from "../types";

interface Props {
  vacancyId: string;
  stages: PipelineStage[];
  search: string;
  onOpen: (candidateId: string) => void;
}

/**
 * Board Kanban de una vacante. Buenas prácticas de dnd-kit aplicadas para evitar el
 * travamento/scroll quebrado do protótipo anterior:
 *  - MouseSensor + TouchSensor (com delay) em vez de PointerSensor único —
 *    evita bloquear o scroll da página em touch;
 *  - collisionDetection combinando pointerWithin → closestCenter;
 *  - asa de arrastre aislada en el card (ver CandidateCard);
 *  - colunas memoizadas, cada uma só re-renderiza quando seus próprios dados mudam.
 */
export function KanbanBoard({ vacancyId, stages, search, onOpen }: Props) {
  const { data, isLoading } = useVacancyApplications(vacancyId);
  const applications = useMemo(() => {
    const all = data?.items ?? [];
    if (!search.trim()) return all;
    const q = search.trim().toLowerCase();
    return all.filter((app) => {
      const candidate = getApplicationCandidate(app);
      if (!candidate) return false;
      return candidate.name.toLowerCase().includes(q) || candidate.skills.some((s) => s.toLowerCase().includes(q));
    });
  }, [data, search]);

  const drag = useKanbanDrag(vacancyId, stages, applications);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    return pointerCollisions.length > 0 ? pointerCollisions : closestCenter(args);
  }, []);

  const applicationsByStage = useMemo(() => {
    const map = new Map<string, typeof applications>();
    stages.forEach((stage) => map.set(stage.name, []));
    applications.forEach((app) => {
      const bucket = map.get(app.currentStage);
      if (bucket) bucket.push(app);
      else map.set(app.currentStage, [app]);
    });
    return map;
  }, [applications, stages]);

  if (isLoading) {
    return (
      <Stack direction="row" spacing={1.5}>
        {stages.map((s) => <Skeleton key={s.id} variant="rounded" width={300} height={480} />)}
      </Stack>
    );
  }

  const activeCandidate = drag.activeApplication ? getApplicationCandidate(drag.activeApplication) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={drag.handleDragStart}
      onDragOver={drag.handleDragOver}
      onDragEnd={drag.handleDragEnd}
      onDragCancel={drag.cancelDrag}
    >
      <Box sx={{ display: "flex", gap: 1.5, overflowX: "auto", pb: 1.5, alignItems: "flex-start" }}>
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            applications={applicationsByStage.get(stage.name) ?? []}
            onOpen={onOpen}
            isActiveDrop={drag.overStage === stage.name}
            overApplicationId={drag.overStage === stage.name ? drag.overApplicationId : null}
          />
        ))}
      </Box>
      <DragOverlay adjustScale={false} dropAnimation={{ duration: 200, easing: "cubic-bezier(.2,.8,.25,1)" }}>
        {activeCandidate ? <DragPreview candidate={activeCandidate} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
