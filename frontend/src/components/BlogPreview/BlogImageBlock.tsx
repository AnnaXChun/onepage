import { BlockState } from '../../stores/editorStore';

interface BlogImageBlockProps {
  block: BlockState;
  coverImage?: string;
}

export default function BlogImageBlock({ block, coverImage }: BlogImageBlockProps) {
  // Use block content if available, otherwise fall back to coverImage
  const imageUrl = block.content || coverImage;

  if (!imageUrl) {
    return null;
  }

  const aspectRatio = block.config?.aspectRatio || '16/9';
  const isRounded = block.config?.rounded ?? true;

  return (
    <div
      className={`w-full overflow-hidden ${isRounded ? 'rounded-xl' : ''}`}
      style={{ aspectRatio }}
    >
      <img
        src={imageUrl}
        alt=""
        className="w-full h-full object-cover"
      />
    </div>
  );
}
