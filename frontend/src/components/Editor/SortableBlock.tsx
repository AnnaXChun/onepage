import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditorStore, BlockState } from '../../stores/editorStore';
import BlockRenderer from './BlockRenderer';
import DragHandle from './DragHandle';

interface SortableBlockProps {
  block: BlockState;
}

export default function SortableBlock({ block }: SortableBlockProps) {
  const { selectedBlockId, updateBlock, removeBlock, selectBlock } = useEditorStore();
  const isSelected = selectedBlockId === block.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  // Apply smooth transition with ease-out-quart
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? 'transform 200ms var(--ease-out-quart), opacity 200ms var(--ease-out-quart)'
      : 'transform 200ms var(--ease-out-quart), opacity 200ms var(--ease-out-quart)',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const handleContentChange = (content: string) => {
    updateBlock(block.id, { content });
  };

  const handleSelect = () => {
    selectBlock(block.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeBlock(block.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group mb-4 transition-shadow duration-200
        ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
        ${isDragging ? 'shadow-xl scale-[1.02]' : 'hover:shadow-md'}
      `}
      onClick={handleSelect}
    >
      {/* Drag handle - visible when selected OR on hover */}
      <div
        {...attributes}
        {...listeners}
        className={`
          absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center
          transition-all duration-200
          ${isSelected
            ? 'opacity-100 text-primary bg-primary/10 rounded-l-lg'
            : 'opacity-0 group-hover:opacity-100 bg-surface-elevated/50 rounded-l-lg'
          }
          z-10
        `}
      >
        <DragHandle isSelected={isSelected} />
      </div>

      {/* Delete button - top right, visible on hover */}
      <button
        onClick={handleDelete}
        className="absolute right-2 top-2 w-6 h-6 flex items-center justify-center bg-error/80 hover:bg-error text-white rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs z-10"
        title="Delete block"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Block content with left padding for drag handle */}
      <div className="pl-10 pr-10 py-2">
        <BlockRenderer
          block={{ ...block, selector: '', placeholder: '', defaultContent: block.content }}
          content={block.content}
          onContentChange={handleContentChange}
          isSelected={isSelected}
          onSelect={handleSelect}
          confidence={block.confidence}
        />
      </div>
    </div>
  );
}
