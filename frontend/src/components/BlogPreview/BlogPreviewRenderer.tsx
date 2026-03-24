import { BlockState } from '../../stores/editorStore';
import BlogTextBlock from './BlogTextBlock';
import BlogImageBlock from './BlogImageBlock';
import BlogDividerBlock from './BlogDividerBlock';

interface BlogPreviewRendererProps {
  blocks: BlockState[];
  coverImage?: string;
}

export default function BlogPreviewRenderer({ blocks, coverImage }: BlogPreviewRendererProps) {
  if (!blocks || blocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {blocks.map((block) => {
        switch (block.type) {
          case 'text-h1':
          case 'text-h2':
          case 'text-paragraph':
          case 'text-list':
            return (
              <BlogTextBlock
                key={block.id}
                block={block}
              />
            );
          case 'image-single':
          case 'image-gallery':
            return (
              <BlogImageBlock
                key={block.id}
                block={block}
                coverImage={coverImage}
              />
            );
          case 'divider':
            return (
              <BlogDividerBlock
                key={block.id}
                block={block}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
