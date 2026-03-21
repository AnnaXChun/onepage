import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: { username: string } | null;
  onLogout: () => void;
}

export default function MobileMenu({ isOpen, onClose, user, onLogout }: MobileMenuProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onClose();
        }}
      />

      {/* Menu panel */}
      <div className="absolute right-0 top-0 h-full w-72 bg-surface border-l border-border p-6 flex flex-col gap-6 animate-slide-up">
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-secondary hover:text-primary transition-all"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          <Link
            to="/templates"
            onClick={onClose}
            className="px-4 py-3 text-secondary hover:text-primary hover:bg-background rounded-xl transition-colors"
          >
            {t('templates')}
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-3 text-left text-secondary hover:text-primary hover:bg-background rounded-xl transition-colors"
          >
            {t('pricing')}
          </button>
          {user && (
            <Link
              to="/orders"
              onClick={onClose}
              className="px-4 py-3 text-secondary hover:text-primary hover:bg-background rounded-xl transition-colors"
            >
              {t('myPages')}
            </Link>
          )}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3 bg-background rounded-xl">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                  {user.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="font-medium text-primary">{user.username}</span>
              </div>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-3 text-muted hover:text-secondary text-sm transition-colors text-left"
              >
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={onClose}
                className="w-full text-center px-4 py-3 border border-border text-secondary hover:text-primary hover:border-borderLight rounded-xl transition-all text-sm font-medium"
              >
                {t('signIn')}
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="w-full text-center px-4 py-3 bg-primary text-text-primary-btn font-medium rounded-xl hover:scale-[1.02] transition-all text-sm"
              >
                {t('getStarted')}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
