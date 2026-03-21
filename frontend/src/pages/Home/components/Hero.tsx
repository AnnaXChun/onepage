import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n';

export default function Hero() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleStartCreating = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { returnUrl: '/upload' } });
      return;
    }
    navigate('/upload');
  };

  return (
    <section className="relative z-10 pt-20 pb-32 px-8">
      <div className="max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm text-secondary mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          {t('noCodingRequired')}
        </div>

        <h1 className="text-fluid-xl font-bold leading-[1.1] mb-8 animate-slide-up">
          {t('turnImageInto')}
          <span className="block text-gradient">{t('stunningWebsite')}</span>
        </h1>

        <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-12 animate-slide-up stagger-1">
          {t('uploadPhoto')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
          <button
            onClick={handleStartCreating}
            className="group relative px-8 py-4 bg-primary text-text-primary-btn font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02]"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t('startCreating')}
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </button>
          <button
            onClick={() => navigate('/templates')}
            className="btn-secondary !py-4"
          >
            {t('viewTemplates')}
          </button>
        </div>
      </div>
    </section>
  );
}
