import { useCallback, useState } from 'react';
import type { DragEndEvent, DragOverEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import { STATUSES, type Candidate, type Status } from '../types/candidate';
import { candidateService } from '../services/candidate.service';
import { useCandidateStore } from '../store/candidateStore';

const asStatus = (value: UniqueIdentifier): Status | null =>
  STATUSES.includes(String(value) as Status) ? (String(value) as Status) : null;

export function useKanbanDrag() {
  const [activeCard, setActiveCard] = useState<Candidate | null>(null);
  const [overColumn, setOverColumn] = useState<Status | null>(null);
  const [overCardId, setOverCardId] = useState<string | null>(null);
  const cached = useCandidateStore((state) => state.cached);
  const moveCandidate = useCandidateStore((state) => state.moveCandidate);

  const getOverColumn = useCallback((over: DragOverEvent['over']): Status | null => {
    if (!over) return null;
    return asStatus(over.id) ?? cached[String(over.id)]?.status ?? asStatus(over.data.current?.sortable?.containerId ?? '');
  }, [cached]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const candidate = cached[String(event.active.id)] ?? null;
    setActiveCard(candidate);
    setOverColumn(candidate?.status ?? null);
  }, [cached]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverColumn(getOverColumn(event.over));
    setOverCardId(event.over && cached[String(event.over.id)] ? String(event.over.id) : null);
  }, [cached, getOverColumn]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const candidate = activeCard;
    const target = getOverColumn(event.over);
    const beforeId = event.over && cached[String(event.over.id)] ? String(event.over.id) : undefined;
    setActiveCard(null);
    setOverColumn(null);
    setOverCardId(null);
    if (!candidate || !target) return;

    moveCandidate(candidate.id, candidate.status, target, beforeId);
    if (candidate.status === target) return;
    try {
      await candidateService.updateCandidateStatus(candidate.id, target);
    } catch {
      moveCandidate(candidate.id, target, candidate.status);
    }
  }, [activeCard, cached, getOverColumn, moveCandidate]);

  const cancelDrag = useCallback(() => {
    setActiveCard(null);
    setOverColumn(null);
    setOverCardId(null);
  }, []);

  return { activeCard, overColumn, overCardId, handleDragStart, handleDragOver, handleDragEnd, cancelDrag };
}
