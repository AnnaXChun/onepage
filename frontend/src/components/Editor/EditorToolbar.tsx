import { useEffect } from 'react';
import { useEditorStore } from '../../stores/editorStore';

export default function EditorToolbar() {
  const { isDirty, lastSaved, blocks } = useEditorStore();

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (cmdOrCtrl && e.key === 'z') {
        if (e.shiftKey) {
          // Redo: Cmd/Ctrl+Shift+Z
          e.preventDefault();
          useEditorStore.temporal.getState().redo();
        } else {
          // Undo: Cmd/Ctrl+Z
          e.preventDefault();
          useEditorStore.temporal.getState().undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUndo = () => {
    useEditorStore.temporal.getState().undo();
  };

  const handleRedo = () => {
    useEditorStore.temporal.getState().redo();
  };

  const temporalState = useEditorStore.temporal.getState();
  const canUndo = temporalState.pastStates.length > 0;
  const canRedo = temporalState.futureStates.length > 0;

  const handlePublish = () => {
    // TODO: Implement publish functionality
    console.log('Publish clicked');
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-text-primary">Block Editor</h1>
        {blocks.length > 0 && (
          <span className="text-xs text-text-muted bg-surface-elevated px-2 py-0.5 rounded">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''}
          </span>
        )}
        {isDirty ? (
          <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
            Unsaved changes
          </span>
        ) : lastSaved ? (
          <span className="text-xs text-green-500 bg-green-500/10 px-2 py-0.5 rounded">
            Saved
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {/* Undo button */}
        <button
          onClick={handleUndo}
          disabled={!canUndo}
          className="p-2 rounded-lg hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-primary"
          title="Undo (Cmd/Ctrl+Z)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
          </svg>
        </button>

        {/* Redo button */}
        <button
          onClick={handleRedo}
          disabled={!canRedo}
          className="p-2 rounded-lg hover:bg-surface-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-text-primary"
          title="Redo (Cmd/Ctrl+Shift+Z)"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7" />
          </svg>
        </button>

        <div className="w-px h-6 bg-border mx-2" />

        {/* Publish button */}
        <button
          onClick={handlePublish}
          className="px-4 py-2 bg-primary hover:bg-primaryhover text-text-primary-btn rounded-lg font-medium transition-colors"
        >
          Publish
        </button>
      </div>
    </div>
  );
}
