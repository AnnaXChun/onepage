import { useState } from 'react'

const defaultTemplates = [
  {
    id: 'minimal-simple',
    name: 'Minimal',
    description: 'Clean and simple single-column layout',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop',
    price: 0,
    tags: ['Free', 'Minimal'],
    color: 'from-zinc-700 to-zinc-900',
  },
  {
    id: 'gallery-display',
    name: 'Gallery',
    description: 'Image-focused grid layout',
    thumbnail: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=600&h=400&fit=crop',
    price: 0,
    tags: ['Free', 'Photo'],
    color: 'from-purple-700 to-zinc-900',
  },
  {
    id: 'vintage-style',
    name: 'Vintage',
    description: 'Warm retro aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=600&h=400&fit=crop',
    price: 9.9,
    tags: ['Pro', 'Style'],
    color: 'from-amber-700 to-zinc-900',
  },
  {
    id: 'ultra-minimal',
    name: 'Ultra',
    description: 'Maximum whitespace, essential elements only',
    thumbnail: 'https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?w=600&h=400&fit=crop',
    price: 9.9,
    tags: ['Pro', 'Minimal'],
    color: 'from-slate-700 to-zinc-900',
  },
  {
    id: 'creative-card',
    name: 'Creative',
    description: 'Card-based creative layout',
    thumbnail: 'https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&h=400&fit=crop',
    price: 19.9,
    tags: ['Pro', 'Creative'],
    color: 'from-blue-700 to-zinc-900',
  },
]

function TemplateSelect({ onSelect, onBack }) {
  const [templates] = useState(defaultTemplates)
  const [selectedId, setSelectedId] = useState(null)

  const handleSelect = (template) => {
    setSelectedId(template.id)
  }

  const handleConfirm = () => {
    const template = templates.find((t) => t.id === selectedId)
    if (template) {
      onSelect(template)
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-textSecondary hover:text-textPrimary hover:border-borderLight transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Choose Template</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-12 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-12 h-0.5 bg-border" />
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-12 h-0.5 bg-border" />
            <div className="w-3 h-3 rounded-full bg-border" />
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-textMuted mb-3">Step 2 of 3</p>
            <h2 className="text-fluid-lg font-bold mb-4">Select your template</h2>
            <p className="text-textSecondary">Choose a template that matches your style</p>
          </div>

          {/* Templates Grid - asymmetric layout */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template, i) => (
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
                {/* Background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${template.color}`} />

                {/* Image */}
                <div className="relative aspect-[4/3]">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

                  {/* Tags */}
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
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Selected indicator */}
                  {selectedId === template.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center animate-scale-in">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold mb-1">{template.name}</h3>
                    <p className="text-sm text-textSecondary">{template.description}</p>
                    <div className="mt-2">
                      <span className={`text-lg font-bold ${template.price === 0 ? 'text-success' : 'text-primary'}`}>
                        {template.price === 0 ? 'Free' : `$${template.price}`}
                      </span>
                    </div>
                  </div>
                </div>
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

export default TemplateSelect
