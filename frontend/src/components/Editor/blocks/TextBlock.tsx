import { useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore } from '../../../stores/editorStore';
import { BlockDefinition } from '../../../types/block';
import AIWriteModal from '../AIWriteModal';
import FloatingToolbar from '../FloatingToolbar';

interface TextBlockProps {
  block: BlockDefinition;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
  onSelect: () => void;
  confidence?: number;
}

const textTypeToTag: Record<string, string> = {
  'text-h1': 'h1',
  'text-h2': 'h2',
  'text-paragraph': 'p',
  'text-list': 'ul',
};

export default function TextBlock({
  block,
  content,
  onContentChange,
  isSelected,
  onSelect,
  confidence,
}: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [localValue, setLocalValue] = useState(content || block.defaultContent);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const { updateBlock } = useEditorStore();
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    setLocalValue(content || block.defaultContent);
  }, [content, block.defaultContent]);

  // Detect text selection and show floating toolbar
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && selection.toString().trim()) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        // Only show if selection is within our container
        if (containerRef.current?.contains(range.startContainer)) {
          setToolbarPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
          });
          // Detect active formats
          const formats = new Set<string>();
          if (document.querySelector('.vibe-text-bold')) formats.add('bold');
          if (document.querySelector('.vibe-text-italic')) formats.add('italic');
          if (document.querySelector('.vibe-text-underline')) formats.add('underline');
          if (document.querySelector('.vibe-text-link')) formats.add('link');
          setActiveFormats(formats);
        }
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Click outside to dismiss toolbar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolbarPosition && containerRef.current) {
        const target = e.target as Node;
        const isInsideToolbar = containerRef.current?.querySelector('.floating-toolbar')?.contains(target);
        const selection = window.getSelection();
        const hasSelection = selection && selection.toString().length > 0;
        if (!isInsideToolbar && !hasSelection) {
          setToolbarPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [toolbarPosition]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    if (!isEditingRef.current) {
      setIsEditing(true);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (isEditingRef.current) {
        setIsEditing(false);
        if (localValue !== content) {
          onContentChange(localValue);
          updateBlock(block.id, { content: localValue });
        }
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setLocalValue(content || block.defaultContent);
      setIsEditing(false);
      containerRef.current?.blur();
    }
    if (e.key === 'Enter' && (block.type === 'text-h1' || block.type === 'text-h2')) {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleInput = (e: React.FormEvent) => {
    const target = e.currentTarget;
    setLocalValue(target.textContent || '');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleFormat = useCallback((format: 'bold' | 'italic' | 'underline' | 'link') => {
    console.log('[TextBlock] format:', format);
    // Will be wired to Lexical in Phase 29
  }, []);

  const handleLinkClick = useCallback(() => {
    console.log('[TextBlock] link click');
    // Will be implemented in Phase 30 - Link Support
  }, []);

  const Tag = textTypeToTag[block.type] || 'p';
  const isHeading = block.type === 'text-h1' || block.type === 'text-h2';
  const isList = block.type === 'text-list';
  const isLowConfidence = confidence !== undefined && confidence < 0.7;

  const alignmentClass = {
    'left': 'text-left',
    'center': 'text-center',
    'right': 'text-right',
  }[block.config?.align || 'left'];

  const containerStyle: React.CSSProperties = {
    backgroundColor: block.config?.backgroundColor,
    color: block.config?.textColor,
    display: block.config?.visible === false ? 'none' : 'block',
  };

  const containerClass = `
    relative p-4 rounded-lg transition-all duration-200 group
    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'}
    ${isLowConfidence ? 'ring-2 ring-amber-400/50' : ''}
  `.trim().replace(/\s+/g, ' ');

  const renderListContent = () => {
    const items = localValue.split('\n').filter(item => item.trim());
    if (items.length === 0) {
      return <p className="text-text-muted italic">{block.placeholder}</p>;
    }
    return (
      <ul className="list-disc list-inside space-y-1 text-text-primary">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  };

  const renderEditableContent = () => {
    if (isList) {
      return renderListContent();
    }

    if (!localValue && !isEditing) {
      return <p className="text-text-muted italic">{block.placeholder}</p>;
    }

    return (
      <Tag
        contentEditable={isEditing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={handlePaste}
        className={`
          ${isHeading ? 'font-bold tracking-tight' : ''}
          cursor-text outline-none transition-all duration-200
          ${isSelected ? '' : 'hover:bg-primary/5'}
          ${!localValue && !isEditing ? 'text-text-muted' : 'text-text-primary'}
        `.trim().replace(/\s+/g, ' ')}
      >
        {localValue}
      </Tag>
    );
  };

  const aiButton = (
    <button
      onClick={(e) => { e.stopPropagation(); setShowAIModal(true); }}
      className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-secondary hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
      title="AI Write Assist"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    </button>
  );

  return (
    <>
      <div
        ref={containerRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={`${containerClass} ${alignmentClass}`}
        style={containerStyle}
        title={isLowConfidence ? 'This content was generated with low confidence' : undefined}
      >
        {aiButton}
        {renderEditableContent()}
      </div>
      <FloatingToolbar
        editorRef={containerRef}
        onFormat={handleFormat}
        activeFormats={activeFormats}
        onLinkClick={handleLinkClick}
        position={toolbarPosition}
      />
      <AIWriteModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        blockId={block.id}
        currentText={localValue}
        onApply={(newText) => {
          setLocalValue(newText);
          onContentChange(newText);
          updateBlock(block.id, { content: newText });
        }}
      />
    </>
  );
}
