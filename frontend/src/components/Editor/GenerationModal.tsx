import { useState, useEffect, useCallback } from 'react';
import { extractColors } from '../../../utils/colorExtraction';
import { useEditorStore } from '../../../stores/editorStore';

interface GenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  blogId: number;
}

type GenerationStage = 'IDLE' | 'EXTRACTING_COLORS' | 'STARTING' | 'GENERATING' | 'ASSEMBLING_BLOCKS' | 'COMPLETED' | 'FAILED';

const STAGE_LABELS: Record<GenerationStage, string> = {
  IDLE: 'Ready',
  EXTRACTING_COLORS: 'Extracting Colors',
  STARTING: 'Starting Generation',
  GENERATING: 'Generating Content',
  ASSEMBLING_BLOCKS: 'Assembling Blocks',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

export function GenerationModal({ isOpen, onClose, blogId }: GenerationModalProps) {
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<GenerationStage>('IDLE');
  const [progress, setProgress] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const setBlocks = useEditorStore((s) => s.setBlocks);

  useEffect(() => {
    if (!isOpen || !blogId) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/generation`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.blogId === blogId) {
          setStage(data.stage as GenerationStage);
          setProgress(data.percent);
          if (data.stage === 'COMPLETED' && data.blocks) {
            setBlocks(data.blocks);
          }
        }
      } catch {}
    };

    setWs(socket);
    return () => socket.close();
  }, [isOpen, blogId, setBlocks]);

  const handleGenerate = useCallback(async () => {
    if (!imageUrl || !description) return;

    setStage('EXTRACTING_COLORS');
    const palette = await extractColors(imageUrl);
    const dominant = palette[0] || '#6366f1';

    setStage('STARTING');
    await fetch('/api/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId, imageUrl, description, colorPalette: palette, dominantColor: dominant })
    });
  }, [imageUrl, description, blogId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">AI Generation</h2>

        <input
          type="url"
          placeholder="Image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-3 dark:bg-neutral-800 dark:border-neutral-700"
        />
        <textarea
          placeholder="Description of your page..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4 dark:bg-neutral-800 dark:border-neutral-700"
          rows={3}
        />

        {stage !== 'IDLE' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{STAGE_LABELS[stage]}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
            Cancel
          </button>
          {stage === 'COMPLETED' ? (
            <button onClick={onClose} className="px-4 py-2 bg-indigo-500 text-white rounded-lg">
              Accept
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!imageUrl || !description || stage !== 'IDLE'}
              className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:opacity-50"
            >
              Generate
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
