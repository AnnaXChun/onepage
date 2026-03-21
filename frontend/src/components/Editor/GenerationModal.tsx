import { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import { extractColors } from '../../../utils/colorExtraction';
import { useEditorStore, BlockState } from '../../../stores/editorStore';

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
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [previewBlocks, setPreviewBlocks] = useState<BlockState[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [colorPalette, setColorPalette] = useState<string[]>([]);
  const [dominantColor, setDominantColor] = useState('#6366f1');
  const setBlocks = useEditorStore((s) => s.setBlocks);

  useEffect(() => {
    if (!isOpen || !blogId) return;

    const client = new Client({
      brokerURL: `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`,
      onConnect: () => {
        client.subscribe(`/topic/progress/${blogId}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            setStage(data.stage as GenerationStage);
            setProgress(data.percent);
            if (data.stage === 'COMPLETED' && data.blocks) {
              setPreviewBlocks(data.blocks);
              setIsPreviewMode(true);
            }
          } catch {}
        });
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [isOpen, blogId]);

  const handleGenerate = useCallback(async () => {
    if (!imageUrl || !description) return;

    setStage('EXTRACTING_COLORS');
    const palette = await extractColors(imageUrl);
    const dominant = palette[0] || '#6366f1';
    setColorPalette(palette);
    setDominantColor(dominant);

    setStage('STARTING');
    await fetch('/api/v1/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogId, imageUrl, description, colorPalette: palette, dominantColor: dominant })
    });
  }, [imageUrl, description, blogId]);

  const handleAcceptAll = () => {
    setBlocks(previewBlocks);
    setIsPreviewMode(false);
    setPreviewBlocks([]);
    setStage('IDLE');
    onClose();
  };

  const handleCancel = () => {
    setIsPreviewMode(false);
    setPreviewBlocks([]);
    setStage('IDLE');
  };

  const handleRegenerateBlock = async (blockIndex: number) => {
    if (!imageUrl || !description) return;
    await fetch(`/api/v1/generate/regenerate/${blogId}/${blockIndex}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl, description, colorPalette, dominantColor })
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">AI Generation</h2>

        {!isPreviewMode ? (
          <>
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
              <button
                onClick={handleGenerate}
                disabled={!imageUrl || !description || stage !== 'IDLE'}
                className="px-4 py-2 bg-indigo-500 text-white rounded-lg disabled:opacity-50"
              >
                Generate
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="font-medium mb-2">Generated Preview</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {previewBlocks.map((block, index) => (
                  <div key={block.id || index} className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-secondary">{block.type}</span>
                      <button
                        onClick={() => handleRegenerateBlock(index)}
                        className="text-xs text-indigo-500 hover:text-indigo-400"
                      >
                        Regenerate
                      </button>
                    </div>
                    <p className="text-sm">{block.content || '(empty)'}</p>
                    {block.confidence !== undefined && (
                      <span className={`text-xs ${block.confidence < 0.7 ? 'text-amber-500' : 'text-green-500'}`}>
                        Confidence: {Math.round(block.confidence * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={handleCancel} className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                Cancel
              </button>
              <button onClick={handleAcceptAll} className="px-4 py-2 bg-indigo-500 text-white rounded-lg">
                Accept All
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
