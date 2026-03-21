import { useState } from 'react';
import { BlockDefinition } from '../../../types/block';

interface ContactFormBlockProps {
  block: BlockDefinition;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

interface FormSettings {
  submitText?: string;
  successMessage?: string;
}

export default function ContactFormBlock({
  block,
  content,
  onContentChange,
  isSelected,
  onSelect,
}: ContactFormBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [settings, setSettings] = useState<FormSettings>({
    submitText: 'Send Message',
    successMessage: 'Thank you for your message!',
  });

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Display-only in editor - no actual submission
    alert('Form submission is disabled in the editor. This will be connected to a backend in a future phase.');
  };

  const containerClasses = `
    relative p-6 rounded-lg transition-all duration-200
    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={containerClasses} onClick={handleClick}>
      <div className="max-w-md mx-auto space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-2">Get in Touch</h3>
          <p className="text-sm text-text-secondary">
            Fill out the form below and I'll get back to you as soon as possible.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label
              htmlFor={`contact-name-${block.id}`}
              className="block text-sm font-medium text-text-secondary"
            >
              Name
            </label>
            <input
              id={`contact-name-${block.id}`}
              type="text"
              placeholder="Your name"
              disabled
              className="
                w-full px-4 py-3 rounded-xl
                bg-surface border border-border
                text-text-primary placeholder:text-text-muted
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor={`contact-email-${block.id}`}
              className="block text-sm font-medium text-text-secondary"
            >
              Email
            </label>
            <input
              id={`contact-email-${block.id}`}
              type="email"
              placeholder="your.email@example.com"
              disabled
              className="
                w-full px-4 py-3 rounded-xl
                bg-surface border border-border
                text-text-primary placeholder:text-text-muted
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor={`contact-message-${block.id}`}
              className="block text-sm font-medium text-text-secondary"
            >
              Message
            </label>
            <textarea
              id={`contact-message-${block.id}`}
              placeholder="How can I help you?"
              rows={4}
              disabled
              className="
                w-full px-4 py-3 rounded-xl resize-none
                bg-surface border border-border
                text-text-primary placeholder:text-text-muted
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            />
          </div>

          <button
            type="submit"
            disabled
            className="
              w-full py-3 px-6 rounded-full font-semibold
              bg-primary text-text-primary-btn
              opacity-60 cursor-not-allowed
              transition-all duration-200
            "
          >
            {settings.submitText || 'Send Message'}
          </button>
        </form>

        <p className="text-xs text-text-muted text-center">
          This form is for display purposes only in the editor.
        </p>
      </div>
    </div>
  );
}
