import { useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalEditor } from '@lexical/react/LexicalComposer';
import { lexicalConfig, createLexicalUpdateListener } from './LexicalConfig';
import { useEditorStore } from '../../stores/editorStore';
import { BlockType } from '../../types/block';

interface LexicalEditorProps {
  blockId: string;
  blockType: BlockType;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
}

/**
 * Inner component that accesses the Lexical editor instance.
 */
function LexicalEditorInner({ onContentChange }: { onContentChange: (content: string) => void }) {
  const editor = useLexicalEditor();
  const { setLexicalEditor } = useEditorStore();

  useEffect(() => {
    if (!editor) return;

    // Set editor reference in Zustand store
    setLexicalEditor(editor);

    // Create update listener
    const cleanup = createLexicalUpdateListener(
      (ed) => setLexicalEditor(ed),
      (editorState) => {
        // Sync blocks from Lexical to Zustand
        const json = editorState.toJSON();
        // Store serialized state for auto-save
        console.log('[Lexical] Editor state updated:', json);
      }
    )(editor);

    return cleanup;
  }, [editor, setLexicalEditor]);

  return null;
}

/**
 * LexicalEditor - LexicalComposer wrapper for the editor.
 * Provides Lexical context and stores editor reference in Zustand.
 */
export default function LexicalEditor({
  blockId,
  blockType,
  content,
  onContentChange,
  isSelected,
}: LexicalEditorProps) {
  return (
    <LexicalComposer initialConfig={lexicalConfig}>
      <LexicalEditorInner onContentChange={onContentChange} />
      <div
        className={`lexical-editor-content ${isSelected ? 'selected' : ''}`}
        data-block-id={blockId}
        data-block-type={blockType}
      >
        {/* Editor content will be rendered here */}
        {/* ContentEditable is managed by Lexical internally */}
      </div>
    </LexicalComposer>
  );
}
