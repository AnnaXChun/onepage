import { useState, useEffect } from 'react'
import { createBlog } from '../../services/api'

function Preview({ image, template, onGenerated, onBack }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const generateAndCreateBlog = async () => {
      try {
        // Create actual blog in database
        const blogData = {
          title: 'My Blog',
          content: 'Welcome to my personal blog! This is a blog generated from your image.\n\nWith advanced AI technology, we extract colors, style, and atmosphere from your photo to create a unique personal blog site. No coding knowledge required.\n\nShare your story with the world.',
          coverImage: image,
          templateId: template?.id || 'minimal-simple',
        }
        const response = await createBlog(blogData)
        if (response.code === 200 && response.data) {
          onGenerated(response.data)
        } else {
          setError(response.message || 'Failed to create blog')
        }
      } catch (err) {
        setError('Failed to create blog. Please try again.')
        console.error('Error creating blog:', err)
      } finally {
        setLoading(false)
      }
    }

    // Simulate generation delay, then create blog
    const timer = setTimeout(() => {
      generateAndCreateBlog()
    }, 2000)
    return () => clearTimeout(timer)
  }, [image, template])

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-textPrimary flex flex-col">
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
            <h1 className="text-lg font-semibold">Generating...</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-8 pt-24">
          <div className="text-center">
            {/* Animated spinner */}
            <div className="w-20 h-20 mx-auto mb-8 relative">
              <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-2 border-4 border-transparent border-t-accent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
            </div>
            <h2 className="text-2xl font-bold mb-4 animate-fade-in">Creating your page</h2>
            <p className="text-textMuted animate-fade-in stagger-1">This only takes a few seconds...</p>

            {/* Decorative blobs */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-glow-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary">
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
          <h1 className="text-lg font-semibold">Preview</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pt-24 pb-12 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-12 h-0.5 bg-border" />
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-12 h-0.5 bg-border" />
            <div className="w-3 h-3 rounded-full bg-primary" />
          </div>

          <div className="text-center mb-8">
            <p className="text-sm uppercase tracking-widest text-textMuted mb-3">Step 3 of 3</p>
            <h2 className="text-fluid-lg font-bold mb-4">Your page is ready</h2>
            <p className="text-textSecondary">Here's a preview of your new blog</p>
          </div>

          {/* Preview Card - realistic blog look */}
          <div className="rounded-3xl overflow-hidden bg-surface border border-border animate-scale-in">
            {/* Cover */}
            <div className="relative h-72">
              {image && (
                <img
                  src={image}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl font-bold">My Blog</h1>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <p className="text-textSecondary leading-relaxed mb-6">
                Welcome to my personal blog! This is a blog generated from your image.
                With advanced AI technology, we extract colors, style, and atmosphere from your photo
                to create a unique personal blog site. No coding knowledge required.
              </p>
              <p className="text-textSecondary leading-relaxed">
                Share your story with the world. Your unique link will be ready after publishing.
              </p>

              {/* Template info */}
              <div className="mt-8 pt-6 border-t border-border flex items-center gap-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${template?.color || 'from-zinc-700 to-zinc-900'}`}>
                  {template?.thumbnail && (
                    <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover rounded-xl" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-textMuted">Template</p>
                  <p className="font-semibold text-textPrimary">{template?.name || 'Minimal'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-border text-textSecondary font-medium rounded-full hover:border-borderLight hover:text-textPrimary transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Preview
