import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getBlogByShareCode } from '../../services/api'

// Template configurations
const templateStyles = {
  'minimal-simple': {
    name: 'Minimal',
    color: 'from-zinc-700 to-zinc-900',
    textColor: 'text-zinc-100',
    accentColor: 'bg-zinc-600',
  },
  'gallery-display': {
    name: 'Gallery',
    color: 'from-purple-700 to-zinc-900',
    textColor: 'text-purple-100',
    accentColor: 'bg-purple-600',
  },
  'vintage-style': {
    name: 'Vintage',
    color: 'from-amber-700 to-zinc-900',
    textColor: 'text-amber-100',
    accentColor: 'bg-amber-600',
  },
  'ultra-minimal': {
    name: 'Ultra',
    color: 'from-slate-700 to-zinc-900',
    textColor: 'text-slate-100',
    accentColor: 'bg-slate-600',
  },
  'creative-card': {
    name: 'Creative',
    color: 'from-blue-700 to-zinc-900',
    textColor: 'text-blue-100',
    accentColor: 'bg-blue-600',
  },
}

function BlogView() {
  const { shareCode } = useParams()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        const response = await getBlogByShareCode(shareCode)
        if (response.code === 200 && response.data) {
          setBlog(response.data)
        } else {
          setError('Blog not found')
        }
      } catch (err) {
        setError('Failed to load blog')
        console.error('Error fetching blog:', err)
      } finally {
        setLoading(false)
      }
    }

    if (shareCode) {
      fetchBlog()
    }
  }, [shareCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 border-4 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
          <p className="text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4 text-zinc-700">404</h1>
          <p className="text-xl text-zinc-400 mb-8">{error || 'Blog not found'}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition-colors"
          >
            Create your own blog
          </Link>
        </div>
      </div>
    )
  }

  const template = templateStyles[blog.templateId] || templateStyles['minimal-simple']

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Background gradient */}
      <div className={`fixed inset-0 bg-gradient-to-br ${template.color} opacity-50`} />

      {/* Header */}
      <header className="relative z-10 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white to-zinc-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">Vibe</span>
          </Link>
          <a
            href="https://vibepage.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Create your own →
          </a>
        </div>
      </header>

      {/* Hero/Cover */}
      {blog.coverImage && (
        <div className="relative h-96 md:h-[500px] overflow-hidden">
          <img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
        </div>
      )}

      {/* Content */}
      <main className="relative z-10 px-8 -mt-32">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
            {blog.title || 'Untitled'}
          </h1>

          {/* Content */}
          <div className="prose prose-invert prose-lg max-w-none">
            <div
              className="text-zinc-300 leading-relaxed whitespace-pre-wrap"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {blog.content || 'No content yet.'}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                <span className="text-lg font-bold">{template.name[0]}</span>
              </div>
              <div>
                <p className="text-sm text-zinc-500">Template</p>
                <p className="font-medium text-white">{template.name}</p>
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-medium rounded-full hover:bg-zinc-200 transition-colors"
            >
              Create your own
            </Link>
          </div>
        </div>
      </main>

      {/* Bottom padding */}
      <footer className="relative z-10 py-12 text-center text-zinc-600 text-sm">
        <p>Powered by <span className="text-white">Vibe Onepage</span></p>
      </footer>
    </div>
  )
}

export default BlogView
