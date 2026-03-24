import { useEffect, useState, useRef } from 'react';
import { useEditorStore } from '../../stores/editorStore';
import EditorCanvas from './EditorCanvas';
import EditorToolbar from './EditorToolbar';
import BlockConfigPanel from './BlockConfigPanel';
import BlockLibrary from './BlockLibrary';
import SEOPanel from './SEOPanel';
import useAutoSave from './useAutoSave';
import LexicalEditor from './LexicalEditor';
import AIWriteModal from './AIWriteModal';
import { BlockManifest } from '../../types/block';

interface EditorProps {
  blogId: string;
  initialBlocks?: BlockManifest;
  coverImage?: string;
}

export default function Editor({ blogId, initialBlocks, coverImage }: EditorProps) {
  const { setBlocks, blocks, selectBlock, selectedBlockId, updateBlock } = useEditorStore();
  const [isSeoPanelOpen, setIsSeoPanelOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const prevBlogIdRef = useRef<string | null>(null);

  // Clear and reinitialize blocks when blogId changes (handles localStorage persistence)
  useEffect(() => {
    if (prevBlogIdRef.current !== blogId) {
      prevBlogIdRef.current = blogId;
      // Clear existing blocks first
      setBlocks([]);
    }
  }, [blogId, setBlocks]);

  // Initialize blocks from initialBlocks
  useEffect(() => {
    if (!initialBlocks?.blocks) return;

    const initialBlockStates = initialBlocks.blocks.map((block) => {
      if ((block.type === 'image' || block.type === 'image-single' || block.type === 'image-gallery') && coverImage) {
        return {
          id: block.id,
          type: block.type,
          content: coverImage,
          config: block.config || {},
        };
      }
      return {
        id: block.id,
        type: block.type,
        content: block.defaultContent,
        config: block.config || {},
      };
    });
    setBlocks(initialBlockStates);
  }, [initialBlocks, setBlocks, coverImage]);

  // Auto-save hook
  useAutoSave(blogId);

  // Click outside to deselect
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectBlock(null);
    }
  };

  // AI Assist handler
  const handleAiAssist = () => {
    if (selectedBlockId) {
      setIsAiModalOpen(true);
    }
  };

  // Get selected block text for AI modal
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const handleAiApply = (newText: string) => {
    if (selectedBlockId) {
      updateBlock(selectedBlockId, { content: newText });
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
      <EditorToolbar onSeoClick={() => setIsSeoPanelOpen(true)} onAiAssist={handleAiAssist} />

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

      {/* AI Write Assist Modal */}
      <AIWriteModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        blockId={selectedBlockId || ''}
        currentText={selectedBlock?.content || ''}
        onApply={handleAiApply}
      />
    </div>
  );
}
