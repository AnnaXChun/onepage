import { useState, useEffect, useCallback, useRef } from 'react';
import { validateUrl } from './utils/linkUtils';

export interface LinkEditorModalProps {
  isOpen: boolean;
  url: string | null;
  onSubmit: (url: string, openInNewTab: boolean) => void;
  onClose: () => void;
  onRemove?: () => void;
}

/**
 * LinkEditorModal - Modal for inserting/editing links with URL validation.
 * Provides URL input, validation feedback, new tab toggle, and remove link option.
 */
export default function LinkEditorModal({
  isOpen,
  url,
  onSubmit,
  onClose,
  onRemove,
}: LinkEditorModalProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync input with prop (for editing existing link)
  useEffect(() => {
    if (isOpen) {
      setInputUrl(url || '');
      setError(null);
      // Focus input after a short delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, url]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, input, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleSubmit = useCallback(() => {
    const validation = validateUrl(inputUrl);
    if (!validation.valid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    onSubmit(inputUrl.trim(), openInNewTab);
  }, [inputUrl, openInNewTab, onSubmit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value);
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  const isEditing = !!url;
  const canSubmit = inputUrl.trim().length > 0 && !error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ animation: 'fadeIn 150ms ease-out' }}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-modal-title"
        className="relative w-full max-w-md mx-4 p-6 rounded-2xl shadow-2xl border"
        style={{
          backgroundColor: 'var(--color-surface-elevated)',
          borderColor: 'var(--color-border)',
          animation: 'slideUp 200ms var(--ease-out-quart)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2
            id="link-modal-title"
            className="text-lg font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {isEditing ? 'Edit Link' : 'Insert Link'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary/10)';
              e.currentTarget.style.color = 'var(--color-text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
            aria-label="Close modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* URL Input */}
        <div className="mb-4">
          <label
            htmlFor="link-url"
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            URL
          </label>
          <input
            ref={inputRef}
            id="link-url"
            type="url"
            value={inputUrl}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="https://example.com"
            className="w-full px-4 py-3 rounded-xl border outline-none transition-all text-base"
            style={{
              backgroundColor: 'var(--color-surface-base)',
              borderColor: error ? 'var(--color-error, #ef4444)' : 'var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--color-error, #ef4444)' : 'var(--color-border)';
            }}
          />
          {error && (
            <p
              className="mt-2 text-sm flex items-center gap-1.5"
              style={{ color: 'var(--color-error, #ef4444)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {error}
            </p>
          )}
        </div>

        {/* New Tab Toggle */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className="w-10 h-6 rounded-full relative transition-colors"
              style={{
                backgroundColor: openInNewTab ? 'var(--color-primary)' : 'var(--color-border)',
              }}
              onClick={() => setOpenInNewTab(!openInNewTab)}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"
                style={{
                  transform: openInNewTab ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </div>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Open in new tab
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              backgroundColor: canSubmit ? 'var(--color-primary)' : 'var(--color-border)',
              color: canSubmit ? '#ffffff' : 'var(--color-text-muted)',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
            }}
          >
            {isEditing ? 'Update' : 'Insert'}
          </button>

          {isEditing && onRemove && (
            <button
              onClick={onRemove}
              className="px-4 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--color-error, #ef4444)',
                border: '1px solid var(--color-error, #ef4444)',
              }}
            >
              Remove
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <p
          className="mt-4 text-xs text-center"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Press Enter to submit, Escape to close
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
