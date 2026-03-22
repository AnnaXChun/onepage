---
phase: "20"
plan: "01"
type: "execute"
wave: "1"
depends_on: []
files_modified:
  - "backend/src/main/java/com/onepage/model/User.java"
  - "backend/src/main/java/com/onepage/dto/ProfileDTO.java"
  - "backend/src/main/java/com/onepage/controller/UserProfileController.java"
  - "backend/src/main/java/com/onepage/service/BlogService.java"
  - "backend/src/main/java/com/onepage/service/UserService.java"
  - "backend/src/main/resources/application.yml"
  - "frontend/src/pages/Profile/Profile.tsx"
  - "frontend/src/pages/Profile/ProfileHeader.tsx"
  - "frontend/src/pages/Profile/BlogGrid.tsx"
  - "frontend/src/services/profileApi.ts"
  - "frontend/src/App.tsx"
  - "frontend/src/types/models.d.ts"
autonomous: true
requirements: ["PROF-01", "PROF-02", "PROF-03", "PROF-04", "PROF-10"]
must_haves:
  truths:
    - "Public profile page at /user/{username} accessible without login"
    - "Profile displays avatar image, username, and bio text"
    - "Profile displays social link icons (Twitter/X, GitHub, LinkedIn, website) that open in new tabs"
    - "Profile displays VIP badge for users with active VIP status"
    - "Profile displays grid of user's published blog cards with cover image, title, and link to published blog"
  artifacts:
    - path: "backend/src/main/java/com/onepage/dto/ProfileDTO.java"
      provides: "Public profile response DTO excluding password/email"
      min_lines: 30
    - path: "backend/src/main/java/com/onepage/controller/UserProfileController.java"
      provides: "GET /api/user/profile/{username} public endpoint"
      min_lines: 40
    - path: "backend/src/main/java/com/onepage/service/BlogService.java"
      provides: "getPublishedBlogsByUserId() method"
      min_lines: 10
    - path: "frontend/src/pages/Profile/Profile.tsx"
      provides: "Public profile page at /user/:username route"
      min_lines: 50
    - path: "frontend/src/pages/Profile/ProfileHeader.tsx"
      provides: "Avatar, username, bio, social icons, VIP badge"
      min_lines: 60
    - path: "frontend/src/pages/Profile/BlogGrid.tsx"
      provides: "Published blogs grid with cards linking to /blog/:shareCode"
      min_lines: 40
  key_links:
    - from: "Profile.tsx"
      to: "profileApi.ts"
      via: "fetchProfile(username) call"
      pattern: "fetchProfile.*username"
    - from: "ProfileHeader.tsx"
      to: "Profile.tsx"
      via: "profile data props"
      pattern: "profile.*avatar|profile.*username"
    - from: "BlogGrid.tsx"
      to: "Profile.tsx"
      via: "blogs prop"
      pattern: "blogs.*map"
    - from: "UserProfileController"
      to: "BlogService"
      via: "getPublishedBlogsByUserId call"
      pattern: "getPublishedBlogsByUserId"
---

<objective>
Implement public profile page at `/user/{username}` with backend API and frontend display. Profile shows avatar, username, bio, social links (Twitter/X, GitHub, LinkedIn, website), VIP badge for active VIP users, and grid of published blog cards linking to published blogs.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/research/SUMMARY.md
@.planning/research/ARCHITECTURE.md
@backend/src/main/java/com/onepage/model/User.java
@backend/src/main/java/com/onepage/model/Blog.java
@backend/src/main/java/com/onepage/controller/UserController.java
@backend/src/main/java/com/onepage/service/BlogService.java
@backend/src/main/java/com/onepage/service/UserService.java
@frontend/src/App.tsx
@frontend/src/services/api.ts

# Key interfaces from current codebase

From User.java (existing fields):
```java
private Long id;
private String username;
private String password;
private String email;
private String avatar;
private Integer status;
private LocalDateTime createTime;
private LocalDateTime updateTime;
private Boolean vipStatus;
private LocalDateTime vipExpireTime;
```

From Blog.java (existing fields):
```java
private Long id;
private Long userId;
private String title;
private String coverImage;
private String shareCode;
private Integer status;  // 1 = published
private LocalDateTime publishTime;
```

