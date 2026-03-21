import { useState, useRef } from 'react'
import { useTranslation } from '../../i18n'

function Upload({ onUpload, onBack }) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleFile = (file) => {
    setUploading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    if (preview) {
      onUpload(preview)
    }
  }

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
          <h1 className="text-lg font-semibold">{t('uploadImage')}</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-8 pt-24 pb-12">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-center gap-2 mb-12">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-12 h-0.5 bg-border" />
            <div className="w-3 h-3 rounded-full bg-border" />
            <div className="w-12 h-0.5 bg-border" />
            <div className="w-3 h-3 rounded-full bg-border" />
          </div>

          <div
            className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5 scale-[1.02]'
                : 'border-border hover:border-borderLight bg-surface/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {preview ? (
              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-72 mx-auto rounded-2xl object-cover shadow-2xl"
                    />
                    <div className="absolute inset-0 bg-background/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-sm text-textSecondary">{t('clickToChange')}</span>
                    </div>
                  </div>
                </div>
                <p className="text-textMuted text-sm">{t('yourImageLooksGreat')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 mx-auto bg-surface rounded-2xl border border-border flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-textMuted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-xl font-semibold text-textPrimary mb-2">
                    {t('dropYourImageHere')}
                  </p>
                  <p className="text-textMuted text-sm">
                    {t('orClickToBrowse')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {preview && (
            <div className="mt-8 text-center animate-fade-in">
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="group relative px-10 py-4 bg-textPrimary text-background font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {uploading ? t('processing') : t('continue')}
                  {!uploading && (
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default Upload
