import { useState } from 'react';
import { BlockDefinition } from '../../../types/block';

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialLinksBlockProps {
  block: BlockDefinition;
  content: string;
  onContentChange: (content: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  github: 'M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z',
  twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  website: 'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 17.292l-4.5-4.364 1.857-1.858 2.643 2.506 5.643-5.784 1.857 1.857-7.5 7.643z',
  email: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
};

export default function SocialLinksBlock({
  block,
  content,
  onContentChange,
  isSelected,
  onSelect,
}: SocialLinksBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [links, setLinks] = useState<SocialLink[]>([]);

  // Parse content on mount/update
  const parseContent = () => {
    if (content) {
      try {
        setLinks(JSON.parse(content));
      } catch {
        setLinks([]);
      }
    } else {
      setLinks([]);
    }
  };

  // Initialize links from content
  useEffect(() => {
    parseContent();
  }, [content]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    setIsEditing(true);
  };

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const containerClasses = `
    relative p-4 rounded-lg transition-all duration-200
    ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'hover:bg-primary/5'}
  `.trim().replace(/\s+/g, ' ');

  if (links.length === 0) {
    return (
      <div className={containerClasses} onClick={handleClick}>
        <div className="flex flex-col items-center justify-center py-6 text-text-muted">
          <svg
            className="w-10 h-10 mb-2 opacity-50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <span className="text-sm italic">{block.placeholder || 'Add social links'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses} onClick={handleClick}>
      <div className="flex flex-wrap gap-4 justify-start">
        {links.map((link, index) => {
          const iconPath = PLATFORM_ICONS[link.platform.toLowerCase()];
          return (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                handleLinkClick(link.url);
              }}
              className="
                p-3 rounded-full bg-surface border border-border
                hover:border-primary hover:bg-primary/10
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary
              "
              title={link.platform}
            >
              <svg
                className="w-5 h-5 text-text-secondary hover:text-primary transition-colors"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                {iconPath ? (
                  <path d={iconPath} />
                ) : (
                  <path d={PLATFORM_ICONS.website} />
                )}
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}
