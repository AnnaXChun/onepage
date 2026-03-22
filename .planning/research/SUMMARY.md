# Project Research Summary

**Project:** Vibe Onepage - v1.7 User Profiles
**Domain:** Single-page website builder SaaS with public user profile pages
**Researched:** 2026-03-22
**Confidence:** HIGH (Stack/Architecture), MEDIUM (Features/Pitfalls)

## Executive Summary

Vibe Onepage v1.7 adds public user profile pages at `/user/{username}` to showcase users and their published blog sites. Research confirms the existing Spring Boot + React + MySQL stack handles this well with minimal additions: two database columns (bio, social_links JSON), one new public endpoint, and standard frontend routing. The existing User entity, ImageController, and Blog model provide 80% of needed infrastructure.

The recommended approach is incremental: extend the User model with profile fields, create a ProfileDTO to prevent exposing sensitive data, add public and authenticated profile endpoints, then build the frontend profile page. Architecture follows the established Controller-Service-Repository pattern. Critical risks center on security (IDOR on profile edits, XSS via bio field, SSRF via avatar URLs) and performance (N+1 queries, missing cache invalidation).

Key pitfalls from prior milestones (AI generation, PDF export, WeChat Pay, analytics) are in past phases. The v1.7-specific pitfalls are manageable with standard patterns: always extract userId from SecurityContext, apply the same sanitization used in BlogService, validate avatar URLs strictly, and use batch queries for published blogs.

## Key Findings

### Recommended Stack

**Stack remains unchanged from v1.6.** Existing infrastructure validated for profile pages.

**Core technologies:**
- **React 18.2.0 + Spring Boot 3.2.0**: No changes needed, existing patterns work
- **MySQL 8 JSON column**: Native JSON handling for social_links without extra libraries
- **MyBatis-Plus 3.5.5**: TypeHandler for JSON column deserialization — no new dependencies
- **Redis 6.x**: Reuse existing caching pattern; profile caching optional for v1.7
- **ImageController (existing)**: Reuse for avatar uploads

**New additions for v1.7:**
- Database: `bio` (VARCHAR 500), `social_links` (JSON) columns on users table
- Backend: `UserProfileController`, `ProfileDTO`, `UpdateProfileRequest`, new UserService methods
- Frontend: `Profile.tsx` page, `ProfileHeader.tsx`, `ProfileEditModal.tsx`, `BlogGrid.tsx`

### Expected Features

**Must have (table stakes):**
- Public profile endpoint `GET /api/user/profile/{username}` — core deliverable
- Avatar display — existing field, needs upload UI integration
- Bio field — new database column required
- Social links (Twitter, GitHub, LinkedIn, website) — new JSON column required
- Published sites grid — filter existing Blog model by status=1 (published)
- VIP badge — existing vipStatus field, expose in ProfileDTO
- Profile page UI at `/user/{username}` — new frontend route
- Profile editing UI in account settings — authenticated flow

**Should have (competitive differentiation):**
- Featured site pinning — lets users highlight best work (needs is_featured column on Blog)
- Total visitor count across all sites — aggregate from blog_daily_stats
- Per-site visitor counts — join with analytics tables

**Defer (v2+):**
- Site preview on hover — high complexity, performance concerns
- Follow system — notification infrastructure, not aligned with one-page site product
- Custom profile subdomain — requires DNS infrastructure
- Custom profile theme/branding — brand colors for power users

### Architecture Approach

Public profile pages follow the established Controller-Service-Repository pattern with clear separation: UserProfileController handles profile API requests (GET public, PUT authenticated), UserService contains getPublicProfile() and updateProfile() business logic, BlogService provides getPublishedBlogsByUserId() for filtering published blogs by userId. The ProfileDTO explicitly excludes sensitive fields (password, email). Frontend follows existing routing conventions with App.tsx route `/user/:username`.

**Major components:**
1. **UserProfileController**: Public profile endpoint + authenticated profile update; uses `@AuthenticationPrincipal JwtUserPrincipal` for ownership verification
2. **UserService**: getPublicProfile() builds ProfileDTO and fetches published blogs; updateProfile() validates and persists changes
3. **ProfileDTO**: Excludes sensitive fields; includes username, avatar, bio, socialLinks, and published blogs array
4. **ProfilePage (frontend)**: Public profile display at `/user/:username`; fetches data, renders ProfileHeader and BlogGrid
5. **ProfileEditModal (frontend)**: Authenticated-only editing of bio, avatar, and social links

### Critical Pitfalls

1. **IDOR on Profile Editing** — Profile update must extract userId from SecurityContext, never accept userId in request body. Follow BlogController pattern at lines 79-85.

