import { useSensors, useSensor, PointerSensor, KeyboardSensor, DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useEditorStore } from '../../stores/editorStore';
import SortableBlock from './SortableBlock';

export default function EditorCanvas() {
  const { blocks, reorderBlocks } = useEditorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id);
      const newIndex = blocks.findIndex(b => b.id === over.id);
      reorderBlocks(oldIndex, newIndex);
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-50">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="3" x2="9" y2="21" />
        </svg>
        <p className="text-lg font-medium">No blocks yet</p>
        <p className="text-sm mt-1">Add blocks from the library below</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={blocks.map(b => b.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 p-4">
          {blocks.map(block => (
            <SortableBlock key={block.id} block={block} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
