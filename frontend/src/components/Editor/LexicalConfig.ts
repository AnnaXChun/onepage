import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
import { BlockNode } from './LexicalBlockNode';
import type { LexicalEditor } from 'lexical';

/**
 * Initial configuration for LexicalComposer.
 * Includes BlockNode for storing block data.
 */
export const lexicalConfig: InitialConfigType = {
  namespace: 'vibe-editor',
  nodes: [BlockNode],
  onError: (error: Error) => {
    console.error('[Lexical Error]', error);
  },
  theme: {
    root: 'vibe-editor-root',
    block: 'vibe-editor-block',
    text: {
      bold: 'vibe-text-bold',
      italic: 'vibe-text-italic',
      underline: 'vibe-text-underline',
    },
  },
};

/**
 * Factory function to create a Lexical update listener.
 * Returns a cleanup function to unsubscribe.
 */
export function createLexicalUpdateListener(
  onSetEditor: (editor: LexicalEditor) => void,
  onUpdate: (editorState: ReturnType<LexicalEditor['getEditorState']>) => void
): () => void {
  return (editor: LexicalEditor) => {
    // Store editor reference
    onSetEditor(editor);

    // Register update listener
    const listener = editor.registerUpdateListener(({ editorState }) => {
      onUpdate(editorState);
    });

    // Return cleanup function
    return listener;
  };
}
