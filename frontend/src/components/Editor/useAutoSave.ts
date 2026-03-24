import { useEffect, useRef } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useEditorStore, BlockState } from '../../stores/editorStore';
import { updateBlogBlocks, API_BASE } from '../../services/api';

interface SaveResult {
  success: boolean;
  error?: string;
}

export async function saveBlocksToBackend(blogId: string, blocks: BlockState[]): Promise<SaveResult> {
  try {
    await updateBlogBlocks(blogId, blocks);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: message };
  }
}

export default function useAutoSave(blogId: string | null) {
  const { blocks, isDirty, markSaved, lexicalEditor } = useEditorStore();
  const lastSavedBlocksRef = useRef<string>('');
  const pendingSaveRef = useRef<boolean>(false);

  const save = useDebouncedCallback(
    async () => {
      if (!blogId || !isDirty) return;

      // Get blocks to save - prefer Lexical state if available
      let blocksToSave = blocks;
      if (lexicalEditor) {
        try {
          const editorState = lexicalEditor.getEditorState();
          const json = editorState.toJSON();
          // If Lexical has different content, use it
          const lexicalJson = JSON.stringify(json);
          const blocksJson = JSON.stringify(blocks);
          if (lexicalJson !== blocksJson) {
            // Parse Lexical state back to blocks format
            const root = json.root;
            if (root?.children) {
              // Update blocks content from Lexical
              blocksToSave = blocks.map((block) => {
                const lexicalNode = root.children.find(
                  (child: { blockId?: string }) => child.blockId === block.id
                );
                if (lexicalNode && 'text' in lexicalNode) {
                  return { ...block, content: (lexicalNode as { text: string }).text };
                }
                return block;
              });
            }
          }
        } catch (err) {
          console.warn('[AutoSave] Failed to get Lexical state:', err);
        }
      }

      const blocksJson = JSON.stringify(blocksToSave);
      if (blocksJson === lastSavedBlocksRef.current) return; // No changes

      pendingSaveRef.current = true;
      const result = await saveBlocksToBackend(blogId, blocksToSave);
      pendingSaveRef.current = false;

      if (result.success) {
        lastSavedBlocksRef.current = blocksJson;
        markSaved();
      } else {
        console.error('Auto-save failed:', result.error);
        // TODO: Show error toast to user
      }
    },
    500,
    { maxWait: 2000 }
  );

  useEffect(() => {
    if (isDirty && blogId) {
      save();
    }
  }, [blocks, isDirty, blogId, save]);

  // Also save immediately before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !pendingSaveRef.current) {
        // Try to save synchronously via sendBeacon if available
        const token = localStorage.getItem('token');
        const data = JSON.stringify({ blocks });

        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `${API_BASE}/blog/${blogId}/blocks`,
            new Blob([data], { type: 'application/json' })
          );
        }

        // Also save to localStorage as backup
        localStorage.setItem('editor-pending-save', JSON.stringify({ blogId, blocks }));
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [blocks, isDirty, blogId]);

  return { save };
}
