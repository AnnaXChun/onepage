import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { useState, useEffect } from 'react';
import { getCredits } from '../../services/api';

interface AuthButtonsProps {
  user: { username: string; credits?: number } | null;
  onLogout: () => void;
  onAccountSettings?: () => void;
}

export default function AuthButtons({ user, onLogout, onAccountSettings }: AuthButtonsProps) {
  const { t } = useTranslation();
  const [credits, setCredits] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleAccountSettings = onAccountSettings || (() => {});

  useEffect(() => {
    if (user) {
      getCredits().then(setCredits).catch(() => {});
    }
  }, [user]);

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3 pl-4 border-l border-border hover:border-borderLight transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
            {user.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="font-medium text-primary">{user.username}</span>
          <span className="text-sm text-muted">
            {credits.toFixed(1)} credits
          </span>
          <svg
            className={`w-4 h-4 text-muted transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleAccountSettings();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium">{t('accountSettings')}</span>
                </button>
                <Link
                  to="/orders"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-medium">{t('myPages')}</span>
                </Link>
                <Link
                  to={`/user/${user.username}`}
                  onClick={() => setDropdownOpen(false)}
                  target="_blank"
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-secondary hover:text-primary hover:bg-background rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="text-sm font-medium">{t('viewProfile')}</span>
                </Link>
              </div>
              <div className="border-t border-border p-2">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-red-500 hover:bg-red-500/5 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-sm font-medium">{t('logout')}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link to="/login" className="btn-secondary !py-2 !px-6 !text-sm btn-hover">
        {t('signIn')}
      </Link>
      <Link
        to="/register"
        className="px-6 py-2 bg-primary hover:bg-primary-hover text-text-primary-btn font-medium rounded-full btn-hover transition-all text-sm"
      >
        {t('getStarted')}
      </Link>
    </div>
  );
}