2. **XSS via Unsanitized Bio and Social Links** — Apply same `sanitizeContent()` and `sanitizeUrl()` from BlogService to profile fields. Bio accepts script tags by default — must sanitize before rendering.

3. **N+1 Query on Profile Page** — Use single query with `WHERE user_id = ? AND status = 1` instead of looping. Cache profile data with separate key from blog cache.

4. **Route Collision with /host/{username}** — SiteController serves published sites at `/host/{username}`. New profile routes at `/user/{username}` must be registered before host routes to avoid conflicts.

5. **Username Changes Break Published Site URLs** — Store `publishedUsername` on Blog at publish time for og:url. Current implementation queries by username directly, so username changes break embedded URLs.

## Implications for Roadmap

Based on research, v1.7 User Profiles milestone should proceed in three phases:

### Phase 1: Database & Backend Foundation
**Rationale:** Schema changes must precede any API or frontend work. Profile endpoint cannot return meaningful data without bio and social_links columns.

**Delivers:**
- Database migration: bio (VARCHAR 500), social_links (JSON) on users table
- Updated User entity with new fields
- ProfileDTO (excludes password, email, internal fields)
- UpdateProfileRequest DTO with validation
- UserService.getPublicProfile(username) — find user, build DTO, fetch published blogs
- UserService.updateProfile(userId, request) — update fields with sanitization
- BlogService.getPublishedBlogsByUserId(userId) — filter status=1 only
- UserProfileController — GET /api/user/profile/{username} (public), PUT /api/user/profile (auth)
- Profile cache invalidation on update

**Avoids:** N+1 queries, cache invalidation gaps, IDOR (extract userId from SecurityContext)

### Phase 2: Frontend Profile Page
**Rationale:** Frontend components depend on API contracts being stable. Build profile display page, then profile editing modal.

**Delivers:**
- ProfileApi service for fetchProfile/updateProfile
- Profile.tsx page component at `/user/:username`
- ProfileHeader.tsx — avatar, username, bio, social link icons (inline SVG, no bundle cost)
- BlogGrid.tsx — published blogs as cards linking to /blog/:shareCode
- ProfileEditModal.tsx — authenticated editing of bio, avatar, social links
- App.tsx route addition

**Uses:** Existing api.ts service, AuthContext for permissions, TailwindCSS grid utilities

### Phase 3: Integration & Polish
**Rationale:** Connect profile to existing flows (post-login redirect, navigation links) and add v2 features if time permits.

**Delivers:**
- Add "View My Profile" link to navigation (authenticated users)
- Auto-redirect to /user/{username} after login
- Featured site pinning (if v1.7 scope allows)
- Total visitor count display on profile (aggregate from blog_daily_stats)

**Research Flags:**

Phases likely needing deeper research during planning:
- **Phase 2 (Frontend)**: BlogGrid pagination strategy — if users have many published sites, need pagination design (12 per page recommended per Architecture.md)

Phases with standard patterns (skip research-phase):
- **Phase 1 (Database & Backend)**: Well-documented MyBatis-Plus patterns, existing User entity extension is straightforward
- **Phase 3 (Integration)**: Standard React routing and AuthContext patterns, no new integration patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against existing codebase; MySQL 8 JSON handling confirmed native |
| Features | MEDIUM | Based on competitor analysis and codebase; user validation not performed |
| Architecture | HIGH | Based on existing patterns (Controller-Service-Repository); clear component map |
| Pitfalls | MEDIUM | Code analysis verified with limited external sources; web search had errors |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Username change strategy**: Open question from FEATURES.md — should username be immutable after first site publish? Need PM decision before Phase 1 completes
- **Default avatar**: What placeholder to show when user has no avatar uploaded? Need design decision
- **Minimum blogs threshold**: Should empty profiles show placeholder with CTA? Or just display user info? Need UX decision
- **Feature prioritization**: P2 features (featured site, visitor counts) may need reprioritization based on user feedback

## Sources

### Primary (HIGH confidence)
- Existing Vibe Onepage codebase analysis — User.java, Blog.java, UserController.java, BlogController.java, SecurityConfig.java
- MySQL 8 documentation — JSON column native support
- MyBatis-Plus documentation — TypeHandler for JSON deserialization

### Secondary (MEDIUM confidence)
- Competitor analysis (Linktree, Carrd, about.me, Wix) — feature comparison from FEATURES.md
- Spring Boot REST best practices — API design patterns
- Industry pattern training data — profile page security (IDOR, XSS, SSRF patterns)

### Tertiary (LOW confidence)
- WeChat Pay v3 patterns via WebFetch — not directly applicable to v1.7 profile pages

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
