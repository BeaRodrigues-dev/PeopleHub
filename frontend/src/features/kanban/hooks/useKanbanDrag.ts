import { useCallback, useMemo, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";
import type { PipelineStage } from "../../vacancy/types";
import type { Application } from "../types";
import { useMoveApplicationStage } from "../queries";

/**
 * Drag and drop do Kanban de uma vaga. Cada coluna é identificada pelo nome
 * da etapa (currentStage). Usa mutation com atualização otimista (ver
 * useMoveApplicationStage) — a UI reordena/move o card antes da confirmação
 * do servidor, e reverte automaticamente em caso de erro.
 */
export function useKanbanDrag(vacancyId: string, stages: PipelineStage[], applications: Application[]) {
  const stageNames = useMemo(() => new Set(stages.map((s) => s.name)), [stages]);
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [overApplicationId, setOverApplicationId] = useState<string | null>(null);
  const moveStage = useMoveApplicationStage(vacancyId);

  const byId = useMemo(() => Object.fromEntries(applications.map((a) => [a.id, a])), [applications]);

  const resolveStage = useCallback(
    (over: DragOverEvent["over"]): string | null => {
      if (!over) return null;
      const overId = String(over.id);
      if (stageNames.has(overId)) return overId;
      const overApp = byId[overId];
      return overApp && stageNames.has(overApp.currentStage) ? overApp.currentStage : null;
    },
    [byId, stageNames],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const app = byId[String(event.active.id)] ?? null;
      setActiveApplication(app);
      setOverStage(app?.currentStage ?? null);
    },
    [byId],
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      setOverStage(resolveStage(event.over));
      const overId = event.over ? String(event.over.id) : null;
      setOverApplicationId(overId && byId[overId] ? overId : null);
    },
    [byId, resolveStage],
  );

  const reset = useCallback(() => {
    setActiveApplication(null);
    setOverStage(null);
    setOverApplicationId(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const application = activeApplication;
      const target = resolveStage(event.over);
      reset();
      if (!application || !target || application.currentStage === target) return;
      moveStage.mutate({ applicationId: application.id, stage: target });
    },
    [activeApplication, moveStage, resolveStage, reset],
  );

  return {
    activeApplication,
    overStage,
    overApplicationId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    cancelDrag: reset,
  };
}
