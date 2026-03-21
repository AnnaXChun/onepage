import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect, ReactNode } from 'react'
import { LanguageProvider } from './i18n'
import { BlogProvider, useBlog } from './context/BlogContext'
import { getBlogById } from './services/api'
import Home from './pages/Home/Home'
import Orders from './pages/Orders/Orders'
import BlogView from './pages/BlogView/BlogView'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import TemplatesPage from './pages/Templates/Templates'
import Upload from './components/Upload/Upload'
import TemplateSelect from './components/TemplateSelect/TemplateSelect'
import Preview from './components/Preview/Preview'
import Payment from './components/Payment/Payment'
import ShareLink from './components/ShareLink/ShareLink'
import type { User } from '@/types/models'
import type { TemplateConfig } from './config/templates'

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
}

interface LocationState {
  uploadedImage?: string;
  selectedTemplate?: TemplateConfig;
}

// Protected route wrapper that checks auth
function ProtectedRoute({ children, requireAuth = false }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('token')
      const savedUser = localStorage.getItem('user')
      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser))
        } catch {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    loadUser()
    window.addEventListener('user-auth-change', loadUser)
    window.addEventListener('storage', loadUser)

    return () => {
      window.removeEventListener('user-auth-change', loadUser)
      window.removeEventListener('storage', loadUser)
    }
  }, [])

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      const returnUrl = location.pathname + location.search
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`, { replace: true })
    }
  }, [user, loading, requireAuth, navigate, location])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  return <>{children}</>
}

// Upload page
function UploadPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [uploadedImage, setUploadedImage] = useState<string | null>(() => {
    return (location.state as LocationState)?.uploadedImage || null
  })

  const handleUpload = (imageData: string) => {
    navigate('/template', { state: { uploadedImage: imageData } })
  }

  return (
    <ProtectedRoute requireAuth>
      <Upload
        onUpload={handleUpload}
        onBack={() => navigate('/')}
      />
    </ProtectedRoute>
  )
}

// Template selection page
function TemplatePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null)

  useEffect(() => {
    const state = location.state as LocationState | null
    if (state?.uploadedImage) {
      setUploadedImage(state.uploadedImage)
    }
  }, [location.state])

  const handleSelect = (template: TemplateConfig) => {
    setSelectedTemplate(template)
    navigate('/preview', {
      state: {
        uploadedImage,
        selectedTemplate: template
      }
    })
  }

  return (
    <ProtectedRoute requireAuth>
      <TemplateSelect
        onSelect={handleSelect}
        onBack={() => navigate('/upload', { state: { uploadedImage } })}
      />
    </ProtectedRoute>
  )
}

// Preview page - handles both new blog creation and viewing existing
function PreviewPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { blogId } = useParams<{ blogId?: string }>()
  const { currentBlog, setCurrentBlog } = useBlog()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load existing blog if blogId is in URL
  useEffect(() => {
    const loadBlog = async () => {
      if (blogId) {
        setIsLoading(true)
        try {
          // If we have currentBlog with matching ID, use it
          if (currentBlog && currentBlog.id === Number(blogId)) {
            setUploadedImage(currentBlog.coverImage ?? null)
            // Template would need to be fetched separately or stored
          } else {
            // Fetch from API
            const response = await getBlogById(blogId)
            if (response.code === 200 && response.data) {
              setCurrentBlog(response.data)
              setUploadedImage(response.data.coverImage ?? null)
            }
          }
        } catch (err) {
          console.error('Failed to load blog:', err)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadBlog()
  }, [blogId])

  useEffect(() => {
    const state = location.state as LocationState | null
    if (state?.uploadedImage) {
      setUploadedImage(state.uploadedImage)
    }
    if (state?.selectedTemplate) {
      setSelectedTemplate(state.selectedTemplate)
    }
  }, [location.state])

  // Handle successful blog creation
  const handleGenerated = (blog: { id: number }) => {
    setCurrentBlog(blog as never)
    // Navigate to URL with blogId so it can be shared
    navigate(`/preview/${blog.id}`, { replace: true })
  }

  // Handle publish - go to success page with blogId
  const handleSuccess = () => {
    if (currentBlog) {
      navigate(`/success/${currentBlog.id}`)
    }
  }

  return (
    <ProtectedRoute requireAuth>
      <Preview
        blogId={blogId}
        blog={blogId ? currentBlog : null}
        image={uploadedImage}
        template={selectedTemplate}
        onGenerated={handleGenerated}
        onBack={() => navigate('/template', { state: { uploadedImage } })}
        onSuccess={handleSuccess}
      />
    </ProtectedRoute>
  )
}

// Payment page
function PaymentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { blogId } = useParams<{ blogId: string }>()
  const { currentBlog } = useBlog()
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null)

  useEffect(() => {
    const state = location.state as LocationState | null
    if (state?.uploadedImage) setUploadedImage(state.uploadedImage)
    if (state?.selectedTemplate) setSelectedTemplate(state.selectedTemplate)
  }, [location.state])

  const handleSuccess = () => {
    navigate(`/success/${currentBlog?.id}`)
  }

  return (
    <ProtectedRoute requireAuth>
      <Payment
        template={selectedTemplate}
        onSuccess={handleSuccess}
        onBack={() => navigate(`/preview/${blogId}`)}
      />
    </ProtectedRoute>
  )
}

// Success page - shows share link
function SuccessPage() {
  const { blogId } = useParams<{ blogId: string }>()
  const { currentBlog, setCurrentBlog } = useBlog()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadBlog = async () => {
      if (blogId && (!currentBlog || currentBlog.id !== Number(blogId))) {
        setLoading(true)
        try {
          const response = await getBlogById(blogId)
          if (response.code === 200 && response.data) {
            setCurrentBlog(response.data)
          }
        } catch (err) {
          console.error('Failed to load blog:', err)
        } finally {
          setLoading(false)
        }
      }
    }
    loadBlog()
  }, [blogId])

  const handleRestart = () => {
    navigate('/')
  }

  return (
    <ProtectedRoute requireAuth>
      <ShareLink
        blog={currentBlog}
        onRestart={handleRestart}
      />
    </ProtectedRoute>
  )
}

function App() {
  return (
    <LanguageProvider>
      <BlogProvider>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/templates/:templateId" element={<TemplatesPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/template" element={<TemplatePage />} />
            <Route path="/preview/:blogId?" element={<PreviewPage />} />
            <Route path="/payment/:blogId" element={<PaymentPage />} />
            <Route path="/success/:blogId" element={<SuccessPage />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/blog/:shareCode" element={<BlogView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BlogProvider>
    </LanguageProvider>
  )
}

export default App
