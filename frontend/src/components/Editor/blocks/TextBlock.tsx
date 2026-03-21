import { useState, useRef, useEffect } from 'react';
import { BlockDefinition, BlockType } from '../../../types/block';
import AIWriteModal from '../AIWriteModal';

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
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setLocalValue(content || block.defaultContent);
  }, [content, block.defaultContent]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    if (!isEditing) {
      setIsEditing(true);
      setTimeout(() => elementRef.current?.focus(), 0);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== content) {
      onContentChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalValue(content || block.defaultContent);
      setIsEditing(false);
      elementRef.current?.blur();
    }
    if (e.key === 'Enter' && (block.type === 'text-h1' || block.type === 'text-h2')) {
      e.preventDefault();
      elementRef.current?.blur();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLHeadingElement | HTMLParagraphElement | HTMLUListElement>) => {
    const text = e.currentTarget.textContent || '';
    if (block.type === 'text-h1' || block.type === 'text-h2') {
      e.currentTarget.textContent = text.replace(/\n/g, '');
    }
    setLocalValue(e.currentTarget.textContent || '');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const Tag = textTypeToTag[block.type] || 'p';
  const isHeading = block.type === 'text-h1' || block.type === 'text-h2';
  const isList = block.type === 'text-list';
  const isLowConfidence = confidence !== undefined && confidence < 0.7;

  const baseClasses = `
    cursor-text outline-none transition-all duration-200
    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'}
    ${!localValue && !isEditing ? 'text-text-muted' : 'text-text-primary'}
  `.trim().replace(/\s+/g, ' ');

  const headingClasses = isHeading ? 'font-bold tracking-tight' : '';
  const listClasses = isList ? 'list-disc list-inside space-y-1' : '';

  const renderContent = () => {
    if (isList) {
      return localValue ? (
        <ul className={`${headingClasses} ${listClasses} text-text-primary`}>
          {localValue.split('\n').filter(item => item.trim()).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-text-muted italic">{block.placeholder}</p>
      );
    }
    return localValue ? (
      <Tag
        ref={elementRef as React.RefObject<HTMLHeadingElement & HTMLParagraphElement>}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={handlePaste}
        className={`${headingClasses} ${baseClasses}`}
      >
        {localValue}
      </Tag>
    ) : (
      <p className={`${headingClasses} text-text-muted italic`}>{block.placeholder}</p>
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

  const containerClass = `
    relative p-4 rounded-lg transition-all duration-200 group
    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'}
    ${isLowConfidence ? 'ring-2 ring-amber-400/50' : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <>
      <div
        onClick={handleClick}
        className={containerClass}
        title={isLowConfidence ? 'This content was generated with low confidence' : undefined}
      >
        {aiButton}
        {renderContent()}
      </div>
      <AIWriteModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        blockId={block.id}
        currentText={localValue}
        onApply={(newText) => {
          setLocalValue(newText);
          onContentChange(newText);
        }}
      />
    </>
  );
}
