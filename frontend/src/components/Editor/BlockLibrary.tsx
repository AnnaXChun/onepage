import { useState } from 'react';
import { useEditorStore, BlockState } from '../../stores/editorStore';
import { BlockType } from '../../types/block';

const BLOCK_TYPES: { type: BlockType; label: string; icon: string }[] = [
  { type: 'text-h1', label: 'Heading 1', icon: 'H1' },
  { type: 'text-h2', label: 'Heading 2', icon: 'H2' },
  { type: 'text-paragraph', label: 'Paragraph', icon: 'P' },
  { type: 'text-list', label: 'List', icon: 'UL' },
  { type: 'image-single', label: 'Image', icon: 'IMG' },
  { type: 'image-gallery', label: 'Gallery', icon: 'GL' },
  { type: 'social-links', label: 'Social Links', icon: 'SL' },
  { type: 'contact-form', label: 'Contact Form', icon: 'CF' },
  { type: 'divider', label: 'Divider', icon: 'HR' },
];

function generateId() {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function BlockLibrary() {
  const [isOpen, setIsOpen] = useState(false);
  const { addBlock } = useEditorStore();

  const handleAddBlock = (type: BlockType) => {
    const newBlock: BlockState = {
      id: generateId(),
      type,
      content: '',
      config: {},
    };
    addBlock(newBlock);
    setIsOpen(false);
  };

  return (
    <div className="p-4 border-t border-border bg-surface">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3 px-4 bg-primary hover:bg-primaryhover text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        {isOpen ? 'Close Block Library' : 'Add Block'}
      </button>

      {isOpen && (
        <div className="mt-4 grid grid-cols-3 gap-2 animate-slide-up">
          {BLOCK_TYPES.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => handleAddBlock(type)}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border bg-surface-elevated hover:bg-primary/10 hover:border-primary transition-all text-sm"
            >
              <span className="font-bold text-xs bg-surface px-2 py-1 rounded border border-border">{icon}</span>
              <span className="text-text-primary font-medium">{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
