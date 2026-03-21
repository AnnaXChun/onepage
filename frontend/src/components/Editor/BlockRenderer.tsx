import { BlockDefinition } from '../../types/block';
import TextBlock from './blocks/TextBlock';
import ImageBlock from './blocks/ImageBlock';
import SocialLinksBlock from './blocks/SocialLinksBlock';
import ContactFormBlock from './blocks/ContactFormBlock';
import DividerBlock from './blocks/DividerBlock';

interface BlockRendererProps {
  block: BlockDefinition;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
  onSelect: () => void;
  confidence?: number;
}

export default function BlockRenderer({
  block,
  content,
  onContentChange,
  isSelected,
  onSelect,
  confidence,
}: BlockRendererProps) {
  // Don't render hidden blocks
  if (block.config?.visible === false) {
    return null;
  }

  const commonProps = {
    block,
    content,
    onContentChange,
    isSelected,
    onSelect,
    confidence,
  };

  switch (block.type) {
    case 'text-h1':
    case 'text-h2':
    case 'text-paragraph':
    case 'text-list':
      return <TextBlock {...commonProps} />;
    case 'image-single':
    case 'image-gallery':
      return <ImageBlock {...commonProps} />;
    case 'social-links':
      return <SocialLinksBlock {...commonProps} />;
    case 'contact-form':
      return <ContactFormBlock {...commonProps} />;
    case 'divider':
      return <DividerBlock {...commonProps} />;
    default:
      return (
        <div className="p-4 rounded-lg bg-surface border border-border">
          <p className="text-text-muted text-sm">
            Unknown block type: <code className="px-1 py-0.5 bg-surface-elevated rounded">{block.type}</code>
          </p>
        </div>
      );
  }
}
