import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { TEMPLATES } from '../../config/templates'
import { useTranslation } from '../../i18n'

function TemplatesPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { templateId } = useParams()
  const { t } = useTranslation()
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (templateId) {
      const template = TEMPLATES.find(t => t.id === Number(templateId))
      if (template) {
        setPreviewTemplate(template)
      }
    } else {
      setPreviewTemplate(null)
    }
  }, [templateId])

  const handleTemplateClick = (template) => {
    navigate(`/templates/${template.id}`)
  }

  const handleBack = () => {
    navigate('/')
  }

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
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUseTemplate = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login', {
        state: {
          returnUrl: `/templates/${previewTemplate.id}`,
          uploadedImage,
          templateId: previewTemplate.id
        }
      })
      return
    }

    if (previewTemplate && uploadedImage) {
      navigate('/preview', {
        state: {
          uploadedImage,
          selectedTemplate: previewTemplate
        }
      })
    }
  }

  const handleClosePreview = () => {
    setPreviewTemplate(null)
    setUploadedImage(null)
    navigate('/templates')
  }

  if (previewTemplate) {
    return (
      <div className="min-h-screen bg-background text-primary">
        <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <button
              onClick={handleClosePreview}
              className="flex items-center gap-2 text-secondary hover:text-primary btn-hover transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>{t('allTemplates')}</span>
            </button>
            <h1 className="text-base font-semibold text-primary">
              {previewTemplate.name} {t('template')}
            </h1>
            <div className="w-16" />
          </div>
        </header>

        <main className="pt-14 h-screen flex">
          <div className="flex-1 p-6 bg-zinc-100 dark:bg-zinc-900">
            <div className="h-full rounded-2xl overflow-hidden bg-white shadow-2xl">
              <TemplatePreview template={previewTemplate} uploadedImage={uploadedImage} />
            </div>
          </div>

          <div className="w-80 p-6 border-l border-border bg-background/50 backdrop-blur-lg overflow-y-auto">
            <div className="bg-surface/80 backdrop-blur-2xl rounded-2xl border border-border p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-primary mb-1">
                  {previewTemplate.name}
                </h3>
                <p className="text-sm text-muted">
                  {previewTemplate.price === 0 ? t('free') : `$${previewTemplate.price}`}
                </p>
              </div>

              <div
                className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : uploadedImage
                    ? 'border-success bg-success/5'
                    : 'border-border hover:border-borderLight bg-background/50'
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

                {uploadedImage ? (
                  <div className="space-y-4">
                    <div className="relative group">
                      <img
                        src={uploadedImage}
                        alt="Uploaded"
                        className="max-h-40 mx-auto rounded-xl object-cover shadow-lg"
                      />
                      <div className="absolute inset-0 bg-background/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-sm text-secondary">{t('clickToChange')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-success">{t('imageUploaded')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-background rounded-xl border border-border flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-muted"
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
                    <div>
                      <p className="text-sm font-medium text-primary mb-1">
                        {t('uploadYourImage')}
                      </p>
                      <p className="text-xs text-muted">
                        {t('clickOrDragToUpload')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleUseTemplate}
                disabled={!uploadedImage}
                className="w-full mt-6 py-3 bg-primary hover:bg-primary-hover text-text-primary-btn font-medium rounded-xl overflow-hidden transition-all duration-300 btn-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {previewTemplate.price > 0 ? `${t('buyFor')} $${previewTemplate.price}` : t('useThisTemplate')}
              </button>

              <button
                onClick={handleClosePreview}
                className="w-full mt-3 py-2 text-sm text-muted hover:text-primary btn-hover transition-colors"
              >
                {t('chooseAnotherTemplate')}
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background/95 backdrop-blur-lg overflow-y-auto">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center text-secondary hover:text-primary hover:border-borderLight btn-hover transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold">{t('chooseTemplate')}</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 animate-slide-up">{t('exploreTemplates')}</h2>
            <p className="text-secondary text-lg animate-slide-up stagger-1">
              {t('choosePerfectTemplate')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {TEMPLATES.map((template, i) => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out hover:scale-105 hover:z-10 animate-slide-up ${
                  'hover:shadow-xl hover:shadow-black/20'
                }`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="relative aspect-[3/4]">
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${template.color} opacity-50 group-hover:opacity-70 transition-opacity duration-300`} />

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
                        {tag === 'Free' ? t('free') : tag}
                      </span>
                    ))}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className="text-xl font-bold text-white mb-1 transform translate-y-0 group-hover:translate-y-0 transition-transform duration-300">
                      {template.name}
                    </h3>
                    <p className="text-sm text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                      {template.description}
                    </p>
                    <div className="mt-2">
                      <span className={`text-lg font-bold ${template.price === 0 ? 'text-green-400' : 'text-white'}`}>
                        {template.price === 0 ? t('free') : `$${template.price}`}
                      </span>
                    </div>
                  </div>

                  <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-full shadow-lg">
                      {t('clickToPreview')}
                    </span>
                  </div>
                </div>

                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r ${template.color} blur-xl opacity-20`} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function TemplatePreview({ template, uploadedImage }) {
  const [previewHTML, setPreviewHTML] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const userImage = uploadedImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=800&fit=crop'

  useEffect(() => {
    if (!template) return

    setLoading(true)
    setError(null)
    setPreviewHTML(null)

    const templateBase = `/templates/${template.slug}`

    Promise.all([
      fetch(`${templateBase}/index.html`).then(r => {
        if (!r.ok) throw new Error(`Failed to load index.html: ${r.status}`)
        return r.text()
      }),
      fetch(`${templateBase}/styles.css`).then(r => {
        if (!r.ok) throw new Error(`Failed to load styles.css: ${r.status}`)
        return r.text()
      })
    ]).then(([htmlText, cssText]) => {
      // More robust CSS injection - handle various HTML structures
      let modifiedHtml = htmlText

      // Replace placeholders
      modifiedHtml = modifiedHtml
        .replace(/{{USER_IMAGE}}/g, userImage)
        .replace(/{{USER_NAME}}/g, 'Your Name')
        .replace(/{{USER_BIO}}/g, 'Welcome to my personal blog')
        .replace(/{{BLOG_CONTENT}}/g, '<p>Your blog content will appear here...</p>')

      // Inject CSS before </head> (case insensitive)
      modifiedHtml = modifiedHtml.replace(/<\/head>/i, `<style>${cssText}</style></head>`)

      setPreviewHTML(modifiedHtml)
      setLoading(false)
    }).catch(err => {
      console.error('Failed to load template:', err)
      setError(err.message)
      setLoading(false)
    })
  }, [template, userImage])

  if (!template) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <p className="text-zinc-500">No template selected</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-zinc-300 border-t-primary rounded-full animate-spin" />
          <p className="text-zinc-500">Loading template...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <div className="text-center p-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-500 font-medium mb-2">Failed to load template</p>
          <p className="text-zinc-500 text-sm">{error}</p>
          <p className="text-zinc-400 text-xs mt-2">Template: {template.id}</p>
        </div>
      </div>
    )
  }

  if (!previewHTML) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <p className="text-zinc-500">Preparing preview...</p>
      </div>
    )
  }

  return (
    <iframe
      srcDoc={previewHTML}
      className="w-full h-full rounded-xl border border-border bg-white"
      title={template.name}
      sandbox="allow-same-origin allow-scripts"
    />
  )
}

export default TemplatesPage
