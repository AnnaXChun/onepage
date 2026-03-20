import { useState } from 'react'
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

  const renderLanding = () => (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          <p className="text-sm uppercase tracking-widest text-gray-400 mb-6">Single Page Website Builder</p>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Create your
            <span className="block bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              online presence
            </span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Upload an image. Choose a template. Get a beautiful single-page website in seconds.
            No code required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setCurrentStep(STEPS.UPLOAD)}
              className="px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105"
            >
              Start Building — Free
            </button>
            <button className="px-8 py-4 border border-gray-700 text-white font-medium rounded-full hover:border-gray-500 transition-all duration-300">
              View Templates
            </button>
          </div>
        </div>

        <div className="absolute bottom-10 animate-bounce">
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6 bg-zinc-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Why choose Vibe Onepage?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Lightning Fast',
                desc: 'Generate your website in seconds. No waiting, no complexity.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                ),
                title: 'Beautiful Templates',
                desc: 'Professionally designed templates for every style.',
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                title: 'Share Anywhere',
                desc: 'Get a unique link to share your page with the world.',
              },
            ].map((feature, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-gray-400 group-hover:text-white group-hover:border-zinc-700 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Preview Section */}
      <section className="py-32 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Choose your style</h2>
            <p className="text-gray-500">Browse our collection of handcrafted templates</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: 'Minimal', color: 'from-zinc-800 to-zinc-900', accent: 'Zinc' },
              { name: 'Gallery', color: 'from-purple-900 to-zinc-900', accent: 'Purple' },
              { name: 'Vintage', color: 'from-amber-900 to-zinc-900', accent: 'Amber' },
              { name: 'Ultra', color: 'from-slate-800 to-zinc-900', accent: 'Slate' },
              { name: 'Creative', color: 'from-blue-900 to-zinc-900', accent: 'Blue' },
              { name: 'Dark', color: 'from-gray-900 to-zinc-900', accent: 'Dark' },
            ].map((template, i) => (
              <div
                key={i}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${template.color}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white/20">{template.name}</span>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    onClick={() => setCurrentStep(STEPS.UPLOAD)}
                    className="px-6 py-2 bg-white text-black font-medium rounded-full"
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-zinc-950">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to stand out?</h2>
          <p className="text-gray-400 mb-10">Join thousands of creators who built their online presence with Vibe Onepage.</p>
          <button
            onClick={() => setCurrentStep(STEPS.UPLOAD)}
            className="px-10 py-4 bg-white text-black font-semibold rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105"
          >
            Create Your Page Now
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-black border-t border-zinc-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">© 2024 Vibe Onepage. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
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
    <div className="min-h-screen bg-black text-white">
      {renderStep()}
    </div>
  )
}

export default Home
