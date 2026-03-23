import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { useState, useEffect, ReactNode } from 'react'
import { LanguageProvider } from './i18n'
import { BlogProvider, useBlog } from './context/BlogContext'
import { getBlogById } from './services/api'
import { saveBlocksToBackend } from './components/Editor/useAutoSave'
import { useEditorStore } from './stores/editorStore'
import Home from './pages/Home/Home'
import Profile from './pages/Profile/Profile'
import AnalyticsDashboard from './pages/Analytics/AnalyticsDashboard'
import Orders from './pages/Orders/Orders'
import BlogView from './pages/BlogView/BlogView'
import CreditTopup from './pages/Credit/CreditTopup'
import PdfExport from './pages/Pdf/PdfExport'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import TemplatesPage from './pages/Templates/Templates'
import Upload from './components/Upload/Upload'
import TemplateSelect from './components/TemplateSelect/TemplateSelect'
import Preview from './components/Preview/Preview'
import Payment from './components/Payment/Payment'
import ShareLink from './components/ShareLink/ShareLink'
import Editor from './components/Editor/Editor'
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
    console.log('[TemplatePage] location.state:', state);
    if (state?.uploadedImage) {
      setUploadedImage(state.uploadedImage)
    }
  }, [location.state])

  const handleSelect = (template: TemplateConfig) => {
    console.log('[TemplatePage] handleSelect:', { template, uploadedImage });
    setSelectedTemplate(template)
    // Navigate to Preview first - it will create the blog and then allow editing
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

  // Initialize from location.state directly - this takes priority
  const initialState = (location.state as LocationState | null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialState?.uploadedImage || null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(initialState?.selectedTemplate || null)
  const [isLoading, setIsLoading] = useState(false)

  console.log('[PreviewPage] Render:', { blogId, currentBlog, uploadedImage, selectedTemplate, locationState: location.state });

  // Load existing blog if blogId is in URL and we don't have uploadedImage from state
  useEffect(() => {
    const loadBlog = async () => {
      if (blogId && !uploadedImage) {
        setIsLoading(true)
        try {
          // If we have currentBlog with matching ID, use it
          if (currentBlog && currentBlog.id === Number(blogId)) {
            setUploadedImage(currentBlog.coverImage ?? null)
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
  }, [blogId, uploadedImage])

  // Update selectedTemplate from location.state if not already set
  useEffect(() => {
    const state = location.state as LocationState | null
    if (state?.selectedTemplate && !selectedTemplate) {
      setSelectedTemplate(state.selectedTemplate)
    }
  }, [location.state, selectedTemplate])

  // Handle successful blog creation
  const handleGenerated = (blog: { id: number }) => {
    // Update currentBlog in context with the new blog (includes coverImage)
    setCurrentBlog(blog as never)
    // Navigate to URL with blogId - but keep the current image and template in state
    navigate(`/preview/${blog.id}`, {
      replace: true,
      state: { uploadedImage, selectedTemplate }
    })
  }

  // Handle publish - go to success page with blogId
  const handleSuccess = (blog: { id: number; coverImage?: string; templateId?: string; title?: string; content?: string }) => {
    console.log('handleSuccess called with blog:', blog);
    console.log('handleSuccess coverImage:', blog?.coverImage ? 'present (length=' + blog.coverImage.length + ')' : 'NULL');
    if (blog?.id) {
      setCurrentBlog(blog as never)
      // Pass full blog data via navigation state
      navigate(`/success/${blog.id}`, {
        state: { blog }
      })
    }
  }

  // Handle edit - go to editor with blogId
  const handleEdit = (blog: { id: number; coverImage?: string; templateId?: string; title?: string; content?: string }) => {
    console.log('handleEdit called with blog:', blog);
    if (blog?.id) {
      setCurrentBlog(blog as never)
      navigate(`/editor/${blog.id}`, {
        state: { uploadedImage, selectedTemplate }
      })
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
        onEdit={handleEdit}
      />
    </ProtectedRoute>
  )
}

// Editor page - block editor
function EditorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { blogId } = useParams<{ blogId?: string }>()
  const { currentBlog } = useBlog()
  const blocks = useEditorStore((state) => state.blocks)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateConfig | null>(null)
  const [blocksJson, setBlocksJson] = useState<any>(null)

  // Load uploadedImage and selectedTemplate from navigation state
  useEffect(() => {
    const state = location.state as LocationState | null
    if (state?.uploadedImage) setUploadedImage(state.uploadedImage)
    if (state?.selectedTemplate) setSelectedTemplate(state.selectedTemplate)
    if (state?.blocksJson) setBlocksJson(state.blocksJson)
  }, [location.state])

  // Load blocks.json from selected template
  useEffect(() => {
    const loadBlocksJson = async () => {
      if (selectedTemplate?.blocksJsonPath && !blocksJson) {
        try {
          const response = await fetch(selectedTemplate.blocksJsonPath)
          const data = await response.json()
          setBlocksJson(data)
        } catch (err) {
          console.error('Failed to load blocks.json:', err)
        }
      }
    }
    loadBlocksJson()
  }, [selectedTemplate, blocksJson])

  // Load saved blocks from backend when editing existing blog (D-01)
  useEffect(() => {
    const loadSavedBlocks = async () => {
      if (blogId) {
        try {
          const response = await getBlogById(blogId);
          if (response.code === 200 && response.data?.blocks) {
            // Use saved blocks from backend, not template defaults
            const savedBlocks = JSON.parse(response.data.blocks);
            setBlocksJson({ blocks: savedBlocks });
          }
        } catch (err) {
          console.error('Failed to load saved blocks:', err);
        }
      }
    };
    loadSavedBlocks();
  }, [blogId]);

  const handleDone = async () => {
    // Trigger immediate save and wait for completion (D-05)
    // Note: Must call saveBlocksToBackend directly, NOT the debounced save() function
    // because save() from useDebouncedCallback returns void, not a Promise
    if (blogId || currentBlog?.id) {
      const targetBlogId = blogId || currentBlog?.id?.toString();
      if (targetBlogId) {
        await saveBlocksToBackend(targetBlogId, blocks);
      }
    }
    // Navigate to preview/payment flow
    if (currentBlog?.id) {
      navigate(`/preview/${currentBlog.id}`, {
        state: { uploadedImage, selectedTemplate }
      })
    } else {
      navigate('/template', { state: { uploadedImage } })
    }
  }

  const handleBack = () => {
    navigate('/template', { state: { uploadedImage } })
  }

  return (
    <ProtectedRoute requireAuth>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <Editor
          blogId={blogId || currentBlog?.id?.toString() || ''}
          initialBlocks={blocksJson}
        />
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-background transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleDone}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Done Editing →
          </button>
        </div>
      </div>
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
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  // Get blog from navigation state first (passed directly from handleSuccess)
  const blogFromState = location.state?.blog as { id: number; coverImage?: string; templateId?: string; title?: string; content?: string } | null

  console.log('SuccessPage blogFromState:', blogFromState);
  console.log('SuccessPage currentBlog:', currentBlog);

  useEffect(() => {
    const loadBlog = async () => {
      // If we have blog from navigation state, use it directly
      if (blogFromState && blogFromState.id === Number(blogId)) {
        console.log('Using blogFromState');
        setCurrentBlog(blogFromState as never)
        return
      }
      // Otherwise fetch from API
      if (blogId && (!currentBlog || currentBlog.id !== Number(blogId))) {
        setLoading(true)
        try {
          console.log('Fetching blog from API:', blogId);
          const response = await getBlogById(blogId)
          console.log('API response:', response);
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
  }, [blogId, blogFromState])

  const handleRestart = () => {
    navigate('/')
  }

  // Use blog from state if available, otherwise fall back to currentBlog from context
  const blog = blogFromState || currentBlog

  return (
    <ProtectedRoute requireAuth>
      <ShareLink
        blog={blog}
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
            <Route path="/editor/:blogId?" element={<EditorPage />} />
            <Route path="/preview/:blogId?" element={<PreviewPage />} />
            <Route path="/payment/:blogId" element={<PaymentPage />} />
            <Route path="/success/:blogId" element={<SuccessPage />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/credit/topup" element={<CreditTopup />} />
            <Route path="/pdf/export" element={<PdfExport />} />
            <Route path="/blog/:shareCode" element={<BlogView />} />
            <Route path="/user/:username" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BlogProvider>
    </LanguageProvider>
  )
}

export default App
