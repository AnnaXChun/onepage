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
  const { blocks, isDirty, markSaved } = useEditorStore();
  const lastSavedBlocksRef = useRef<string>('');
  const pendingSaveRef = useRef<boolean>(false);

  const save = useDebouncedCallback(
    async () => {
      if (!blogId || !isDirty) return;

      const blocksJson = JSON.stringify(blocks);
      if (blocksJson === lastSavedBlocksRef.current) return; // No changes

      pendingSaveRef.current = true;
      const result = await saveBlocksToBackend(blogId, blocks);
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
