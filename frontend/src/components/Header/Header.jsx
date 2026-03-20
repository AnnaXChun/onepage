import { Link, useNavigate } from 'react-router-dom'
import { logout } from '../../services/api'

function Header({ user, onUserChange }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onUserChange(null)
    navigate('/')
  }

  return (
    <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight">Vibe</span>
      </Link>

      <div className="hidden md:flex items-center gap-8">
        <button className="text-textSecondary hover:text-textPrimary transition-colors">Templates</button>
        <button className="text-textSecondary hover:text-textPrimary transition-colors">Pricing</button>

        {user ? (
          <div className="flex items-center gap-4">
            <Link
              to="/orders"
              className="text-textSecondary hover:text-textPrimary transition-colors"
            >
              My Pages
            </Link>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                {user.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="font-medium text-textPrimary">{user.username}</span>
              <button
                onClick={handleLogout}
                className="text-textMuted hover:text-textSecondary text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn-secondary !py-2 !px-6 !text-sm">Sign In</Link>
            <Link to="/register" className="px-6 py-2 bg-textPrimary text-background font-medium rounded-full hover:scale-[1.02] transition-all text-sm">
              Get Started
            </Link>
          </>
        )}
      </div>

      {/* Mobile menu button */}
      <button className="md:hidden w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </nav>
  )
}

export default Header
