import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import TemplatePreview from './components/TemplatePreview';
import CTA from './components/CTA';
import AccountSettings from '../../components/AccountSettings/AccountSettings';
import { useTranslation } from '../../i18n';

function Home() {
  const { t } = useTranslation();
  const [user, setUser] = useState<{ username: string; email?: string } | null>(null);
  const [showEmailBanner, setShowEmailBanner] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem('user');
      const emailBannerDismissed = localStorage.getItem('emailBannerDismissed');
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          // Show banner if user exists but has no email and hasn't dismissed
          if (parsedUser && !parsedUser.email && emailBannerDismissed !== 'true') {
            setShowEmailBanner(true);
          }
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      } else {
        setUser(null);
        setShowEmailBanner(false);
      }
    };

    loadUser();

    window.addEventListener('storage', loadUser);
    window.addEventListener('user-auth-change', loadUser);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('user-auth-change', loadUser);
    };
  }, []);

  const handleUserChange = (newUser: null) => {
    setUser(newUser);
  };

  const dismissEmailBanner = () => {
    setShowEmailBanner(false);
    localStorage.setItem('emailBannerDismissed', 'true');
  };

  const Blob = ({ className, delay }: { className: string; delay: number }) => (
    <div
      className={`absolute rounded-full blur-[120px] opacity-30 animate-glow-pulse ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );

  return (
    <div className="min-h-screen bg-background text-primary overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <Blob className="w-[600px] h-[600px] bg-primary -top-40 -left-40" delay={0} />
        <Blob className="w-[500px] h-[500px] bg-accent bottom-0 right-0" delay={1.5} />
        <Blob className="w-[400px] h-[400px] bg-primary/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" delay={3} />
      </div>

      <Header user={user} onUserChange={handleUserChange} onOpenAccountSettings={() => setShowAccountSettings(true)} />

      {showEmailBanner && (
        <div className="relative z-10 bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border">
          <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-primary">
                <span className="font-medium">Add your email</span>
                <span className="text-secondary ml-2">to receive notifications and recover your account</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAccountSettings(true)}
                className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg btn-hover transition-colors"
              >
                {t('addEmail')}
              </button>
              <button
                onClick={dismissEmailBanner}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-secondary hover:text-primary hover:bg-surface btn-hover transition-colors"
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <Hero />
      <TemplatePreview />
      <Features />
      <CTA />

      <footer className="relative z-10 py-12 px-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted text-sm">{t('allRightsReserved')}</p>
          <div className="flex gap-6 text-sm text-muted">
            <a href="#" className="hover:text-primary transition-colors">{t('privacy')}</a>
            <a href="#" className="hover:text-primary transition-colors">{t('terms')}</a>
            <a href="#" className="hover:text-primary transition-colors">{t('contact')}</a>
          </div>
        </div>
      </footer>

      <AccountSettings
        isOpen={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
      />
    </div>
  );
}

export default Home;
