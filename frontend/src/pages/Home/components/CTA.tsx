import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../../i18n';

export default function CTA() {
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
    <section className="relative z-10 py-32 px-8">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-fluid-lg font-bold mb-6">{t('readyToCreate')}</h2>
        <p className="text-secondary text-lg mb-10">
          {t('joinThousands')}
        </p>
        <button
          onClick={handleStartCreating}
          className="group relative px-10 py-5 bg-primary text-text-primary-btn font-semibold rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        >
          <span className="relative z-10 flex items-center gap-2">
            {t('createYourPage')}
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </span>
        </button>
      </div>
    </section>
  );
}
