import { useTranslation } from '../../../i18n';

const features = [
  {
    key: 'lightningFast',
    descKey: 'lightningFastDesc',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    key: 'beautifulTemplates',
    descKey: 'beautifulTemplatesDesc',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
  },
  {
    key: 'shareAnywhere',
    descKey: 'shareAnywhereDesc',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
];

export default function Features() {
  const { t } = useTranslation();

  return (
    <section className="relative z-10 py-32 px-8 bg-surface/50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-fluid-lg font-bold mb-6">
              {t('everythingYouNeed')}
              <span className="text-gradient"> {t('standOut')}</span>
            </h2>
            <p className="text-textSecondary text-lg mb-8">
              {t('beautifulTemplatesDesc')}
            </p>

            <div className="space-y-6">
              {features.map((feature, i) => (
                <div
                  key={feature.key}
                  className="flex gap-4 animate-slide-up"
                  style={{ animationDelay: `${i * 100 + 400}ms` }}
                >
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-surface border border-border flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-textPrimary mb-1">{t(feature.key)}</h3>
                    <p className="text-textMuted">{t(feature.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-border">
              <div className="absolute inset-8 bg-surface rounded-2xl border border-border p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/20 mb-4" />
                <div className="space-y-3">
                  <div className="h-3 w-3/4 bg-textMuted/30 rounded" />
                  <div className="h-3 w-1/2 bg-textMuted/20 rounded" />
                  <div className="h-3 w-5/6 bg-textMuted/20 rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
