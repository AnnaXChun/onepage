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

const showcaseTemplate = {
  name: 'Glass',
  image: 'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=600&h=750&fit=crop',
  color: 'from-blue-500 to-zinc-900',
};

export default function Features() {
  const { t } = useTranslation();

  return (
    <section className="relative z-10 py-32 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-fluid-lg font-bold mb-6">
              {t('everythingYouNeed')}
              <span className="text-gradient"> {t('standOut')}</span>
            </h2>
            <p className="text-secondary text-lg mb-8">
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
                    <h3 className="font-semibold text-primary mb-1">{t(feature.key)}</h3>
                    <p className="text-muted">{t(feature.descKey)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Phone Frame */}
            <div className="relative mx-auto w-64 md:w-72">
              {/* Phone Body */}
              <div className="rounded-[3rem] bg-gradient-to-b from-zinc-800 to-zinc-900 p-2 shadow-2xl shadow-primary/20">
                <div className="rounded-[2.5rem] overflow-hidden bg-background border border-zinc-700">
                  {/* Status Bar */}
                  <div className="h-6 bg-zinc-900 flex items-center justify-center">
                    <div className="w-16 h-3 bg-zinc-800 rounded-full" />
                  </div>

                  {/* Screen Content */}
                  <div className="relative aspect-[9/16] overflow-hidden">
                    <img
                      src={showcaseTemplate.image}
                      alt={showcaseTemplate.name}
                      className="w-full h-full object-cover"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${showcaseTemplate.color} opacity-40`} />
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-3" />
                      <div className="h-3 w-3/4 bg-white/30 rounded mb-2" />
                      <div className="h-2 w-1/2 bg-white/20 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
