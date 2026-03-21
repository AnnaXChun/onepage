const previewTemplates = [
  {
    title: 'Minimal',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=750&fit=crop',
    color: 'from-zinc-700 to-zinc-900',
  },
  {
    title: 'Gallery',
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=600&h=750&fit=crop',
    color: 'from-purple-700 to-zinc-900',
  },
  {
    title: 'Vintage',
    image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=750&fit=crop',
    color: 'from-amber-700 to-zinc-900',
  },
];

export default function TemplatePreview() {
  return (
    <section className="relative z-10 px-8">
      <div className="relative mt-20 max-w-4xl mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {previewTemplates.map((template, i) => (
            <div
              key={template.title}
              className={`aspect-[4/5] rounded-2xl overflow-hidden animate-scale-in stagger-${i + 2}`}
              style={{ animationDelay: `${(i + 2) * 100}ms` }}
            >
              <div className="relative w-full h-full">
                <img
                  src={template.image}
                  alt={template.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${template.color} opacity-60`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-bold text-white/20">{template.title[0]}</span>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-lg font-semibold text-white drop-shadow-lg">{template.title}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
