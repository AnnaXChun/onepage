---
phase: 22-integration-and-polish
plan: 02
type: execute
wave: 2
depends_on: [22-integration-and-polish-01]
files_modified:
  - frontend/src/components/Header/AuthButtons.tsx
  - frontend/src/pages/Profile/Profile.tsx
  - frontend/src/pages/Profile/ProfileHeader.tsx
  - frontend/src/pages/Profile/BlogGrid.tsx
  - frontend/src/services/profileApi.ts
  - frontend/src/types/models.d.ts
autonomous: true
requirements:
  - PROF-09
  - PROF-11
  - PROF-12

must_haves:
  truths:
    - "Authenticated users see 'View My Profile' link in header dropdown"
    - "Profile page displays total visitor count across all user's published sites"
    - "Featured blog appears first in profile's published sites grid with badge"
    - "User can pin/unpin a blog as featured from their orders page"
  artifacts:
    - path: "frontend/src/components/Header/AuthButtons.tsx"
      contains: "/user/"
    - path: "frontend/src/pages/Profile/Profile.tsx"
      contains: "totalVisitors"
    - path: "frontend/src/pages/Profile/BlogGrid.tsx"
      contains: "featured"
      exports: "featured blog first with star badge"
  key_links:
    - from: "AuthButtons.tsx"
      to: "/user/{username}"
      via: "Link in dropdown menu"
    - from: "Profile.tsx"
      to: "profileApi.ts"
      via: "fetchProfile returns totalVisitors"
    - from: "BlogGrid.tsx"
      to: "BlogSummary.featured"
      via: "sorts featured first, shows star badge"
---

<objective>
Add "View My Profile" link to header dropdown, display total visitor count on profile page, show featured blog first with badge, and add UI to pin/unpin featured blog from orders page.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@frontend/src/components/Header/AuthButtons.tsx
@frontend/src/pages/Profile/Profile.tsx
@frontend/src/pages/Profile/ProfileHeader.tsx
@frontend/src/pages/Profile/BlogGrid.tsx
@frontend/src/services/profileApi.ts
@frontend/src/types/models.d.ts
</context>

<interfaces>
<!-- Key types from backend API response -->

From profileApi.ts - ProfileData interface will be extended:
```typescript
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
  totalVisitors: number;  // NEW - sum of all page views
}

export interface BlogSummary {
  id: number;
  title: string;
  coverImage: string | null;
  shareCode: string;
  publishTime: string;
  featured: boolean;  // NEW - whether this is the pinned featured blog
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add "View My Profile" link to AuthButtons dropdown</name>
  <files>frontend/src/components/Header/AuthButtons.tsx</files>
  <action>
    Read the file first, then add a "View My Profile" link in the dropdown menu.
    The link should go to `/user/${user.username}` and appear before the Account Settings option.

    Add this after the existing Link to "/orders":
    ```jsx
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
    ```

    Note: Add "viewProfile" translation key to i18n if not exists.
  </action>
  <read_first>frontend/src/components/Header/AuthButtons.tsx</read_first>
  <verify>
    <automated>grep -n "/user/" frontend/src/components/Header/AuthButtons.tsx</automated>
  </verify>
  <done>AuthButtons dropdown has "View My Profile" link to /user/{username}</done>
</task>

<task type="auto">
  <name>Task 2: Update ProfileData type and profileApi.ts</name>
  <files>frontend/src/services/profileApi.ts</files>
  <action>
    Read the file first, then update the ProfileData and BlogSummary interfaces to include the new fields:

    ```typescript
    export interface BlogSummary {
      id: number;
      title: string;
      coverImage: string | null;
      shareCode: string;
      publishTime: string;
      featured: boolean;  // ADD THIS - NEW
    }

    export interface ProfileData {
      // ... existing fields ...
      blogs: BlogSummary[];
      totalVisitors: number;  // ADD THIS - NEW
    }
    ```
  </action>
  <read_first>frontend/src/services/profileApi.ts</read_first>
  <verify>
    <automated>grep -n "totalVisitors\|featured" frontend/src/services/profileApi.ts</automated>
  </verify>
  <done>profileApi.ts exports ProfileData with totalVisitors and BlogSummary with featured</done>
</task>

<task type="auto">
  <name>Task 3: Display totalVisitors on Profile page</name>
  <files>frontend/src/pages/Profile/Profile.tsx</files>
  <action>
    Read the file first, then modify the profile page to display total visitor count.
    Add totalVisitors display in the "Published Sites" section header.

    Change:
    ```jsx
    <h2 className="text-xl font-bold text-text-primary mb-6">
      Published Sites ({profile.blogs.length})
    </h2>
    ```

    To:
    ```jsx
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold text-text-primary">
        Published Sites ({profile.blogs.length})
      </h2>
      {profile.totalVisitors > 0 && (
        <span className="text-sm text-text-muted">
          {profile.totalVisitors.toLocaleString()} total views
        </span>
      )}
    </div>
    ```
  </action>
  <read_first>frontend/src/pages/Profile/Profile.tsx</read_first>
  <verify>
    <automated>grep -n "totalVisitors" frontend/src/pages/Profile/Profile.tsx</automated>
  </verify>
  <done>Profile page displays total visitor count next to "Published Sites" heading</done>
</task>

<task type="auto">
  <name>Task 4: Show featured blog first with star badge in BlogGrid</name>
  <files>frontend/src/pages/Profile/BlogGrid.tsx</files>
  <action>
    Read the file first, then modify BlogGrid to:
    1. Sort blogs so featured blog appears first
    2. Show a star/filled badge on the featured blog card

    Changes to BlogGrid:
    1. Sort blogs: featured first, then by publishTime
    2. Add a star badge on the featured blog's cover image corner

    ```tsx
    // Sort: featured first, then by publishTime descending
    const sortedBlogs = [...blogs].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
    });

    // In the card, add a badge for featured:
    {blog.featured && (
      <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
        Featured
      </div>
    )}
    ```
  </action>
  <read_first>frontend/src/pages/Profile/BlogGrid.tsx</read_first>
  <verify>
    <automated>grep -n "featured" frontend/src/pages/Profile/BlogGrid.tsx</automated>
  </verify>
  <done>BlogGrid sorts featured blog first and shows star badge</done>
</task>

</tasks>

<verification>
- Vite build passes: `cd frontend && npm run build`
- AuthButtons has link to /user/{username}
- Profile.tsx displays totalVisitors
- BlogGrid shows featured blog first with badge
</verification>

<success_criteria>
- Header dropdown shows "View My Profile" link for authenticated users
- Profile page shows total visitor count next to published sites count
- Featured blog appears first in grid with "Featured" badge
- Non-featured blogs sorted by publishTime after featured
</success_criteria>

<output>
After completion, create `.planning/phases/22-integration-and-polish/22-integration-and-polish-02-SUMMARY.md`
</output>
