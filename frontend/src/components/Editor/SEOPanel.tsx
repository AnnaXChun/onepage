import { useState, useEffect } from 'react';
import { updateBlogSeo, updateRobotsTxt, getBlogSeo } from '@/services/api';

interface SEOPanelProps {
  blogId: number;
  initialMetaTitle?: string;
  initialMetaDescription?: string;
  username?: string;
  coverImage?: string;
  siteUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_TITLE_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 160;

// Default site URL from environment variable
const DEFAULT_SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:8080';

export default function SEOPanel({
  blogId,
  initialMetaTitle = '',
  initialMetaDescription = '',
  username = 'user',
  coverImage,
  siteUrl = DEFAULT_SITE_URL,
  isOpen,
  onClose,
}: SEOPanelProps) {
  const [activeTab, setActiveTab] = useState<'meta' | 'robots'>('meta');
  const [metaTitle, setMetaTitle] = useState(initialMetaTitle);
  const [metaDescription, setMetaDescription] = useState(initialMetaDescription);
  const [robotsTxt, setRobotsTxt] = useState(
    `User-agent: *\nAllow: /\nSitemap: ${DEFAULT_SITE_URL}/host/${username}/sitemap.xml`
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [robotsSaveError, setRobotsSaveError] = useState<string | null>(null);
  const [isLoadingSeo, setIsLoadingSeo] = useState(false);

  // Fetch existing SEO values when panel opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchSeoData = async () => {
      try {
        setIsLoadingSeo(true);
        const seoData = await getBlogSeo(blogId);
        if (seoData.metaTitle !== undefined) {
          setMetaTitle(seoData.metaTitle);
        }
        if (seoData.metaDescription !== undefined) {
          setMetaDescription(seoData.metaDescription);
        }
      } catch (error) {
        console.error('Failed to load SEO data:', error);
      } finally {
        setIsLoadingSeo(false);
      }
    };

    fetchSeoData();
  }, [isOpen, blogId]);

  // Auto-save meta fields with 500ms debounce
  useEffect(() => {
    if (!isOpen || activeTab !== 'meta' || isLoadingSeo) return;

    const timer = setTimeout(async () => {
      try {
        setSaveError(null);
        await updateBlogSeo(blogId, { metaTitle, metaDescription });
      } catch (error) {
        setSaveError('Failed to save. Check your connection and try again.');
        console.error('SEO save error:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [blogId, metaTitle, metaDescription, isOpen, activeTab, isLoadingSeo]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleSaveRobots = async () => {
    try {
      setRobotsSaveError(null);
      await updateRobotsTxt(robotsTxt);
    } catch (error) {
      setRobotsSaveError('Failed to save robots.txt. Check your connection and try again.');
      console.error('Robots.txt save error:', error);
    }
  };

  const handleResetRobots = () => {
    setRobotsTxt(`User-agent: *\nAllow: /\nSitemap: ${DEFAULT_SITE_URL}/host/${username}/sitemap.xml`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-0 top-0 h-full w-80 bg-[oklch(20%_0.015_260)] border-l border-[oklch(30%_0.015_260)] shadow-xl z-50"
      style={{
        animation: 'slideInRight 300ms ease-out-quart',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(30%_0.015_260)]">
        <h2 className="text-[15px] font-semibold text-[oklch(90%_0_0)]">SEO Settings</h2>
        <button
          onClick={onClose}
          className="p-1 text-[oklch(55%_0_0)] hover:text-[oklch(90%_0_0)] transition-colors"
          aria-label="Close SEO settings"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[oklch(30%_0.015_260)]">
        <button
          onClick={() => setActiveTab('meta')}
          className={`flex-1 px-4 py-2.5 text-[13px] font-medium transition-colors ${
            activeTab === 'meta'
              ? 'text-[oklch(55%_0.12_275)] border-b-2 border-[oklch(55%_0.12_275)]'
              : 'text-[oklch(55%_0_0)] hover:text-[oklch(80%_0_0)]'
          }`}
        >
          Meta Tags
        </button>
        <button
          onClick={() => setActiveTab('robots')}
          className={`flex-1 px-4 py-2.5 text-[13px] font-medium transition-colors ${
            activeTab === 'robots'
              ? 'text-[oklch(55%_0.12_275)] border-b-2 border-[oklch(55%_0.12_275)]'
              : 'text-[oklch(55%_0_0)] hover:text-[oklch(80%_0_0)]'
          }`}
        >
          robots.txt
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4 overflow-y-auto h-[calc(100%-120px)]">
        {activeTab === 'meta' ? (
          <div className="space-y-4">
            {/* Loading indicator */}
            {isLoadingSeo && (
              <div className="text-[12px] text-[oklch(55%_0_0)]">Loading SEO data...</div>
            )}

            {/* Amber Warning */}
            <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg px-3 py-2 text-xs">
              Re-publish your site for SEO changes to take effect.
            </div>

            {/* Meta Title */}
            <div>
              <label className="block text-[13px] font-medium text-[oklch(80%_0_0)] mb-1.5">
                Meta Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
                  placeholder="Enter a search-friendly title"
                  maxLength={MAX_TITLE_LENGTH}
                  className="w-full px-3 py-2 bg-[oklch(15%_0.015_260)] border border-[oklch(30%_0.015_260)] rounded-lg text-[14px] text-[oklch(90%_0_0)] placeholder:text-[oklch(40%_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(55%_0.12_275)] focus:border-transparent transition-shadow"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[oklch(40%_0_0)]">
                  {metaTitle.length}/{MAX_TITLE_LENGTH}
                </span>
              </div>
            </div>

            {/* Meta Description */}
            <div>
              <label className="block text-[13px] font-medium text-[oklch(80%_0_0)] mb-1.5">
                Meta Description
              </label>
              <div className="relative">
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value.slice(0, MAX_DESCRIPTION_LENGTH))}
                  placeholder="Describe your site for search engines"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  rows={3}
                  className="w-full px-3 py-2 bg-[oklch(15%_0.015_260)] border border-[oklch(30%_0.015_260)] rounded-lg text-[14px] text-[oklch(90%_0_0)] placeholder:text-[oklch(40%_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(55%_0.12_275)] focus:border-transparent transition-shadow resize-none"
                />
                <span className="absolute right-3 bottom-2 text-[12px] text-[oklch(40%_0_0)]">
                  {metaDescription.length}/{MAX_DESCRIPTION_LENGTH}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {saveError && (
              <p className="text-xs text-red-400">{saveError}</p>
            )}

            {/* OG Preview Card */}
            <div className="mt-6">
              <h3 className="text-[13px] font-medium text-[oklch(80%_0_0)] mb-2">Social Preview</h3>
              <OGPreviewCard
                title={metaTitle || 'Site Title'}
                description={metaDescription || 'Description text will appear here...'}
                image={coverImage}
                url={`${DEFAULT_SITE_URL}/host/${username}`}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* robots.txt Editor */}
            <div>
              <label className="block text-[13px] font-medium text-[oklch(80%_0_0)] mb-1.5">
                robots.txt content
              </label>
              <textarea
                value={robotsTxt}
                onChange={(e) => setRobotsTxt(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 bg-[oklch(15%_0.015_260)] border border-[oklch(30%_0.015_260)] rounded-lg text-[14px] text-[oklch(90%_0_0)] font-mono placeholder:text-[oklch(40%_0_0)] focus:outline-none focus:ring-2 focus:ring-[oklch(55%_0.12_275)] focus:border-transparent transition-shadow resize-none"
                placeholder="User-agent: * / Allow: / Sitemap: ..."
              />
              <p className="mt-2 text-[12px] text-[oklch(55%_0_0)]">
                User-agent: * / Allow: / Sitemap: {DEFAULT_SITE_URL}/host/{username}/sitemap.xml
              </p>
            </div>

            {/* Error Message */}
            {robotsSaveError && (
              <p className="text-xs text-red-400">{robotsSaveError}</p>
            )}

            {/* Save and Reset Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveRobots}
                className="flex-1 px-4 py-2 bg-[oklch(55%_0.12_275)] text-white rounded-lg text-[14px] font-medium hover:opacity-90 transition-opacity"
              >
                Save
              </button>
              <button
                onClick={handleResetRobots}
                className="px-4 py-2 bg-[oklch(30%_0.015_260)] text-[oklch(80%_0_0)] rounded-lg text-[14px] font-medium hover:bg-[oklch(35%_0.015_260)] transition-colors"
              >
                Reset to default
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

/** OG Preview Card Component */
function OGPreviewCard({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  url: string;
}) {
  return (
    <div className="border border-[oklch(30%_0.015_260)] rounded-xl bg-[oklch(15%_0.015_260)] overflow-hidden">
      {/* Image */}
      {image ? (
        <div className="aspect-video bg-[oklch(25%_0.015_260)]">
          <img src={image} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video bg-[oklch(25%_0.015_260)] flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-[oklch(40%_0_0)]">
            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
            <circle cx="18" cy="18" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 32l10-8 8 6 14-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-3">
        <p className="text-[14px] font-medium text-[oklch(90%_0_0)] truncate">{title}</p>
        <p className="text-[12px] text-[oklch(55%_0_0)] truncate mt-0.5">{url}</p>
        <p className="text-[12px] text-[oklch(55%_0_0)] line-clamp-2 mt-1">{description}</p>

        {/* Badges */}
        <div className="flex gap-1.5 mt-3">
          <span className="bg-[oklch(55%_0.12_275)]/20 text-[oklch(55%_0.12_275)] text-xs px-2 py-0.5 rounded font-medium">
            OG
          </span>
          <span className="bg-[oklch(25%_0.015_260)] text-[oklch(55%_0_0)] text-xs px-2 py-0.5 rounded">
            X
          </span>
        </div>
      </div>
    </div>
  );
}
