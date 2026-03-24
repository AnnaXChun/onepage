import { useRef, useState } from 'react';
import { BlockDefinition } from '../../../types/block';
import { uploadImage } from '../../../services/api';
import { useEditorStore } from '../../../stores/editorStore';

interface ImageBlockProps {
  block: BlockDefinition;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

export default function ImageBlock({
  block,
  content,
  onContentChange,
  isSelected,
  onSelect,
}: ImageBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { updateBlock } = useEditorStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadImage(file);
      if (response.code === 200 && response.data?.url) {
        onContentChange(response.data.url);
        updateBlock(block.id, { content: response.data.url });
      } else {
        console.error('Upload failed:', response.message);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const aspectRatio = block.config?.aspectRatio || '16/9';
  const isRounded = block.config?.rounded ?? false;
  const isGallery = block.type === 'image-gallery';

  let galleryImages: string[] = [];
  if (isGallery && content) {
    try {
      galleryImages = JSON.parse(content);
    } catch {
      galleryImages = content ? [content] : [];
    }
  }

  const containerClasses = `
    relative group cursor-pointer overflow-hidden
    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
    ${isRounded ? 'rounded-xl' : 'rounded-none'}
  `.trim().replace(/\s+/g, ' ');

  const imageClasses = `
    w-full h-full object-cover transition-all duration-300
    group-hover:scale-[1.02]
  `.trim().replace(/\s+/g, ' ');

  if (!isGallery) {
    return (
      <div
        className={containerClasses}
        style={{ aspectRatio }}
        onClick={handleClick}
      >
        {content ? (
          <img
            src={content}
            alt=""
            className={imageClasses}
            onClick={handleImageClick}
          />
        ) : (
          <div
            className="
              w-full h-full flex flex-col items-center justify-center
              bg-surface border-2 border-dashed border-border
              text-text-muted hover:border-primary transition-colors duration-200
            "
            onClick={handleImageClick}
          >
            {isUploading ? (
              <>
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
                <span className="text-sm">Uploading...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-12 h-12 mb-2 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm">{block.placeholder || 'Click to upload image'}</span>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div className={containerClasses} onClick={handleClick}>
      {galleryImages.length > 0 ? (
        <div
          className="grid gap-2"
          style={{ aspectRatio }}
        >
          {galleryImages.map((img, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                if (!isUploading) {
                  fileInputRef.current?.click();
                }
              }}
            >
              <img
                src={img}
                alt=""
                className={imageClasses}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="
            w-full flex flex-col items-center justify-center
            bg-surface border-2 border-dashed border-border
            text-text-muted hover:border-primary transition-colors duration-200
          "
          style={{ aspectRatio }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isUploading) {
              fileInputRef.current?.click();
            }
          }}
        >
          {isUploading ? (
            <>
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
              <span className="text-sm">Uploading...</span>
            </>
          ) : (
            <>
              <svg
                className="w-12 h-12 mb-2 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm">{block.placeholder || 'Click to add images'}</span>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
