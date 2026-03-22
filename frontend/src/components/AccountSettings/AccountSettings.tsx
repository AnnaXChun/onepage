import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { getUserInfo, updateEmail } from '../../services/api';
import { useTranslation } from '../../i18n';

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCurrentEmail();
    }
  }, [isOpen]);

  const loadCurrentEmail = async () => {
    try {
      const response = await getUserInfo();
      if (response.code === 200 && response.data) {
        setEmail(response.data.email || '');
        setOriginalEmail(response.data.email || '');
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
      setError(t('failedToLoadUserInfo'));
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Validate email
    if (!email || email.trim() === '') {
      setError(t('emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('invalidEmail'));
      return;
    }

    // Check if email changed
    if (email.trim() === originalEmail.trim()) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await updateEmail(email.trim());
      setSuccess(t('emailUpdatedSuccess'));
      // Update localStorage user data
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        user.email = email.trim();
        localStorage.setItem('user', JSON.stringify(user));
        // Dispatch event to update UI
        window.dispatchEvent(new Event('user-auth-change'));
      }
      // Close modal after short delay to show success
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      if (errorMsg.includes('EMAIL_ALREADY_EXISTS') || errorMsg.includes('already registered')) {
        setError(t('emailAlreadyRegistered'));
      } else {
        setError(t('emailUpdateFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSave();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('accountSettings')} size="sm">
      <div className="space-y-5" onKeyDown={handleKeyDown}>
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm">
            {success}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            {t('emailAddress')}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-primary placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
            placeholder={t('enterYourEmail')}
            disabled={loading}
          />
          <p className="mt-2 text-xs text-muted">
            {t('emailVerificationNote')}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-surface border border-border text-primary font-medium rounded-xl hover:bg-background transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || email === originalEmail}
            className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