From BlogService.java (existing pattern):
```java
public Blog getBlogByShareCode(String shareCode) {
    return this.lambdaQuery().eq(Blog::getShareCode, shareCode).one();
}
```

From UserController.java (existing pattern):
```java
@GetMapping("/info")
public Result<User> getUserInfo() {
    JwtUserPrincipal principal = getCurrentUser();
    User user = userService.getUserInfo(principal.getUserId());
    return Result.success(user);
}
```

From App.tsx (existing route pattern):
```tsx
<Route path="/blog/:shareCode" element={<BlogView />} />
```
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend - User entity update, ProfileDTO, UserProfileController, BlogService method</name>
  <files>
    backend/src/main/java/com/onepage/model/User.java
    backend/src/main/java/com/onepage/dto/ProfileDTO.java
    backend/src/main/java/com/onepage/controller/UserProfileController.java
    backend/src/main/java/com/onepage/service/BlogService.java
    backend/src/main/java/com/onepage/service/UserService.java
  </files>
  <action>
    ## 1.1 Update User.java with profile fields

Add the following fields to User.java (after existing fields, before vipStatus):
```java
// Profile fields
private String bio;           // max 500 chars
private String twitter;       // Twitter/X username
private String github;        // GitHub username
private String linkedin;      // LinkedIn username/URL
private String website;       // personal website URL
```

## 1.2 Create ProfileDTO.java

Create new file `backend/src/main/java/com/onepage/dto/ProfileDTO.java`:
```java
package com.onepage.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

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

    @Data
    public static class BlogSummary {
        private Long id;
        private String title;
        private String coverImage;
        private String shareCode;
        private LocalDateTime publishTime;
    }
}
```

## 1.3 Add getPublishedBlogsByUserId method to BlogService.java

Add this method to BlogService.java (after line 427, before closing brace):
```java
/**
 * Get all published blogs for a user.
 * Used by public profile page.
 * PROF-02
 */
public List<Blog> getPublishedBlogsByUserId(Long userId) {
    if (userId == null) {
        return List.of();
    }
    return this.lambdaQuery()
            .eq(Blog::getUserId, userId)
            .eq(Blog::getStatus, 1)  // published
            .orderByDesc(Blog::getPublishTime)
            .list();
}
```

Add import for List if not present:
```java
import java.util.List;
```

## 1.4 Add getPublicProfile method to UserService.java

Add this method to UserService.java (after findByUsername method):
```java
/**
 * Get public profile data for a user by username.
 * Excludes sensitive fields (password, email).
 * PROF-01, PROF-10
 */
public ProfileDTO getPublicProfile(String username) {
    User user = this.lambdaQuery()
            .eq(User::getUsername, username)
            .one();

    if (user == null) {
        throw BusinessException.userNotFound();
    }

    // Get published blogs for this user
    List<Blog> publishedBlogs = blogService.getPublishedBlogsByUserId(user.getId());

    // Build blog summaries
    List<ProfileDTO.BlogSummary> blogSummaries = publishedBlogs.stream()
            .map(blog -> {
                ProfileDTO.BlogSummary summary = new ProfileDTO.BlogSummary();
                summary.setId(blog.getId());
                summary.setTitle(blog.getTitle());
                summary.setCoverImage(blog.getCoverImage());
                summary.setShareCode(blog.getShareCode());
                summary.setPublishTime(blog.getPublishTime());
                return summary;
            })
            .collect(Collectors.toList());

    // Build profile DTO (excludes password, email)
    ProfileDTO profile = new ProfileDTO();
    profile.setUsername(user.getUsername());
    profile.setAvatar(user.getAvatar());
    profile.setBio(user.getBio());
    profile.setTwitter(user.getTwitter());
    profile.setGithub(user.getGithub());
    profile.setLinkedin(user.getLinkedin());
    profile.setWebsite(user.getWebsite());
    profile.setVipStatus(user.getVipStatus());
    profile.setVipExpireTime(user.getVipExpireTime());
    profile.setBlogs(blogSummaries);

    return profile;
}
```

Add required imports:
```java
import com.onepage.dto.ProfileDTO;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Collections;
```

Also add blogService as a dependency:
```java
private final BlogService blogService;
```

And update the constructor or use @RequiredArgsConstructor (already present).

## 1.5 Create UserProfileController.java

