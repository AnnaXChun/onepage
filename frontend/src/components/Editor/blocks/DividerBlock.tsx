import { BlockDefinition } from '../../../types/block';

interface DividerBlockProps {
  block: BlockDefinition;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

export default function DividerBlock({
  block,
  content,
  isSelected,
  onSelect,
}: DividerBlockProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const containerClasses = `
    relative py-4 transition-all duration-200
    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded' : ''}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div
      className={containerClasses}
      onClick={handleClick}
    >
      <hr
        className="
          border-0 h-px bg-gradient-to-r
          from-transparent via-border to-transparent
        "
      />
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="px-2 py-1 text-xs text-primary bg-background rounded">
            Divider
          </span>
        </div>
      )}
    </div>
  );
}
