import { useState, useEffect } from 'react'

import Header from '../../components/Header/Header'
import Upload from '../../components/Upload/Upload'
import TemplateSelect from '../../components/TemplateSelect/TemplateSelect'
import Preview from '../../components/Preview/Preview'
import Payment from '../../components/Payment/Payment'
import ShareLink from '../../components/ShareLink/ShareLink'

const STEPS = {
  LANDING: 'landing',
  UPLOAD: 'upload',
  TEMPLATE: 'template',
  PREVIEW: 'preview',
  PAYMENT: 'payment',
  SUCCESS: 'success',
}

function Home() {
  const [currentStep, setCurrentStep] = useState(STEPS.LANDING)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [generatedBlog, setGeneratedBlog] = useState(null)
  const [user, setUser] = useState(null)

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (e) {
        console.error('Failed to parse user:', e)
      }
    }
  }, [])

  const handleUserChange = (newUser) => {
    setUser(newUser)
  }

  const handleImageUpload = (imageData) => {
    setUploadedImage(imageData)
    setCurrentStep(STEPS.TEMPLATE)
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template)
    setCurrentStep(STEPS.PREVIEW)
  }

  const handlePreviewGenerated = (blog) => {
    setGeneratedBlog(blog)
    if (selectedTemplate?.price > 0) {
      setCurrentStep(STEPS.PAYMENT)
    } else {
      setCurrentStep(STEPS.SUCCESS)
    }
  }

  const handlePaymentSuccess = () => {
    setCurrentStep(STEPS.SUCCESS)
  }

  // Animated background blob
  const Blob = ({ className, delay }) => (
    <div
      className={`absolute rounded-full blur-[120px] opacity-30 animate-glow-pulse ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  )

  const renderLanding = () => (
    <div className="min-h-screen bg-background text-textPrimary overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <Blob className="w-[600px] h-[600px] bg-primary -top-40 -left-40" delay={0} />
        <Blob className="w-[500px] h-[500px] bg-accent bottom-0 right-0" delay={1.5} />
        <Blob className="w-[400px] h-[400px] bg-primary/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" delay={3} />
      </div>

      {/* Navigation */}
      <Header user={user} onUserChange={handleUserChange} />

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm text-textSecondary mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            No coding required
          </div>

          <h1 className="text-fluid-xl font-bold leading-[1.1] mb-8 animate-slide-up">
            Turn your image into a
            <span className="block text-gradient"> stunning website</span>
          </h1>

          <p className="text-lg md:text-xl text-textSecondary max-w-2xl mx-auto mb-12 animate-slide-up stagger-1">
            Upload a photo, pick a template, and get a beautiful single-page blog in seconds.
            Share your story with the world — no technical skills needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
            <button
              onClick={() => setCurrentStep(STEPS.UPLOAD)}
              className="group relative px-8 py-4 bg-textPrimary text-background font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Creating
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
            <button className="btn-secondary !py-4">
              View Templates
            </button>
          </div>
        </div>

        {/* Floating cards preview */}
        <div className="relative mt-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {[
              { title: 'Minimal', color: 'from-zinc-800 to-zinc-900' },
              { title: 'Gallery', color: 'from-purple-900 to-zinc-900' },
              { title: 'Vintage', color: 'from-amber-900 to-zinc-900' },
            ].map((template, i) => (
              <div
                key={i}
                className={`aspect-[4/5] rounded-2xl overflow-hidden animate-scale-in stagger-${i + 2}`}
                style={{ animationDelay: `${(i + 2) * 100}ms` }}
              >
                <div className={`w-full h-full bg-gradient-to-br ${template.color} flex items-center justify-center`}>
                  <span className="text-3xl font-bold text-white/10">{template.title[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section - Asymmetric layout */}
      <section className="relative z-10 py-32 px-8 bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-fluid-lg font-bold mb-6">
                Everything you need to
                <span className="text-gradient"> stand out</span>
              </h2>
              <p className="text-textSecondary text-lg mb-8">
                Beautiful templates, instant generation, and shareable links that make an impact.
              </p>

              <div className="space-y-6">
                {[
                  {
                    title: 'Lightning Fast',
                    desc: 'Generate your website in seconds. No waiting, no complexity.',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Beautiful Templates',
                    desc: 'Professionally designed templates for every style.',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                    ),
                  },
                  {
                    title: 'Share Anywhere',
                    desc: 'Get a unique link to share your page with the world.',
                    icon: (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    ),
                  },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 animate-slide-up" style={{ animationDelay: `${i * 100 + 400}ms` }}>
                    <div className="w-12 h-12 shrink-0 rounded-xl bg-surface border border-border flex items-center justify-center text-primary">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-textPrimary mb-1">{feature.title}</h3>
                      <p className="text-textMuted">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature visual - asymmetric */}
            <div className="relative">
              <div className="aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20 border border-border">
                <div className="absolute inset-8 bg-surface rounded-2xl border border-border p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 mb-4" />
                  <div className="space-y-3">
                    <div className="h-3 w-3/4 bg-textMuted/30 rounded" />
                    <div className="h-3 w-1/2 bg-textMuted/20 rounded" />
                    <div className="h-3 w-5/6 bg-textMuted/20 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-fluid-lg font-bold mb-6">Ready to create your page?</h2>
          <p className="text-textSecondary text-lg mb-10">
            Join thousands of creators who built their online presence with Vibe.
          </p>
          <button
            onClick={() => setCurrentStep(STEPS.UPLOAD)}
            className="group relative px-10 py-5 bg-textPrimary text-background font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Create Your Page Now
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-textMuted text-sm">© 2024 Vibe Onepage. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-textMuted">
            <a href="#" className="hover:text-textPrimary transition-colors">Privacy</a>
            <a href="#" className="hover:text-textPrimary transition-colors">Terms</a>
            <a href="#" className="hover:text-textPrimary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.LANDING:
        return renderLanding()
      case STEPS.UPLOAD:
        return <Upload onUpload={handleImageUpload} onBack={() => setCurrentStep(STEPS.LANDING)} />
      case STEPS.TEMPLATE:
        return <TemplateSelect onSelect={handleTemplateSelect} onBack={() => setCurrentStep(STEPS.UPLOAD)} />
      case STEPS.PREVIEW:
        return (
          <Preview
            image={uploadedImage}
            template={selectedTemplate}
            onGenerated={handlePreviewGenerated}
            onBack={() => setCurrentStep(STEPS.TEMPLATE)}
          />
        )
      case STEPS.PAYMENT:
        return (
          <Payment
            template={selectedTemplate}
            onSuccess={handlePaymentSuccess}
            onBack={() => setCurrentStep(STEPS.PREVIEW)}
          />
        )
      case STEPS.SUCCESS:
        return (
          <ShareLink
            blog={generatedBlog}
            onRestart={() => {
              setCurrentStep(STEPS.LANDING)
              setUploadedImage(null)
              setSelectedTemplate(null)
              setGeneratedBlog(null)
            }}
          />
        )
      default:
        return renderLanding()
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary">
      {renderStep()}
    </div>
  )
}

export default Home
