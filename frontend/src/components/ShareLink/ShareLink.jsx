import { useState } from 'react'

function ShareLink({ blog, onRestart }) {
  const [copied, setCopied] = useState(false)

  const shareUrl = blog?.shareCode
    ? `https://vibe.page/${blog.shareCode}`
    : `https://vibe.page/blog_${Date.now().toString(36)}`

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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg text-center">
          {/* Success Icon */}
          <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-4">You're all set!</h1>
          <p className="text-xl text-gray-400 mb-10">Your page is live and ready to share</p>

          {/* Share Link */}
          <div className="bg-zinc-900 rounded-2xl p-6 mb-8 border border-zinc-800">
            <p className="text-sm text-gray-500 mb-3">Your unique link</p>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm font-mono"
              />
              <button
                onClick={handleCopy}
                className={`px-6 py-3 font-medium rounded-xl transition-all ${
                  copied
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Social Share */}
          <div className="mb-10">
            <p className="text-sm text-gray-500 mb-4">Share on social media</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => handleShare('twitter')}
                className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-12 h-12 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Create Another */}
          <button
            onClick={onRestart}
            className="px-8 py-3 border border-zinc-700 text-gray-400 font-medium rounded-full hover:border-zinc-500 hover:text-white transition-all"
          >
            Create another page
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-gray-600 text-sm">© 2024 Vibe Onepage. Create your online presence.</p>
      </footer>
    </div>
  )
}

export default ShareLink
