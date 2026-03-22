import { CSSProperties } from 'react';

interface DragHandleProps {
  isSelected?: boolean;
}

export default function DragHandle({ isSelected }: DragHandleProps) {
  return (
    <div
      className={`
        cursor-grab active:cursor-grabbing p-1 transition-all duration-200
        ${isSelected
          ? 'text-primary bg-primary/10 rounded'
          : 'text-text-muted hover:text-primary hover:bg-primary/5 rounded'
        }
      `}
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
