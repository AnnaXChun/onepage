import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { getUserInfo, updateEmail, uploadImage, updateProfile, setFeaturedBlog } from '../../services/api';
import { fetchMyBlogs } from '../../services/profileApi';
import { useTranslation } from '../../i18n';

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccountSettings({ isOpen, onClose }: AccountSettingsProps) {
  const { t } = useTranslation();

  // Email section state
  const [email, setEmail] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Profile section state
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');
  const [originalProfile, setOriginalProfile] = useState({ bio: '', avatar: '', twitter: '', github: '', linkedin: '', website: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Featured blog state
  const [userBlogs, setUserBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active section: 'email' | 'profile'
  const [activeSection, setActiveSection] = useState<'email' | 'profile'>('profile');

  useEffect(() => {
    if (isOpen) {
      loadCurrentData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setLoadingBlogs(true);
      fetchMyBlogs()
        .then(res => {
          if (res.code === 200 && res.data) {
            setUserBlogs(res.data.filter((b: any) => b.status === 1));
          }
        })
        .catch(err => console.error('Failed to load blogs:', err))
        .finally(() => setLoadingBlogs(false));
    }
  }, [isOpen]);

  const handleToggleFeatured = async (blogId: number, currentFeatured: boolean) => {
    try {
      await setFeaturedBlog(blogId, !currentFeatured);
      const res = await fetchMyBlogs();
      if (res.code === 200 && res.data) {
        setUserBlogs(res.data.filter((b: any) => b.status === 1));
      }
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  };

  const loadCurrentData = async () => {
    try {
      const response = await getUserInfo();
      if (response.code === 200 && response.data) {
        const user = response.data;
        // Email
        setEmail(user.email || '');
        setOriginalEmail(user.email || '');
        // Profile
        setBio(user.bio || '');
        setAvatar(user.avatar || '');
        setTwitter(user.twitter || '');
        setGithub(user.github || '');
        setLinkedin(user.linkedin || '');
        setWebsite(user.website || '');
        setOriginalProfile({
          bio: user.bio || '',
          avatar: user.avatar || '',
          twitter: user.twitter || '',
          github: user.github || '',
          linkedin: user.linkedin || '',
          website: user.website || ''
        });
      }
    } catch (err) {
      console.error('Failed to load user info:', err);
    }
  };

  // Check if profile has changes
  const profileChanged =
    bio !== originalProfile.bio ||
    avatar !== originalProfile.avatar ||
    twitter !== originalProfile.twitter ||
    github !== originalProfile.github ||
    linkedin !== originalProfile.linkedin ||
    website !== originalProfile.website;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setProfileError('');
    try {
      const response = await uploadImage(file);
      if (response.code === 200 && response.data?.url) {
        setAvatar(response.data.url);
      } else {
        setProfileError(response.message || 'Failed to upload avatar');
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileSuccess('');

    // Validate bio length
    if (bio.length > 500) {
      setProfileError(t('bioTooLong') || 'Bio must be at most 500 characters');
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile({
        bio: bio || undefined,
        avatar: avatar || undefined,
        twitter: twitter || undefined,
        github: github || undefined,
        linkedin: linkedin || undefined,
        website: website || undefined
      });
      setProfileSuccess(t('profileUpdatedSuccess') || 'Profile updated successfully');
      setOriginalProfile({ bio, avatar, twitter, github, linkedin, website });
      // Update localStorage user data
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        user.bio = bio;
        user.avatar = avatar;
        user.twitter = twitter;
        user.github = github;
        user.linkedin = linkedin;
        user.website = website;
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-auth-change'));
      }
      setTimeout(() => {
        setProfileSuccess('');
      }, 2000);
    } catch (err: any) {
      setProfileError(err.response?.data?.message || t('profileUpdateFailed') || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveEmail = async () => {
    setEmailError('');
    setEmailSuccess('');

    // Validate email
    if (!email || email.trim() === '') {
      setEmailError(t('emailRequired') || 'Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(t('invalidEmail') || 'Invalid email format');
      return;
    }

    // Check if email changed
    if (email.trim() === originalEmail.trim()) {
      onClose();
      return;
    }

    setEmailLoading(true);
    try {
      await updateEmail(email.trim());
      setEmailSuccess(t('emailUpdatedSuccess') || 'Email updated successfully');
      // Update localStorage user data
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        user.email = email.trim();
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-auth-change'));
      }
      // Close modal after short delay to show success
      setTimeout(() => {
        onClose();
        setEmailSuccess('');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || '';
      if (errorMsg.includes('EMAIL_ALREADY_EXISTS') || errorMsg.includes('already registered')) {
        setEmailError(t('emailAlreadyRegistered') || 'Email already registered');
      } else {
        setEmailError(t('emailUpdateFailed') || 'Failed to update email');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  // Get username for profile preview link
  const username = JSON.parse(localStorage.getItem('user') || '{}')?.username;
  const profilePreviewUrl = username ? `/user/${username}` : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('accountSettings')} size="md">
      <div className="space-y-6">
        {/* Section tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveSection('profile')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeSection === 'profile'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-primary'
            }`}
          >
            {t('profile')}
          </button>
          <button
            onClick={() => setActiveSection('email')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeSection === 'email'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-primary'
            }`}
          >
            {t('email')}
          </button>
        </div>

        {profileError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm">
            {profileSuccess}
          </div>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4">
              <div
                onClick={handleAvatarClick}
                className="relative cursor-pointer group"
              >
                <img
                  src={avatar || '/default-avatar.png'}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
                />
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <div>
                <p className="text-sm font-medium text-primary">{t('changeAvatar') || 'Change Avatar'}</p>
                <p className="text-xs text-text-muted">{t('avatarUploadHint') || 'Click to upload an image'}</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {t('bio') || 'Bio'}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-primary placeholder-textMuted focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder={t('bioPlaceholder') || 'Tell us about yourself...'}
              />
              <p className="mt-1 text-xs text-text-muted text-right">
                {bio.length}/500
              </p>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-secondary">
                {t('socialLinks') || 'Social Links'}
              </label>

              {/* Twitter */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#000] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-primary placeholder-textMuted focus:outline-none focus:border-primary"
                  placeholder="username"
                />
              </div>

              {/* GitHub */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#24292f] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-primary placeholder-textMuted focus:outline-none focus:border-primary"
                  placeholder="username"
                />
              </div>

              {/* LinkedIn */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0a66c2] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-primary placeholder-textMuted focus:outline-none focus:border-primary"
                  placeholder="username"
                />
              </div>

              {/* Website */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center">
                  <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-primary placeholder-textMuted focus:outline-none focus:border-primary"
                  placeholder="https://yoursite.com"
                />
              </div>
            </div>

            {/* Profile Preview Link */}
            {profilePreviewUrl && (
              <div className="p-3 bg-surface rounded-xl border border-border">
                <p className="text-xs text-text-muted mb-1">{t('yourProfilePreview') || 'Your Profile Preview'}</p>
                <a
                  href={profilePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline break-all"
                >
                  {window.location.origin}{profilePreviewUrl}
                </a>
              </div>
            )}

            {/* Save Button */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={profileLoading}
                className="flex-1 py-3 bg-surface border border-border text-primary font-medium rounded-xl hover:bg-background transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={profileLoading || !profileChanged}
                className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {profileLoading ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        )}

        {/* Featured Blog Section */}
        <div className="border-t border-border pt-6 mt-6">
          <h3 className="text-lg font-semibold text-primary mb-4">
            {t('featuredBlog') || 'Featured Blog'}
          </h3>
          <p className="text-sm text-secondary mb-4">
            {t('featuredBlogDesc') || 'Pin one of your blogs to appear first on your public profile.'}
          </p>

          {loadingBlogs ? (
            <div className="text-secondary">{t('loading') || 'Loading...'}</div>
          ) : userBlogs.length === 0 ? (
            <div className="text-secondary">{t('noPublishedBlogs') || 'No published blogs yet.'}</div>
          ) : (
            <div className="space-y-3">
              {userBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className={`flex items-center justify-between p-4 rounded-xl border ${
                    blog.featured
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface hover:border-borderLight'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {blog.coverImage && (
                      <img src={blog.coverImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="font-medium text-primary">{blog.title}</p>
                      <p className="text-sm text-secondary">
                        {new Date(blog.publishTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleFeatured(blog.id, blog.featured)}
                    className={`p-2 rounded-lg transition-colors ${
                      blog.featured
                        ? 'bg-primary text-white'
                        : 'bg-surface hover:bg-background text-muted'
                    }`}
                    title={blog.featured ? 'Unpin from profile' : 'Pin to profile'}
                  >
                    <svg className="w-5 h-5" fill={blog.featured ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Email Section */}
        {activeSection === 'email' && (
          <div className="space-y-5" onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}>
            {emailError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">
                {emailError}
              </div>
            )}

            {emailSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm">
                {emailSuccess}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {t('emailAddress') || 'Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-primary placeholder-textMuted focus:outline-none focus:border-primary transition-colors"
                placeholder={t('enterYourEmail') || 'Enter your email'}
                disabled={emailLoading}
              />
              <p className="mt-2 text-xs text-muted">
                {t('emailVerificationNote') || 'You will need to verify your new email address'}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={emailLoading}
                className="flex-1 py-3 bg-surface border border-border text-primary font-medium rounded-xl hover:bg-background transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSaveEmail}
                disabled={emailLoading || email === originalEmail}
                className="flex-1 py-3 bg-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {emailLoading ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
