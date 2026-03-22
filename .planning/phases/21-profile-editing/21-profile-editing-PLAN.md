---
phase: "21"
plan: "01"
type: "execute"
wave: "1"
depends_on: []
files_modified:
  - "backend/src/main/java/com/onepage/dto/UpdateProfileRequest.java"
  - "backend/src/main/java/com/onepage/controller/UserProfileController.java"
  - "backend/src/main/java/com/onepage/service/UserService.java"
  - "frontend/src/components/AccountSettings/AccountSettings.tsx"
  - "frontend/src/services/api.ts"
autonomous: true
requirements: ["PROF-05", "PROF-06", "PROF-07", "PROF-08"]
must_haves:
  truths:
    - "User can edit bio text in account settings (text area, max 500 characters)"
    - "User can upload avatar image via existing ImageController"
    - "User can edit social links (Twitter, GitHub, LinkedIn, website URLs)"
    - "User can view their own profile preview link from account settings"
  artifacts:
    - path: "backend/src/main/java/com/onepage/dto/UpdateProfileRequest.java"
      provides: "Request DTO for profile updates with validation"
      min_lines: 25
    - path: "backend/src/main/java/com/onepage/controller/UserProfileController.java"
      provides: "PUT /api/user/profile authenticated endpoint"
      min_lines: 30
    - path: "backend/src/main/java/com/onepage/service/UserService.java"
      provides: "updateProfile() method with sanitization"
      min_lines: 40
    - path: "frontend/src/components/AccountSettings/AccountSettings.tsx"
      provides: "Profile editing UI with bio, avatar, social links, preview link"
      min_lines: 120
  key_links:
    - from: "AccountSettings.tsx"
      to: "api.ts"
      via: "uploadImage() and new updateProfile() calls"
      pattern: "uploadImage|updateProfile"
    - from: "UserProfileController"
      to: "UserService"
      via: "updateProfile() call"
      pattern: "userService\\.updateProfile"
    - from: "AccountSettings.tsx"
      to: "/user/{username}"
      via: "profile preview link"
      pattern: "/user/"
---

<objective>
Implement authenticated profile editing flow allowing users to edit their bio, upload avatar, manage social links, and view their profile preview link from account settings.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/20-public-profile-display/20-01-SUMMARY.md
@.planning/research/SUMMARY.md
@backend/src/main/java/com/onepage/model/User.java
@backend/src/main/java/com/onepage/dto/ProfileDTO.java
@backend/src/main/java/com/onepage/controller/UserProfileController.java
@backend/src/main/java/com/onepage/service/UserService.java
@frontend/src/components/AccountSettings/AccountSettings.tsx
@frontend/src/services/api.ts

# Key interfaces from current codebase

From User.java (existing fields after Phase 20):
```java
private String bio;           // max 500 chars
private String twitter;       // Twitter/X username
private String github;        // GitHub username
private String linkedin;       // LinkedIn username/URL
private String website;       // personal website URL
```

From ProfileDTO.java (Phase 20):
```java
@Data
public class ProfileDTO {
    private String username;
    private String avatar;
    private String bio;
    private String twitter;
    private String github;
    private String linkedin;
    private String website;
    private Boolean vipStatus;
    private LocalDateTime vipExpireTime;
    private List<BlogSummary> blogs;
}
```

From UserController.java (existing update pattern):
```java
@PutMapping("/email")
public Result<Void> updateEmail(@Valid @RequestBody UpdateEmailRequest request) {
    JwtUserPrincipal principal = getCurrentUser();
    if (principal == null) {
        throw BusinessException.unauthorized("Please login first");
    }
    userService.updateEmail(principal.getUserId(), request.getEmail());
    return Result.success();
}
```

From api.ts (existing uploadImage):
```typescript
export const uploadImage = async (file: File): Promise<ApiResponse<{ url: string }>> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend - UpdateProfileRequest DTO, UserService.updateProfile(), PUT endpoint</name>
  <files>
    backend/src/main/java/com/onepage/dto/UpdateProfileRequest.java
    backend/src/main/java/com/onepage/controller/UserProfileController.java
    backend/src/main/java/com/onepage/service/UserService.java
  </files>
  <action>
    ## 1.1 Create UpdateProfileRequest.java

Create new file `backend/src/main/java/com/onepage/dto/UpdateProfileRequest.java`:
```java
package com.onepage.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @Size(max = 500, message = "Bio must be at most 500 characters")
    private String bio;

    private String avatar;  // URL to avatar image

    @Size(max = 50, message = "Twitter username must be at most 50 characters")
    private String twitter;

    @Size(max = 50, message = "GitHub username must be at most 50 characters")
    private String github;

    @Size(max = 100, message = "LinkedIn username must be at most 100 characters")
    private String linkedin;

    @Size(max = 200, message = "Website URL must be at most 200 characters")
    private String website;
}
```

## 1.2 Add updateProfile method to UserService.java

Add this method to UserService.java (after getPublicProfile method, around line 351):

```java
/**
 * Update user profile (bio, avatar, social links).
 * Extracts userId from SecurityContext to prevent IDOR.
 * PROF-05, PROF-06, PROF-07
 */
