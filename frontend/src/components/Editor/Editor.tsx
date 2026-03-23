import { useEffect, useState } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import EditorCanvas from './EditorCanvas';
import EditorToolbar from './EditorToolbar';
import BlockConfigPanel from './BlockConfigPanel';
import BlockLibrary from './BlockLibrary';
import SEOPanel from './SEOPanel';
import useAutoSave from './useAutoSave';
import { BlockManifest } from '../../types/block';

interface EditorProps {
  blogId: string;
  initialBlocks?: BlockManifest;
  coverImage?: string;
}

export default function Editor({ blogId, initialBlocks, coverImage }: EditorProps) {
  const { setBlocks, blocks, selectBlock } = useEditorStore();
  const [isSeoPanelOpen, setIsSeoPanelOpen] = useState(false);

  // Initialize blocks from initialBlocks (loaded from blocks.json or saved blocks)
  useEffect(() => {
    if (initialBlocks?.blocks && blocks.length === 0) {
      const initialBlockStates = initialBlocks.blocks.map((block) => ({
        id: block.id,
        type: block.type,
        content: block.defaultContent,
        config: block.config || {},
      }));
      setBlocks(initialBlockStates);
    }
  }, [initialBlocks, setBlocks, blocks.length]);

  // Auto-save hook
  useAutoSave(blogId);

  // Click outside to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectBlock(null);
    }
  };

  // Graceful fallback if no blogId provided
  if (!blogId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-text-primary">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-50">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
        <p className="text-lg font-medium">No blog selected</p>
        <p className="text-sm mt-1 text-text-muted">Please select a blog to edit</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <EditorToolbar onSeoClick={() => setIsSeoPanelOpen(true)} />

      {/* Cover Image */}
      {coverImage && (
        <div className="w-full h-48 relative overflow-hidden bg-neutral-900">
          <img
            src={coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main editor area */}
        <div
          className="flex-1 overflow-y-auto"
          onClick={handleCanvasClick}
        >
          <EditorCanvas />
          <BlockLibrary />
        </div>

        {/* Right sidebar - block config */}
        <BlockConfigPanel blogId={blogId} />
      </div>

      {/* SEO Panel */}
      <SEOPanel
        blogId={Number(blogId)}
        isOpen={isSeoPanelOpen}
        onClose={() => setIsSeoPanelOpen(false)}
      />
    </div>
  );
}
