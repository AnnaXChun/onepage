import { useState, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { TEMPLATES, type TemplateConfig } from '../../config/templates';

interface TemplateSelectProps {
  onSelect: (template: TemplateConfig) => void;
  onBack: () => void;
  selectedTemplate?: TemplateConfig;
}

function TemplateSelect({ onSelect, onBack, selectedTemplate: initialTemplate }: TemplateSelectProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string | null>(initialTemplate?.id || null);

  useEffect(() => {
    if (initialTemplate?.id) {
      setSelectedId(initialTemplate.id);
    }
  }, [initialTemplate?.id]);

  const handleSelect = (template: TemplateConfig) => {
    setSelectedId(template.id);
  };

  const handleConfirm = () => {
    const template = TEMPLATES.find((t) => t.id === selectedId);
    if (template) {
      onSelect(template);
    }
  };

  const selectedTemplateItem = TEMPLATES.find((t) => t.id === selectedId);

  return (
    <div className="min-h-screen bg-background text-primary">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-secondary hover:text-primary hover:border-borderLight transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{t('chooseTemplate')}</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pt-24 pb-12 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-12 h-0.5 bg-border" />
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-12 h-0.5 bg-border" />
            <div className="w-3 h-3 rounded-full bg-border" />
          </div>

          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-muted mb-3">{t('step2of3')}</p>
            <h2 className="text-fluid-lg font-bold mb-4">{t('selectYourTemplate')}</h2>
            <p className="text-secondary">{t('chooseTemplateStyle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((template, i) => (
              <div
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] animate-slide-up ${
                  selectedId === template.id
                    ? 'ring-2 ring-primary ring-offset-4 ring-offset-background'
                    : ''
                }`}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${template.color}`} />

                <div className="relative aspect-[4/3]">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

                  <div className="absolute top-4 left-4 flex gap-2">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                          tag === 'Free'
                            ? 'bg-success/20 text-success'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {tag === 'Free' ? t('free') : tag}
                      </span>
                    ))}
                  </div>

                  {selectedId === template.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold mb-1">{template.name}</h3>
                    <p className="text-sm text-secondary">{template.description}</p>
                    <div className="mt-2">
                      <span className={`text-lg font-bold ${template.price === 0 ? 'text-success' : 'text-primary'}`}>
                        {template.price === 0 ? t('free') : `$${template.price}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className="group relative px-12 py-4 bg-primary text-text-primary-btn font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('continueWith')} {selectedTemplateItem?.name || t('selectedTemplate')}
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export type { TemplateSelectProps };
export { TEMPLATES };
export default TemplateSelect;
