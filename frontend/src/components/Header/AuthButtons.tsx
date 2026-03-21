import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';

interface AuthButtonsProps {
  user: { username: string } | null;
  onLogout: () => void;
}

export default function AuthButtons({ user, onLogout }: AuthButtonsProps) {
  const { t } = useTranslation();

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          to="/orders"
          className="text-secondary hover:text-primary transition-colors"
        >
          {t('myPages')}
        </Link>
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
            {user.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <span className="font-medium text-primary">{user.username}</span>
          <button
            onClick={onLogout}
            className="text-muted hover:text-secondary text-sm transition-colors"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link to="/login" className="btn-secondary !py-2 !px-6 !text-sm">
        {t('signIn')}
      </Link>
      <Link
        to="/register"
        className="px-6 py-2 bg-primary text-text-primary-btn font-medium rounded-full hover:scale-[1.02] transition-all text-sm"
      >
        {t('getStarted')}
      </Link>
    </div>
  );
}