Create new file `backend/src/main/java/com/onepage/controller/UserProfileController.java`:
```java
package com.onepage.controller;

import com.onepage.dto.ProfileDTO;
import com.onepage.dto.Result;
import com.onepage.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserService userService;

    /**
     * Get public profile by username.
     * GET /api/user/profile/{username}
     * Public endpoint - no authentication required.
     * PROF-01, PROF-02, PROF-03, PROF-04, PROF-10
     */
    @GetMapping("/profile/{username}")
    public Result<ProfileDTO> getPublicProfile(@PathVariable String username) {
        ProfileDTO profile = userService.getPublicProfile(username);
        return Result.success(profile);
    }
}
```
</action>
  <verify>
    <automated>grep -n "getPublicProfile\|getPublishedBlogsByUserId\|ProfileDTO" backend/src/main/java/com/onepage/service/UserService.java backend/src/main/java/com/onepage/service/BlogService.java backend/src/main/java/com/onepage/dto/ProfileDTO.java 2>/dev/null | head -20</automated>
  </verify>
  <done>
    User entity has bio, twitter, github, linkedin, website fields; ProfileDTO excludes sensitive fields; UserProfileController has GET /api/user/profile/{username} endpoint; BlogService has getPublishedBlogsByUserId() method
  </done>
</task>

<task type="auto">
  <name>Task 2: Frontend - Profile page components and API service</name>
  <files>
    frontend/src/services/profileApi.ts
    frontend/src/pages/Profile/Profile.tsx
    frontend/src/pages/Profile/ProfileHeader.tsx
    frontend/src/pages/Profile/BlogGrid.tsx
    frontend/src/types/models.d.ts
    frontend/src/App.tsx
  </files>
  <action>
    ## 2.1 Create profileApi.ts service

Create new file `frontend/src/services/profileApi.ts`:
```typescript
import api from './api';
import type { ApiResponse } from '@/types/api';

export interface BlogSummary {
  id: number;
  title: string;
  coverImage: string | null;
  shareCode: string;
  publishTime: string;
}

export interface ProfileData {
  username: string;
  avatar: string | null;
  bio: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
  vipStatus: boolean;
  vipExpireTime: string | null;
  blogs: BlogSummary[];
}

export const fetchProfile = async (username: string): Promise<ApiResponse<ProfileData>> => {
  const response = await api.get(`/user/profile/${encodeURIComponent(username)}`);
  return response.data;
};
```

## 2.2 Add Profile types to models.d.ts

Read `frontend/src/types/models.d.ts` first, then add Profile interfaces:
```typescript
// Profile types
export interface ProfileData {
  username: string;
  avatar: string | null;
  bio: string | null;
  twitter: string | null;
  github: string | null;
  linkedin: string | null;
  website: string | null;
  vipStatus: boolean;
  vipExpireTime: string | null;
  blogs: BlogSummary[];
}

export interface BlogSummary {
  id: number;
  title: string;
  coverImage: string | null;
  shareCode: string;
  publishTime: string;
}
```

## 2.3 Create ProfileHeader.tsx component

