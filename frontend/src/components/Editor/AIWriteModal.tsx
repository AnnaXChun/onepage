import { useState, useCallback, useEffect } from 'react';
import Modal from '../common/Modal';
import { aiWrite } from '../../services/aiApi';
import { useEditorStore } from '../../stores/editorStore';

interface AIWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockId: string;
  currentText: string;
  onApply: (newText: string) => void;
}

export default function AIWriteModal({
  isOpen,
  onClose,
  blockId,
  currentText,
  onApply,
}: AIWriteModalProps) {
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const { lexicalEditor } = useEditorStore();

  // Get selected text from Lexical editor when modal opens
  useEffect(() => {
    if (!isOpen || !lexicalEditor) {
      setSelectedText('');
      return;
    }
    const selection = lexicalEditor.getEditorState().selection;
    if (selection) {
      const selected = selection.getTextContent();
      setSelectedText(selected || '');
    }
  }, [isOpen, lexicalEditor]);

  const getContextText = useCallback((): string => {
    // Prefer selected text if available, otherwise fall back to currentText
    if (selectedText) return selectedText;
    return currentText;
  }, [selectedText, currentText]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const context = getContextText();
      const result = await aiWrite(blockId, context, mode);
      setGeneratedText(result);
    } catch (err) {
      setError('Failed to generate text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (generatedText) {
      onApply(generatedText);
      onClose();
    }
  };

  const handleClose = () => {
    setGeneratedText(null);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Write Assist" size="md">
      <div className="space-y-4">
        {/* Current text preview */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Current Text</label>
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm text-secondary max-h-24 overflow-y-auto">
            {currentText || '(empty)'}
          </div>
        </div>

        {/* Mode selection */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">Mode</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
                className="text-primary"
              />
              <span className="text-sm">Replace</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                value="append"
                checked={mode === 'append'}
                onChange={() => setMode('append')}
                className="text-primary"
              />
              <span className="text-sm">Append</span>
            </label>
          </div>
        </div>

        {/* Generated preview */}
        {generatedText && (
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Generated Preview</label>
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm max-h-32 overflow-y-auto">
              {generatedText}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-secondary hover:text-primary transition-colors"
          >
            Cancel
          </button>
          {generatedText ? (
            <>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Apply
              </button>
            </>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isLoading || !currentText}
              className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
