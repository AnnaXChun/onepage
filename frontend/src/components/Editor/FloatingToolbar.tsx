import { useState, useEffect, useCallback, useRef } from 'react';

export interface FloatingToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
  onFormat: (format: 'bold' | 'italic' | 'underline' | 'link') => void;
  activeFormats: Set<string>;
  onLinkClick: () => void;
  position: { x: number; y: number } | null;
}

/**
 * FloatingToolbar - appears when text is selected in a text block.
 * Shows Bold, Italic, Underline, and Link buttons with active state indicators.
 */
export default function FloatingToolbar({
  editorRef,
  onFormat,
  activeFormats,
  onLinkClick,
  position,
}: FloatingToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Sync visibility with position prop
  useEffect(() => {
    setVisible(position !== null);
  }, [position]);

  // Handle mouseup on the editor container to detect text selection
  useEffect(() => {
    const container = editorRef.current;
    if (!container) return;

    const handleMouseUp = () => {
      // Selection detection is handled by TextBlock, we just need to keep toolbar visible
      // when there's an active selection within our bounds
    };

    container.addEventListener('mouseup', handleMouseUp);
    return () => container.removeEventListener('mouseup', handleMouseUp);
  }, [editorRef]);

  // Position calculations
  const getPositionStyle = useCallback((): React.CSSProperties => {
    if (!position) return { display: 'none' };

    return {
      position: 'fixed',
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: 'translate(-50%, -100%) translateY(-8px)',
    };
  }, [position]);

  if (!visible || !position) return null;

  return (
    <div
      ref={toolbarRef}
      className="floating-toolbar flex items-center gap-0.5 px-1.5 py-1.5 rounded-xl shadow-lg border z-50"
      style={{
        ...getPositionStyle(),
        backgroundColor: 'var(--color-surface-elevated)',
        borderColor: 'var(--color-border)',
        animation: 'floatToolbarIn 150ms var(--ease-out-quart) forwards',
      }}
    >
      <ToolbarButton
        format="bold"
        active={activeFormats.has('bold')}
        onClick={() => onFormat('bold')}
      />
      <ToolbarButton
        format="italic"
        active={activeFormats.has('italic')}
        onClick={() => onFormat('italic')}
      />
      <ToolbarButton
        format="underline"
        active={activeFormats.has('underline')}
        onClick={() => onFormat('underline')}
      />
      <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
      <ToolbarButton
        format="link"
        active={activeFormats.has('link')}
        onClick={onLinkClick}
        isLink
      />
    </div>
  );
}

interface ToolbarButtonProps {
  format: string;
  active: boolean;
  onClick: () => void;
  isLink?: boolean;
}

function ToolbarButton({ format, active, onClick, isLink }: ToolbarButtonProps) {
  const getLabel = () => {
    switch (format) {
      case 'bold': return 'B';
      case 'italic': return 'I';
      case 'underline': return 'U';
      case 'link': return null;
      default: return format[0].toUpperCase();
    }
  };

  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontWeight: 700,
      fontSize: '13px',
      transition: 'all 150ms var(--ease-out-quart)',
    };

    if (active) {
      return {
        ...base,
        backgroundColor: 'var(--color-primary)',
        color: '#ffffff',
      };
    }

    return {
      ...base,
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    };
  };

  if (isLink) {
    return (
      <button
        onClick={onClick}
        style={getStyles()}
        title="Add Link (Ctrl+K)"
        aria-label="Add Link"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </button>
    );
  }

  const label = getLabel();
  const inlineStyles: React.CSSProperties = {};

  if (format === 'italic') {
    inlineStyles.fontStyle = 'italic';
  }
  if (format === 'underline') {
    inlineStyles.textDecoration = 'underline';
  }

  return (
    <button
      onClick={onClick}
      style={{ ...getStyles(), ...inlineStyles }}
      title={format.charAt(0).toUpperCase() + format.slice(1)}
      aria-label={format}
    >
      {label}
    </button>
  );
}