Create new file `frontend/src/pages/Profile/ProfileHeader.tsx`:
```tsx
import type { ProfileData } from '@/services/profileApi';

interface ProfileHeaderProps {
  profile: ProfileData;
}

export default function ProfileHeader({ profile }: ProfileHeaderProps) {
  const hasSocialLinks = profile.twitter || profile.github || profile.linkedin || profile.website;

  return (
    <div className="flex flex-col items-center text-center mb-12">
      {/* Avatar */}
      <div className="relative mb-4">
        <img
          src={profile.avatar || '/default-avatar.png'}
          alt={profile.username}
          className="w-24 h-24 rounded-full object-cover border-2 border-border"
        />
        {/* VIP Badge */}
        {profile.vipStatus && (
          <div className="absolute -top-1 -right-1 bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
            VIP
          </div>
        )}
      </div>

      {/* Username */}
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        {profile.username}
      </h1>

      {/* Bio */}
      {profile.bio && (
        <p className="text-text-secondary max-w-md mb-4">
          {profile.bio}
        </p>
      )}

      {/* Social Links */}
      {hasSocialLinks && (
        <div className="flex items-center gap-4 mt-2">
          {/* Twitter/X */}
          {profile.twitter && (
            <a
              href={`https://x.com/${profile.twitter}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary transition-colors"
              aria-label="Twitter/X"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          )}

          {/* GitHub */}
          {profile.github && (
            <a
              href={`https://github.com/${profile.github}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          )}

          {/* LinkedIn */}
          {profile.linkedin && (
            <a
              href={`https://linkedin.com/in/${profile.linkedin}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          )}

          {/* Website */}
          {profile.website && (
            <a
              href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary transition-colors"
              aria-label="Website"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
```

## 2.4 Create BlogGrid.tsx component

Create new file `frontend/src/pages/Profile/BlogGrid.tsx`:
```tsx
import type { BlogSummary } from '@/services/profileApi';

interface BlogGridProps {
  blogs: BlogSummary[];
}

export default function BlogGrid({ blogs }: BlogGridProps) {
  if (blogs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted">No published sites yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <a
          key={blog.id}
          href={`/blog/${blog.shareCode}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all duration-200"
        >
          {/* Cover Image */}
          <div className="aspect-[16/9] overflow-hidden bg-surface">
            {blog.coverImage ? (
              <img
                src={blog.coverImage}
                alt={blog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors line-clamp-2">
              {blog.title}
            </h3>
            {blog.publishTime && (
              <p className="text-sm text-text-muted mt-2">
                {new Date(blog.publishTime).toLocaleDateString()}
              </p>
            )}
          </div>
        </a>
      ))}
    </div>
  );
}
```

## 2.5 Create Profile.tsx page component

Create new file `frontend/src/pages/Profile/Profile.tsx`:
```tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchProfile, ProfileData } from '@/services/profileApi';
import ProfileHeader from './ProfileHeader';
import BlogGrid from './BlogGrid';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetchProfile(username);
        if (response.code === 200 && response.data) {
          setProfile(response.data);
        } else {
          setError(response.message || 'User not found');
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error('Profile load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">User Not Found</h1>
          <p className="text-text-muted">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ProfileHeader profile={profile} />

        {/* Published Sites Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-text-primary mb-6">
            Published Sites ({profile.blogs.length})
          </h2>
          <BlogGrid blogs={profile.blogs} />
        </div>
      </div>
    </div>
  );
}
```

## 2.6 Update App.tsx with profile route

Read `frontend/src/App.tsx` first, then add the Profile import and route.

Add import:
```tsx
import Profile from './pages/Profile/Profile'
```

Add route (place before the catch-all route):
```tsx
<Route path="/user/:username" element={<Profile />} />
```
</action>
  <verify>
    <automated>grep -n "Profile\|profileApi\|/user/:username" frontend/src/pages/Profile/*.tsx frontend/src/services/profileApi.ts frontend/src/App.tsx 2>/dev/null | head -30</automated>
  </verify>
  <done>
    profileApi.ts has fetchProfile function; ProfileHeader displays avatar, username, bio, social icons, VIP badge; BlogGrid displays published blog cards; Profile.tsx fetches and renders profile data; App.tsx has /user/:username route
  </done>
</task>

</tasks>

<verification>
Backend verification:
1. Start Spring Boot and verify User entity compiles with new fields
2. Test GET /api/user/profile/{username} returns profile data with blogs list

Frontend verification:
1. Navigate to http://localhost:5173/user/testuser (replace with actual username)
2. Verify profile displays avatar, username, bio, social icons
3. Verify VIP badge appears for VIP users
4. Verify published blogs grid shows cards with cover image, title, links
5. Verify clicking a blog card opens /blog/{shareCode}
</verification>

<success_criteria>
1. GET /api/user/profile/{username} returns 200 with ProfileDTO (excludes password/email)
2. Profile page at /user/{username} accessible without login (PROF-10)
3. Profile displays avatar image, username, bio text (PROF-01)
4. Profile displays social link icons for Twitter/X, GitHub, LinkedIn, website (PROF-04)
5. VIP badge displays when profile.vipStatus is true (PROF-03)
6. Published blogs display as cards with cover image, title, link to /blog/{shareCode} (PROF-02)
7. Empty blogs array shows "No published sites yet" message
</success_criteria>

<output>
After completion, create `.planning/phases/20-public-profile-display/20-01-SUMMARY.md`
</output>
