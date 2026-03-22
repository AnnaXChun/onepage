# Stack Research: Public Profile Pages (v1.7)

**Domain:** User profile pages with bio, avatar, social links, and published sites grid
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

Public profile pages at `/user/{username}` require minimal stack additions. The existing infrastructure (User model, ImageController, Blog model) already provides 80% of what's needed. Only two database columns and one new API endpoint are required on the backend. Frontend needs a new route and profile components.

## What Stays the Same (Existing Stack Validated)

| Technology | Current Version | Status | Notes |
|------------|-----------------|--------|-------|
| React | 18.2.0 | Keep | Stable |
| Spring Boot | 3.2.0 | Keep | No changes needed |
| MyBatis-Plus | 3.5.5 | Keep | Working mapper pattern |
| MySQL 8 | 8.x | Keep | JSON column support confirmed |
| Redis | 6.x | Keep | No profile caching needed initially |
| ImageController | Existing | Keep | Reuse for avatar upload |

---

## New Additions for v1.7

### 1. User Model Extensions

**Database changes (MySQL DDL):**

```sql
ALTER TABLE users ADD COLUMN bio VARCHAR(500) DEFAULT NULL;
ALTER TABLE users ADD COLUMN social_links JSON DEFAULT NULL;
```

**Why JSON for social_links:**
- MySQL 8 JSON column stores structured data natively
- MyBatis-Plus handles JSON with TypeHandler (no extra library)
- Schema flexibility: add/remove platforms without migrations
- Indexable viaGenerated Columns if search needed later

**social_links JSON structure:**
```json
{
  "twitter": "https://twitter.com/username",
  "github": "https://github.com/username",
  "linkedin": "https://linkedin.com/in/username",
  "instagram": "https://instagram.com/username",
  "website": "https://example.com"
}
```

### 2. Backend API Endpoints

**New endpoint: Get public profile**
```
GET /api/user/profile/{username}
Response: {
  id, username, avatar, bio, socialLinks,
  publishedSites: [{ id, title, coverImage, shareCode, publishTime }]
}
```
- No authentication required (public endpoint)
- Returns only published blogs (status = published)
- 404 if username not found

**Existing endpoint reuse for avatar upload:**
```
POST /api/image/upload
```
- Already exists in ImageController
- Reuse for avatar images
- Returns URL, store in User.avatar

**Existing endpoint reuse for profile update:**
```
PUT /api/user/profile (requires auth)
```
- New endpoint to update bio, avatar, socialLinks
- Protected like other authenticated endpoints

### 3. Frontend Dependencies

**No new dependencies required.**

| Approach | Library | Why |
|----------|---------|-----|
| Icon library | None | Use inline SVGs for social icons (Twitter, GitHub, etc.) - zero bundle cost |
| Avatar display | None | Standard `<img>` with fallback to initials |
| Avatar upload | None | Reuse existing Upload component, send to `/api/image/upload` |
| Grid layout | TailwindCSS | Existing grid utilities (grid, gap, etc.) |

**Alternative considered: lucide-react**
- `lucide-react@0.577.0` available (verified via npm)
- Pros: Consistent icon style, easy to swap icons
- Cons: Adds ~30KB to bundle for just 5-6 icons
- Decision: Use inline SVGs to keep bundle small

---

## Backend Additions Summary

| Addition | Type | Location | Purpose |
|----------|------|----------|---------|
| `bio` column | DB migration | users table | User biography text |
| `social_links` column | DB migration | users table | JSON object with social URLs |
| UserController.getProfile() | New method | UserController.java | GET /api/user/profile/{username} |
| UserController.updateProfile() | New method | UserController.java | PUT /api/user/profile (auth) |
| UserService.getPublicProfile() | New method | UserService.java | Fetch profile + published blogs |
| UserService.updateProfile() | New method | UserService.java | Update bio, avatar, social links |
| BlogMapper.getPublishedByUserId() | New query | BlogMapper.java | Get user's published blogs |

**No new Maven dependencies.** MySQL 8 JSON handling is native.

---

## Frontend Additions Summary

| Addition | Type | Purpose |
|----------|------|---------|
| ProfilePage | New route `/user/:username` | Public profile display |
| ProfileEditSection | New component | Edit bio, avatar, social links |
| useProfile hook | New hook | Fetch/update profile data |
| SocialIcons | New component | Inline SVG icons for each platform |

**Routing addition (App.tsx):**
```tsx
<Route path="/user/:username" element={<ProfilePage />} />
```

**Key integration points:**
- Reuse existing `api.ts` service for HTTP calls
- Reuse existing `AuthContext` for profile edit permissions
- Use BlogContext or create ProfileContext for user data

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Separate social_links table | Over-engineered for 5 platforms; adds JOIN complexity | JSON column in users table |
| Avatar cropping library | Adds complexity; existing upload works fine | Direct upload to existing endpoint |
| react-icons | Heavy bundle (~40KB) for few icons | Inline SVG components |
| Profile caching in Redis | Low traffic feature; MySQL sufficient | No caching initially |
| Separate Profile model | UserProfile 1:1 with User is unnecessary | Extend User model |

---

## Integration with Existing Stack

### Avatar Upload Flow
```
1. User selects image in profile edit
2. POST /api/image/upload with MultipartFile
3. ImageService stores file, returns URL
4. UserService updates User.avatar with URL
```

### Public Profile Data Flow
```
1. Visitor navigates to /user/johndoe
2. GET /api/user/profile/johndoe (no auth)
3. UserService queries User by username
4. UserService queries BlogMapper.getPublishedByUserId(userId)
5. Returns { user, publishedSites[] }
```

### Profile Edit Flow
```
1. Authenticated user navigates to settings
2. PUT /api/user/profile with { bio, avatar, socialLinks }
3. UserService validates and updates
4. Frontend updates local state
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| MySQL 8 JSON | Spring Boot 3.2, MyBatis-Plus 3.5.5 | Native JSON functions |
| react-avatar-editor@15.1.0 | React 18.x | Available but not recommended |

---

## Sources

| Technology | Source | Confidence |
|-----------|--------|------------|
| MySQL 8 JSON column | [dev.mysql.com/doc/refman/8.0/en/json.html](https://dev.mysql.com/doc/refman/8.0/en/json.html) | HIGH - native feature |
| react-avatar-editor | npm registry | MEDIUM - available but not needed |
| lucide-react | npm registry @0.577.0 | MEDIUM - alternative not chosen |
| MyBatis-Plus JSON | [baomidou.com/pages/24112f](https://baomidou.com/pages/24112f) | HIGH - TypeHandler docs |

---

*Stack research for: v1.7 Public Profile Pages*
*Researched: 2026-03-22*
