import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { logout } from '../../services/api';
import { useTranslation } from '../../i18n';
import MobileMenu from './MobileMenu';
import AuthButtons from './AuthButtons';

interface HeaderProps {
  user: { username: string } | null;
  onUserChange: (user: null) => void;
  onOpenAccountSettings?: () => void;
}

export default function Header({ user, onUserChange, onOpenAccountSettings }: HeaderProps) {
  const navigate = useNavigate();
  const { language, t, toggleLanguage } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onUserChange(null);
    navigate('/');
  };

  return (
    <>
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
          <Link
            to="/templates"
            className="text-secondary hover:text-primary transition-colors"
          >
            {t('templates')}
          </Link>
          <button className="text-secondary hover:text-primary transition-colors">
            {t('pricing')}
          </button>

          <AuthButtons user={user} onLogout={handleLogout} onAccountSettings={onOpenAccountSettings} />

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="ml-4 px-3 py-1.5 text-sm font-medium rounded-lg bg-surface border border-border hover:border-borderLight btn-hover transition-colors"
          >
            {language === 'en' ? '中文' : 'EN'}
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden w-10 h-10 rounded-xl bg-surface border border-border flex items-center justify-center btn-hover"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
