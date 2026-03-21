const previewTemplates = [
  {
    title: 'Minimal',
    slug: 'minimal-simple',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=750&fit=crop',
    color: 'from-zinc-700 to-zinc-900',
  },
  {
    title: 'Gallery',
    slug: 'gallery-display',
    image: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=600&h=750&fit=crop',
    color: 'from-purple-700 to-zinc-900',
  },
  {
    title: 'Vintage',
    slug: 'vintage-style',
    image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=750&fit=crop',
    color: 'from-amber-700 to-zinc-900',
  },
];

export default function TemplatePreview() {
  return (
    <section className="relative z-10 px-8 py-20">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Beautiful Templates</h2>
          <p className="text-secondary">Choose from our collection of stunning designs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {previewTemplates.map((template, i) => (
            <div
              key={template.title}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer animate-scale-in"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {/* Background Image */}
              <img
                src={template.image}
                alt={template.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Gradient Overlay */}
              <div className={`absolute inset-0 bg-gradient-to-t ${template.color} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-300">
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-white/20 backdrop-blur-sm rounded-full text-white mb-3">
                    Template
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-1">{template.title}</h3>
                  <p className="text-white/70 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                    Click to preview
                  </p>
                </div>
              </div>

              {/* Hover Border Glow */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-white/0 group-hover:ring-white/30 transition-all duration-300 pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
