import { CSSProperties } from 'react';

export default function DragHandle() {
  return (
    <div
      className="drag-handle cursor-grab active:cursor-grabbing p-1 text-text-muted hover:text-text-primary transition-colors"
      style={{ touchAction: 'none' } as CSSProperties}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
      </svg>
    </div>
  );
}
