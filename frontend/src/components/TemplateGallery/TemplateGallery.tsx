import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TEMPLATES, type TemplateConfig } from '../../config/templates';
import { type BlockManifest } from '../../types/block';

interface TemplateGalleryProps {
  onClose: () => void;
  onSelect?: (template: TemplateConfig) => void;
  initialState?: { templateId?: number };
}

function TemplateGallery({ onClose, onSelect, initialState }: TemplateGalleryProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewHTML, setPreviewHTML] = useState<string | null>(null);
  const [blocksJson, setBlocksJson] = useState<BlockManifest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const state = initialState || location.state;
    if (state?.templateId) {
      const template = TEMPLATES.find((t) => t.id === Number(state.templateId));
      if (template) {
        setSelectedTemplate(template);
        setPreviewMode(true);
      }
    }
  }, [initialState?.templateId, location.state]);

  useEffect(() => {
    if (!selectedTemplate) {
      setPreviewHTML(null);
      setBlocksJson(null);
      return;
    }

    const templateBase = `/templates/${selectedTemplate.slug}`;
    const userImage = uploadedImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=800&fit=crop';

    Promise.all([
      fetch(`${templateBase}/index.html`).then((r) => r.text()),
      fetch(`${templateBase}/styles.css`).then((r) => r.text()),
      fetch(`${templateBase}/blocks.json`).then((r) => r.json()).catch(() => null),
    ])
      .then(([htmlText, cssText, blocksJsonData]) => {
        const modifiedHtml = htmlText
          .replace(/{{USER_IMAGE}}/g, userImage)
          .replace(/{{USER_NAME}}/g, 'Your Name')
          .replace(/{{USER_BIO}}/g, 'Welcome to my personal blog')
          .replace(/{{BLOG_CONTENT}}/g, '<p>Your blog content will appear here...</p>')
          .replace('</head>', `<style>${cssText}</style></head>`);
        setPreviewHTML(modifiedHtml);
        setBlocksJson(blocksJsonData);
      })
      .catch((err) => {
        console.error('Failed to load template:', err);
        setPreviewHTML(null);
        setBlocksJson(null);
      });
  }, [selectedTemplate, uploadedImage]);

  const handleTemplateClick = (template: TemplateConfig) => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', {
        state: {
          returnUrl: '/',
          templateId: template.id,
          fromGallery: true,
        },
      });
      return;
    }
    setSelectedTemplate(template);
    setPreviewMode(true);
  };

  const handleBack = () => {
    setPreviewMode(false);
    setSelectedTemplate(null);
    setUploadedImage(null);
    setBlocksJson(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUseTemplate = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', {
        state: {
          returnUrl: '/preview',
          uploadedImage,
          selectedTemplate,
          blocksJson,
        },
      });
      return;
    }

    if (onClose) {
      onClose();
    }

    navigate('/preview', {
      state: {
        uploadedImage,
        selectedTemplate,
        blocksJson,
      },
    });
  };

  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;

    return (
      <iframe
        srcDoc={previewHTML ?? undefined}
        className="w-full h-full rounded-xl border border-border bg-white"
        title={selectedTemplate.name}
        sandbox="allow-same-origin allow-scripts"
      />
    );
  };

  const renderUploadCard = () => (
    <div className="bg-surface/80 backdrop-blur-2xl rounded-2xl border border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary mb-1">
          {selectedTemplate?.name}
        </h3>
        <p className="text-sm text-muted">
          {selectedTemplate?.price === 0 ? 'Free' : `$${selectedTemplate?.price}`}
        </p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5'
            : uploadedImage
            ? 'border-success bg-success/5'
            : 'border-border hover:border-borderLight bg-background/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {uploadedImage ? (
          <div className="space-y-4">
            <div className="relative group">
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="max-h-40 mx-auto rounded-xl object-cover shadow-lg"
              />
              <div className="absolute inset-0 bg-background/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-sm text-secondary">Click to change</span>
              </div>
            </div>
            <p className="text-sm text-success">Image uploaded!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto bg-background rounded-xl border border-border flex items-center justify-center">
              <svg
                className="w-8 h-8 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-primary mb-1">
                Upload your image
              </p>
              <p className="text-xs text-muted">
                Click or drag to upload
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleUseTemplate}
        disabled={!uploadedImage}
        className="w-full mt-6 py-3 bg-primary text-text-primary-btn font-medium rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {selectedTemplate?.price && selectedTemplate.price > 0
          ? `Buy for $${selectedTemplate.price}`
          : 'Use this template'}
      </button>

      <button
        onClick={handleBack}
        className="w-full mt-3 py-2 text-sm text-muted hover:text-primary transition-colors"
      >
        Choose another template
      </button>
    </div>
  );

  if (previewMode && selectedTemplate) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-secondary hover:text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <h1 className="text-base font-semibold text-primary">
              {selectedTemplate.name} Template
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <main className="pt-14 h-screen flex">
          <div className="flex-1 p-6 bg-zinc-100 dark:bg-zinc-900">
            <div className="h-full rounded-2xl overflow-hidden bg-white shadow-2xl relative">
              {renderTemplatePreview()}
              <div className="preview-placeholder hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                <div className="text-center p-8">
                  <div className="w-24 h-24 mx-auto mb-4 bg-zinc-200 dark:bg-zinc-700 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-2">Template Preview</p>
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">
                    {selectedTemplate.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-80 p-6 border-l border-border bg-background/50 backdrop-blur-lg overflow-y-auto">
            {renderUploadCard()}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg overflow-y-auto">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-secondary hover:text-primary hover:border-borderLight transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Choose Template</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 animate-slide-up">Explore Our Templates</h2>
            <p className="text-secondary text-lg animate-slide-up stagger-1">
              Choose the perfect template for your personal blog
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {TEMPLATES.map((template, i) => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-105 hover:z-10 animate-slide-up ${
                  selectedTemplate?.id === template.id
                    ? 'ring-4 ring-primary ring-offset-4 ring-offset-background scale-105 z-10 shadow-2xl shadow-primary/30'
                    : 'hover:shadow-xl hover:shadow-black/20'
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative aspect-[3/4]">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${template.color} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />

                  <div className="absolute top-4 left-4 flex gap-2">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm transition-all duration-300 ${
                          tag === 'Free'
                            ? 'bg-success/90 text-white'
                            : 'bg-primary/90 text-white'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-xl font-bold text-white mb-1 transform translate-y-0 group-hover:translate-y-0 transition-transform duration-300">
                      {template.name}
                    </h3>
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      {template.description}
                    </p>
                    <div className="mt-2">
                      <span className={`text-lg font-bold ${template.price === 0 ? 'text-green-400' : 'text-white'}`}>
                        {template.price === 0 ? 'Free' : `$${template.price}`}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-full shadow-lg">
                      Click to preview
                    </span>
                  </div>
                </div>

                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r ${template.color} blur-xl opacity-20`} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export { TEMPLATES };
export type { TemplateConfig };
export default TemplateGallery;
