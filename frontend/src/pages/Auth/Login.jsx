import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../../services/api'

function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(formData)
      if (response.code === 200 && response.data?.token) {
        localStorage.setItem('token', response.data.token)
        // Store user info from form data since backend doesn't return user object
        const userInfo = { username: formData.username }
        localStorage.setItem('user', JSON.stringify(userInfo))
        // Use navigate for client-side routing
        navigate('/')
        // Force re-render by dispatching a custom event
        window.dispatchEvent(new Event('user-auth-change'))
      } else {
        setError(response.message || '登录失败')
      }
    } catch (err) {
      setError('用户名或密码错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-textPrimary flex flex-col">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-glow-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6">
        <Link to="/" className="flex items-center gap-3 max-w-6xl mx-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold">Vibe</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-3xl p-8 border border-border">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
              <p className="text-textSecondary">Sign in to continue</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-textPrimary text-background font-semibold rounded-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-textSecondary text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-textMuted text-sm">© 2024 Vibe Onepage. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default Login
