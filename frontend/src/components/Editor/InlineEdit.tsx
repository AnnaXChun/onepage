import { useState, useRef, useEffect } from 'react';
import { BlockType } from '../../types/block';

interface InlineEditProps {
  value: string;
  onChange: (value: string) => void;
  blockType: 'text-h1' | 'text-h2' | 'text-paragraph' | 'text-list';
  placeholder?: string;
  className?: string;
}

export default function InlineEdit({
  value,
  onChange,
  blockType,
  placeholder = 'Type here...',
  className = '',
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && spanRef.current) {
      spanRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      range.selectNodeContents(spanRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditing]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setLocalValue(value); // Revert
      setIsEditing(false);
    }
    // Prevent Enter for H1/H2
    if (e.key === 'Enter' && (blockType === 'text-h1' || blockType === 'text-h2')) {
      e.preventDefault();
      spanRef.current?.blur();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLSpanElement>) => {
    const text = e.currentTarget.textContent || '';
    // Strip newlines for headings
    if (blockType === 'text-h1' || blockType === 'text-h2') {
      e.currentTarget.textContent = text.replace(/\n/g, '');
    }
    setLocalValue(e.currentTarget.textContent || '');
  };

  const handlePaste = (e: ClipboardEvent) => {
    // Strip HTML from pasted content
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const Tag = blockType === 'text-h1' ? 'h1' : blockType === 'text-h2' ? 'h2' : blockType === 'text-paragraph' ? 'p' : 'div';

  return (
    <Tag
      ref={spanRef as React.RefObject<HTMLHeadingElement & HTMLParagraphElement & HTMLDivElement>}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onClick={handleClick}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      onPaste={handlePaste}
      className={`outline-none cursor-text ${
        isEditing ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'
      } ${!localValue && !isEditing ? 'text-text-muted' : 'text-text-primary'} ${className}`}
      data-placeholder={placeholder}
    >
      {localValue}
    </Tag>
  );
}
