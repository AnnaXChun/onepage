import { useEditorStore } from '../../stores/editorStore';

export default function BlockConfigPanel() {
  const { blocks, selectedBlockId, updateBlock, selectBlock } = useEditorStore();
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const handleClose = () => {
    selectBlock(null);
  };

  if (!selectedBlock) {
    return (
      <div className="w-72 border-l border-border p-4 bg-surface">
        <p className="text-sm text-text-muted">Select a block to configure</p>
      </div>
    );
  }

  const handleConfigChange = (key: string, value: unknown) => {
    updateBlock(selectedBlock.id, {
      config: { ...selectedBlock.config, [key]: value },
    });
  };

  return (
    <div className="w-72 border-l border-border p-4 bg-surface overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-text-primary capitalize">
          {selectedBlock.type.replace('-', ' ')} Settings
        </h3>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-surface-elevated transition-colors text-text-muted"
          title="Close panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Image-specific settings */}
      {selectedBlock.type === 'image-single' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-text-secondary block mb-1">Aspect Ratio</span>
            <select
              value={selectedBlock.config?.aspectRatio || '1/1'}
              onChange={(e) => handleConfigChange('aspectRatio', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="1/1">Square (1:1)</option>
              <option value="16/9">Landscape (16:9)</option>
              <option value="4/3">Photo (4:3)</option>
              <option value="3/4">Portrait (3:4)</option>
              <option value="auto">Auto</option>
            </select>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedBlock.config?.rounded || false}
              onChange={(e) => handleConfigChange('rounded', e.target.checked)}
              className="rounded border-border bg-surface-elevated text-primary focus:ring-primary"
            />
            <span className="text-sm text-text-primary">Rounded corners</span>
          </label>
        </div>
      )}

      {/* Image gallery settings */}
      {selectedBlock.type === 'image-gallery' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-text-secondary block mb-1">Columns</span>
            <select
              value={selectedBlock.config?.columns || '3'}
              onChange={(e) => handleConfigChange('columns', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="2">2 Columns</option>
              <option value="3">3 Columns</option>
              <option value="4">4 Columns</option>
            </select>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedBlock.config?.rounded || false}
              onChange={(e) => handleConfigChange('rounded', e.target.checked)}
              className="rounded border-border bg-surface-elevated text-primary focus:ring-primary"
            />
            <span className="text-sm text-text-primary">Rounded corners</span>
          </label>
        </div>
      )}

      {/* Text alignment for text blocks */}
      {(selectedBlock.type === 'text-h1' ||
        selectedBlock.type === 'text-h2' ||
        selectedBlock.type === 'text-paragraph') && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-text-secondary block mb-1">Text Align</span>
            <select
              value={selectedBlock.config?.align || 'left'}
              onChange={(e) => handleConfigChange('align', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      )}

      {/* Text container settings */}
      {selectedBlock.type === 'text-container' && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Text container holds nested text blocks. Add blocks from the library below.
          </p>
        </div>
      )}

      {/* Divider style */}
      {selectedBlock.type === 'divider' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-text-secondary block mb-1">Style</span>
            <select
              value={selectedBlock.config?.style || 'solid'}
              onChange={(e) => handleConfigChange('style', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </label>
        </div>
      )}

      {/* Social links settings */}
      {selectedBlock.type === 'social-links' && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Edit social links by clicking on the social links block directly.
          </p>
        </div>
      )}

      {/* Contact form settings */}
      {selectedBlock.type === 'contact-form' && (
        <div className="space-y-4">
          <p className="text-sm text-text-muted">
            Contact form settings coming soon.
          </p>
        </div>
      )}

      {/* List block settings */}
      {selectedBlock.type === 'text-list' && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-text-secondary block mb-1">List Style</span>
            <select
              value={selectedBlock.config?.listStyle || 'ul'}
              onChange={(e) => handleConfigChange('listStyle', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-surface-elevated text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ul">Bullet List</option>
              <option value="ol">Numbered List</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