public void updateProfile(Long userId, UpdateProfileRequest request) {
    if (userId == null) {
        throw BusinessException.badRequest("User ID cannot be null");
    }

    User user = this.getById(userId);
    if (user == null) {
        throw BusinessException.userNotFound();
    }

    // Update bio with sanitization
    if (request.getBio() != null) {
        user.setBio(sanitizeContent(request.getBio()));
    }

    // Update avatar URL
    if (request.getAvatar() != null) {
        user.setAvatar(sanitizeUrl(request.getAvatar()));
    }

    // Update social links with sanitization
    if (request.getTwitter() != null) {
        user.setTwitter(sanitizeUsername(request.getTwitter()));
    }
    if (request.getGithub() != null) {
        user.setGithub(sanitizeUsername(request.getGithub()));
    }
    if (request.getLinkedin() != null) {
        user.setLinkedin(sanitizeUsername(request.getLinkedin()));
    }
    if (request.getWebsite() != null) {
        user.setWebsite(sanitizeUrl(request.getWebsite()));
    }

    user.setUpdateTime(LocalDateTime.now());
    this.updateById(user);

    log.info("Profile updated for userId={}", userId);
}

/**
 * Sanitize content to prevent XSS attacks.
 * PROF-05
 */
private String sanitizeContent(String content) {
    if (content == null) return null;
    // Remove script tags and event handlers
    return content.replaceAll("<script[^>]*>.*?</script>", "")
                  .replaceAll("on\\w+\\s*=\\s*[\"'][^\"']*[\"']", "")
                  .replaceAll("javascript:", "")
                  .trim();
}

/**
 * Sanitize URL to prevent javascript: and data: URLs except for avatar uploads.
 * PROF-06
 */
private String sanitizeUrl(String url) {
    if (url == null || url.isBlank()) return null;
    // Only allow http:// and https:// URLs
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    return null;
}

/**
 * Sanitize social media username ( alphanumeric, underscore, hyphen only).
 * PROF-07
 */
private String sanitizeUsername(String username) {
    if (username == null || username.isBlank()) return null;
    // Only allow alphanumeric, underscore, hyphen
    return username.replaceAll("[^a-zA-Z0-9_-]", "");
}
```

Add the required import for UpdateProfileRequest:
```java
import com.onepage.dto.UpdateProfileRequest;
```

## 1.3 Add PUT endpoint to UserProfileController.java

Read the existing UserProfileController.java first, then add the update endpoint.

Add this method to UserProfileController.java (after the getPublicProfile method):

```java
/**
 * Update current user's profile.
     * PUT /api/user/profile
     * Requires authentication.
     * PROF-05, PROF-06, PROF-07, PROF-08
     */
    @PutMapping("/profile")
    public Result<Void> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        JwtUserPrincipal principal = getCurrentUser();
        if (principal == null) {
            throw BusinessException.unauthorized("Please login first");
        }

        userService.updateProfile(principal.getUserId(), request);
        return Result.success();
    }
```

The existing getCurrentUser() method from UserController is not available here, so add this private method to UserProfileController:

```java
/**
 * Get current authenticated user from SecurityContext.
     */
    private JwtUserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtUserPrincipal principal) {
            return principal;
        }
        return null;
    }
