import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '../../i18n'

function ShareLink({ blog, onRestart }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  console.log('ShareLink received blog:', blog);
  console.log('ShareLink blog.coverImage:', blog?.coverImage ? 'present (length=' + blog.coverImage.length + ')' : 'NULL');

  const isLocalhost = window.location.hostname === 'localhost'
  const shareUrl = blog?.shareCode
    ? isLocalhost
      ? `http://localhost:5173/blog/${blog.shareCode}`
      : `https://vibe.page/blog/${blog.shareCode}`
    : `https://vibe.page/blog_${Date.now().toString(36)}`

  // Generate local preview URL (for testing without backend)
  const localPreviewUrl = blog
    ? `http://localhost:3000/preview?template=${blog.templateId || 'minimal-simple'}&name=${encodeURIComponent(blog.title || 'My Blog')}&bio=${encodeURIComponent('Welcome to my blog')}&content=${encodeURIComponent(blog.content || '')}&image=${encodeURIComponent(blog.coverImage || '')}`
    : null

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShare = (platform) => {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out my new blog!')}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    }
    window.open(urls[platform], '_blank', 'width=600,height=400')
  }

  return (
    <div className="min-h-screen bg-background text-primary flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-lg text-center">
          <div className="relative inline-block mb-8">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-scale-in shadow-2xl shadow-primary/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-primary rounded-full animate-pulse" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-accent rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          <h1 className="text-fluid-lg font-bold mb-4 animate-slide-up">{t('youreAllSet')}</h1>
          <p className="text-xl text-secondary mb-10 animate-slide-up stagger-1">{t('pageIsLive')}</p>

          <div className="bg-surface rounded-2xl p-6 mb-8 border border-border animate-slide-up stagger-2">
            <p className="text-sm text-muted mb-3">{t('yourUniqueLink')}</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-primary text-sm font-mono"
              />
              <button
                onClick={handleCopy}
                className={`px-6 py-3 font-medium rounded-xl transition-all duration-300 ${
                  copied
                    ? 'bg-success text-white'
                    : 'bg-primary text-text-primary-btn hover:scale-[1.02]'
                }`}
              >
                {copied ? t('copied') : t('copy')}
              </button>
            </div>

            {/* Local Preview URL - for testing without backend */}
            {localPreviewUrl && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted mb-3">Local Preview (Port 3000)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={localPreviewUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl text-primary text-xs font-mono truncate"
                  />
                  <button
                    onClick={() => window.open(localPreviewUrl, '_blank')}
                    className="px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors whitespace-nowrap"
                  >
                    Open Preview
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mb-10 animate-slide-up stagger-3">
            <p className="text-sm text-muted mb-4">{t('shareOnSocialMedia')}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleShare('twitter')}
                className="w-12 h-12 rounded-full bg-surface border border-border hover:border-borderLight flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-12 h-12 rounded-full bg-surface border border-border hover:border-borderLight flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-12 h-12 rounded-full bg-surface border border-border hover:border-borderLight flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up stagger-4">
            <button
              onClick={onRestart}
              className="px-8 py-3 border border-border text-secondary font-medium rounded-full hover:border-borderLight hover:text-primary transition-all duration-200"
            >
              {t('createAnotherPage')}
            </button>
            <Link
              to="/orders"
              className="px-8 py-3 bg-surface border border-border text-primary font-medium rounded-full hover:border-borderLight transition-all duration-200"
            >
              {t('viewMyOrders')}
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center">
        <p className="text-muted text-sm">{t('createYourOnlinePresence')}</p>
      </footer>
    </div>
  )
}

export default ShareLink
