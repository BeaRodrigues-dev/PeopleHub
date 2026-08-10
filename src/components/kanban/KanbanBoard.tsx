import { useMemo } from 'react';
import { closestCorners, DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Box } from '@mui/material';
import { STATUSES } from '../../types/candidate';
import { KanbanColumn } from './KanbanColumn';
import { DragPreview } from './DragPreview';
import { useKanbanDrag } from '../../hooks/useKanbanDrag';

export function KanbanBoard({ onOpen }: { onOpen: (id: string) => void }) {
  const drag = useKanbanDrag();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 7 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const columns = useMemo(() => STATUSES.map((status) => <KanbanColumn key={status} status={status} onOpen={onOpen} isActiveDrop={drag.overColumn === status} overCardId={drag.overColumn === status ? drag.overCardId : null} />), [drag.overCardId, drag.overColumn, onOpen]);
  return <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={drag.handleDragStart} onDragOver={drag.handleDragOver} onDragEnd={drag.handleDragEnd} onDragCancel={drag.cancelDrag}>
    <Box sx={{display:'flex',gap:1.75,overflowX:'auto',pb:1.75,pr:2,alignItems:'flex-start'}}>{columns}</Box>
    <DragOverlay adjustScale dropAnimation={{duration:240,easing:'cubic-bezier(.2,.75,.25,1)'}}>{drag.activeCard ? <DragPreview candidate={drag.activeCard}/> : null}</DragOverlay>
  </DndContext>;
}