```

Add the required imports:
```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.onepage.config.JwtUserPrincipal;
import jakarta.validation.Valid;
```
</action>
  <verify>
    <automated>grep -n "updateProfile\|UpdateProfileRequest\|sanitizeContent" backend/src/main/java/com/onepage/service/UserService.java backend/src/main/java/com/onepage/dto/*.java 2>/dev/null | head -20</automated>
  </verify>
  <done>
    UpdateProfileRequest DTO has validation annotations; UserService.updateProfile() sanitizes inputs and prevents IDOR; PUT /api/user/profile endpoint requires authentication
  </done>
</task>

<task type="auto">
  <name>Task 2: Frontend - Extend AccountSettings with profile editing, avatar upload, social links</name>
  <files>
    frontend/src/components/AccountSettings/AccountSettings.tsx
    frontend/src/services/api.ts
  </files>
  <action>
    ## 2.1 Add updateProfile API function to api.ts

Read api.ts first, then add this function after the updateEmail function:

```typescript
// Profile types
export interface ProfileUpdateData {
  bio?: string;
  avatar?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

// Update user profile
export const updateProfile = async (data: ProfileUpdateData): Promise<ApiResponse> => {
  const response = await api.put('/user/profile', data);
  return response.data;
};
```

## 2.2 Extend AccountSettings.tsx with profile editing

Read the existing AccountSettings.tsx first.

Replace the entire component with an extended version that includes profile editing sections. The component should have:

1. **Avatar upload section** - Clickable avatar that opens file picker, uploads via uploadImage API
2. **Bio textarea** - Max 500 chars with character counter
3. **Social links section** - Twitter, GitHub, LinkedIn, Website URL inputs
4. **Profile preview link** - Display link to /user/{username}

Key implementation details:

```tsx
import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { getUserInfo, updateEmail, uploadImage, updateProfile } from '../../services/api';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active section: 'email' | 'profile'
  const [activeSection, setActiveSection] = useState<'email' | 'profile'>('profile');

  useEffect(() => {
    if (isOpen) {
      loadCurrentData();
    }
  }, [isOpen]);

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
      setProfileError(t('bioTooLong'));
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
      setProfileSuccess(t('profileUpdatedSuccess'));
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
      setProfileError(err.response?.data?.message || t('profileUpdateFailed'));
    } finally {
      setProfileLoading(false);
    }
  };

  // ... (email handling code remains the same from original)

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
                <p className="text-sm font-medium text-primary">{t('changeAvatar')}</p>
                <p className="text-xs text-text-muted">{t('avatarUploadHint')}</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                {t('bio')}
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-primary placeholder-textMuted focus:outline-none focus:border-primary transition-colors resize-none"
                placeholder={t('bioPlaceholder')}
              />
              <p className="mt-1 text-xs text-text-muted text-right">
                {bio.length}/500
              </p>
            </div>

            {/* Social Links */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-secondary">
                {t('socialLinks')}
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
                <p className="text-xs text-text-muted mb-1">{t('yourProfilePreview')}</p>
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

        {/* Email Section */}
        {activeSection === 'email' && (
          <div className="space-y-5" onKeyDown={(e) => e.key === 'Enter' && handleEmailSave()}>
            {/* ... original email form code ... */}
          </div>
        )}
      </div>
    </Modal>
  );
}
```

Note: For brevity, the email section should retain the original implementation pattern from lines 111-145 of the original file, but refactored to use the `handleEmailSave` function name and proper state variables (emailLoading, emailError, emailSuccess).
</action>
  <verify>
    <automated>grep -n "updateProfile\|uploadImage\|/user/\|bio.*500" frontend/src/components/AccountSettings/AccountSettings.tsx frontend/src/services/api.ts 2>/dev/null | head -20</automated>
  </verify>
  <done>
    AccountSettings has profile tab with avatar upload, bio textarea (500 char limit), social links inputs, and profile preview link; updateProfile API function added to api.ts
  </done>
</task>

</tasks>

<verification>
Backend verification:
1. Start Spring Boot and verify UpdateProfileRequest compiles
2. Test PUT /api/user/profile with authenticated request updates profile fields
3. Verify sanitization prevents XSS in bio and social links

Frontend verification:
1. Open account settings modal
2. Switch to profile tab
3. Upload avatar image - verify upload succeeds and avatar displays
4. Enter bio text - verify character counter works (max 500)
5. Enter social links - verify Twitter, GitHub, LinkedIn, Website fields work
6. Click save - verify profile updates and success message appears
7. Verify profile preview link displays and opens correct page
</verification>

<success_criteria>
1. User can edit bio text in account settings (text area, max 500 characters) - PROF-05
2. User can upload avatar image via existing ImageController - PROF-06
3. User can edit social links (Twitter, GitHub, LinkedIn, website URLs) - PROF-07
4. User can view their own profile preview link from account settings - PROF-08
5. PUT /api/user/profile requires authentication and updates only the authenticated user's profile
6. Bio and social links are sanitized to prevent XSS attacks
</success_criteria>

<output>
After completion, create `.planning/phases/21-profile-editing/21-01-SUMMARY.md`
</output>
