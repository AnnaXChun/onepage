import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import TemplatePreview from './components/TemplatePreview';
import CTA from './components/CTA';

function Home() {
  const { t } = useTranslation();
  const [user, setUser] = useState<{ username: string } | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Failed to parse user:', e);
        }
      } else {
        setUser(null);
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

  const Blob = ({ className, delay }: { className: string; delay: number }) => (
    <div
      className={`absolute rounded-full blur-[120px] opacity-30 animate-glow-pulse ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );

  return (
    <div className="min-h-screen bg-background text-textPrimary overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <Blob className="w-[600px] h-[600px] bg-primary -top-40 -left-40" delay={0} />
        <Blob className="w-[500px] h-[500px] bg-accent bottom-0 right-0" delay={1.5} />
        <Blob className="w-[400px] h-[400px] bg-primary/50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" delay={3} />
      </div>

      <Header user={user} onUserChange={handleUserChange} />

      <Hero />
      <TemplatePreview />
      <Features />
      <CTA />

      <footer className="relative z-10 py-12 px-8 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-textMuted text-sm">{t('allRightsReserved')}</p>
          <div className="flex gap-6 text-sm text-textMuted">
            <a href="#" className="hover:text-textPrimary transition-colors">{t('privacy')}</a>
            <a href="#" className="hover:text-textPrimary transition-colors">{t('terms')}</a>
            <a href="#" className="hover:text-textPrimary transition-colors">{t('contact')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
