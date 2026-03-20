import { useState } from 'react'
import { Link } from 'react-router-dom'

const templates = [
  {
    id: 'minimal-simple',
    name: 'Minimal',
    description: 'Clean and simple single-column layout',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=800&fit=crop',
    price: 0,
    tags: ['Free', 'Minimal'],
    color: 'from-zinc-700 to-zinc-900',
  },
  {
    id: 'gallery-display',
    name: 'Gallery',
    description: 'Image-focused grid layout',
    thumbnail: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=600&h=800&fit=crop',
    price: 0,
    tags: ['Free', 'Photo'],
    color: 'from-purple-700 to-zinc-900',
  },
  {
    id: 'vintage-style',
    name: 'Vintage',
    description: 'Warm retro aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=800&fit=crop',
    price: 9.9,
    tags: ['Pro', 'Style'],
    color: 'from-amber-700 to-zinc-900',
  },
  {
    id: 'ultra-minimal',
    name: 'Ultra',
    description: 'Maximum whitespace, essential elements only',
    thumbnail: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=600&h=800&fit=crop',
    price: 9.9,
    tags: ['Pro', 'Minimal'],
    color: 'from-slate-700 to-zinc-900',
  },
  {
    id: 'creative-card',
    name: 'Creative',
    description: 'Card-based creative layout',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&h=800&fit=crop',
    price: 19.9,
    tags: ['Pro', 'Creative'],
    color: 'from-blue-700 to-zinc-900',
  },
  {
    id: 'bold-statement',
    name: 'Bold',
    description: 'Eye-catching bold typography',
    thumbnail: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=600&h=800&fit=crop',
    price: 14.9,
    tags: ['Pro', 'Bold'],
    color: 'from-red-700 to-zinc-900',
  },
  {
    id: 'elegant-refined',
    name: 'Elegant',
    description: 'Sophisticated and refined design',
    thumbnail: 'https://images.unsplash.com/photo-1614851099511-773084f6911d?w=600&h=800&fit=crop',
    price: 14.9,
    tags: ['Pro', 'Elegant'],
    color: 'from-rose-700 to-zinc-900',
  },
  {
    id: 'modern-tech',
    name: 'Modern',
    description: 'Sleek modern tech aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1635776062360-af423602aff3?w=600&h=800&fit=crop',
    price: 9.9,
    tags: ['Pro', 'Tech'],
    color: 'from-cyan-700 to-zinc-900',
  },
  {
    id: 'nature-fresh',
    name: 'Nature',
    description: 'Fresh and natural vibes',
    thumbnail: 'https://images.unsplash.com/photo-1614850715649-1d0106293bd1?w=600&h=800&fit=crop',
    price: 9.9,
    tags: ['Pro', 'Nature'],
    color: 'from-green-700 to-zinc-900',
  },
  {
    id: 'dark-cyber',
    name: 'Dark',
    description: 'Cool dark cyberpunk style',
    thumbnail: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&h=800&fit=crop',
    price: 9.9,
    tags: ['Pro', 'Dark'],
    color: 'from-violet-700 to-zinc-900',
  },
]

function TemplateGallery({ onClose, onSelect }) {
  const [selectedId, setSelectedId] = useState(null)

  const handleSelect = (template) => {
    setSelectedId(template.id)
  }

  const handleConfirm = () => {
    const template = templates.find((t) => t.id === selectedId)
    if (template && onSelect) {
      onSelect(template)
    }
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-lg overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-textSecondary hover:text-textPrimary hover:border-borderLight transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Choose Template</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <main className="py-12 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 animate-slide-up">Explore Our Templates</h2>
            <p className="text-textSecondary text-lg animate-slide-up stagger-1">
              Choose the perfect template for your personal blog
            </p>
          </div>

          {/* Templates Grid - Masonry style */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template, i) => (
              <div
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-105 hover:z-10 animate-slide-up ${
                  selectedId === template.id
                    ? 'ring-4 ring-primary ring-offset-4 ring-offset-background scale-105 z-10 shadow-2xl shadow-primary/30'
                    : 'hover:shadow-xl hover:shadow-black/20'
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Image */}
                <div className="relative aspect-[3/4]">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${template.color} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />

                  {/* Tags */}
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

                  {/* Selected indicator */}
                  {selectedId === template.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-scale-in shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Bottom info */}
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
                </div>

                {/* Glow effect on hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r ${template.color} blur-xl opacity-20`} />
              </div>
            ))}
          </div>

          {/* Continue button */}
          <div className="mt-12 text-center">
            <button
              onClick={handleConfirm}
              disabled={!selectedId}
              className="group relative px-12 py-4 bg-textPrimary text-background font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center gap-2">
                Continue with {templates.find((t) => t.id === selectedId)?.name || 'selected template'}
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export { templates }
export default TemplateGallery
