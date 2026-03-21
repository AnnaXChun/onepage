import { useState, useRef, useEffect } from 'react';
import { BlockDefinition, BlockType } from '../../../types/block';

interface TextBlockProps {
  block: BlockDefinition;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
  onSelect: () => void;
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
}: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
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
    // Prevent Enter for headings
    if (e.key === 'Enter' && (block.type === 'text-h1' || block.type === 'text-h2')) {
      e.preventDefault();
      elementRef.current?.blur();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLHeadingElement | HTMLParagraphElement | HTMLUListElement>) => {
    const text = e.currentTarget.textContent || '';
    // Strip newlines for headings
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

  const baseClasses = `
    cursor-text outline-none transition-all duration-200
    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'}
    ${!localValue && !isEditing ? 'text-text-muted' : 'text-text-primary'}
  `.trim().replace(/\s+/g, ' ');

  const headingClasses = isHeading ? 'font-bold tracking-tight' : '';
  const listClasses = isList ? 'list-disc list-inside space-y-1' : '';

  const renderContent = () => {
    if (isList) {
      const items = localValue.split('\n').filter(item => item.trim());
      return (
        <ul className={`${headingClasses} ${listClasses}`}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }

    return (
      <Tag
        ref={elementRef as React.RefObject<HTMLHeadingElement & HTMLParagraphElement>}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={handlePaste}
        className={baseClasses}
        data-placeholder={block.placeholder}
      >
        {localValue}
      </Tag>
    );
  };

  if (isList) {
    return (
      <div
        onClick={handleClick}
        className={`
          relative p-4 rounded-lg transition-all duration-200
          ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'}
        `}
      >
        {localValue ? (
          <ul className={`${headingClasses} ${listClasses} text-text-primary`}>
            {localValue.split('\n').filter(item => item.trim()).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-text-muted italic">{block.placeholder}</p>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-lg transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'}
      `}
    >
      {localValue ? (
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
      )}
    </div>
  );
}
