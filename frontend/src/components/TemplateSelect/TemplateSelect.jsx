import { useState, useEffect } from 'react'

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
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">Choose Template</h1>
          <div className="w-6" />
        </div>
      </header>

      {/* Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm uppercase tracking-widest text-gray-500 mb-3">Step 2 of 3</p>
            <h2 className="text-4xl font-bold mb-4">Select your template</h2>
            <p className="text-gray-500">Choose a template that matches your style</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                  selectedId === template.id
                    ? 'ring-2 ring-white ring-offset-4 ring-offset-black'
                    : ''
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${template.color}`} />
                <div className="relative aspect-[4/3]">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Tags */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-3 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
                          tag === 'Free'
                            ? 'bg-green-500/80 text-white'
                            : 'bg-purple-500/80 text-white'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Selected indicator */}
                  {selectedId === template.id && (
                    <div className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Bottom info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-300">{template.description}</p>
                    <div className="mt-2">
                      <span className="text-lg font-bold">
                        {template.price === 0 ? 'Free' : `$${template.price}`}
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
              className="px-12 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Continue with {templates.find((t) => t.id === selectedId)?.name || 'selected template'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TemplateSelect
