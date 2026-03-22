# Architecture Research: Public Profile Pages

**Domain:** Public user profile pages in a React + Spring Boot SaaS
**Project:** Vibe Onepage (v1.7 User Profiles milestone)
**Researched:** 2026-03-22
**Confidence:** HIGH

## Executive Summary

Public profile pages at `/user/{username}` display user info and their published blog sites. This integrates with existing User entity (extending with bio/social links), Blog entity (filtering published by userId), and BlogService (fetching user's blogs).

**Key changes:**
- User entity: Add bio, twitter, github, linkedin, website fields
- New API endpoints: GET /api/user/profile/{username}, PUT /api/user/profile
- New frontend route: /user/:username
- BlogService: Add getPublishedBlogsByUserId() method

**Integration points identified:**
- User entity already has username and avatar
- Blog entity already has userId, title, coverImage, shareCode, status
- Existing JWT auth reused for profile updates
- Redis caching pattern reused for profile data

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ ProfilePage  │  │ ProfileEdit  │  │ AuthContext (exist)   │   │
│  │ /user/:username│ │ Modal       │  │                       │   │
│  └──────┬───────┘  └──────┬───────┘  └───────────────────────┘   │
│         │                  │                                      │
├─────────┴──────────────────┴──────────────────────────────────────┤
│                    App.tsx Routes                                  │
│  /user/:username (PUBLIC) ← NEW                                   │
│  /editor/:blogId (authenticated - existing)                       │
│  /blog/:shareCode (public - existing)                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Spring Boot)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │ UserController       │  │ BlogController (existing)        │ │
│  │ GET /user/profile/:username ← NEW                           │ │
│  │ PUT /user/profile ← NEW                                    │ │
│  └──────────┬───────────┘  └────────────┬─────────────────────┘ │
│             │                            │                       │
│  ┌──────────┴───────────┐  ┌─────────────┴─────────────────────┐│
│  │ UserService          │  │ BlogService (existing)             ││
│  │ - getPublicProfile() │  │ - getPublishedBlogsByUserId() ← NEW││
│  │ - updateProfile()    │  │ - getBlogByShareCode() (exists)   ││
│  └──────────┬───────────┘  └─────────────────────────────────────┘│
│             │                                                     │
│  ┌──────────┴─────────────────────────────────────────────────────┐│
│  │ MyBatis-Plus Mappers                                          ││
│  │ UserMapper (existing) │ BlogMapper (existing)                 ││
│  └────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MySQL Database                               │
├─────────────────────────────────────────────────────────────────┤
│  users table (existing)         blogs table (existing)           │
│  - id, username, avatar         - id, userId, title, coverImage  │
│  - NEW: bio, socialLinks        - shareCode, status             │
│  - NEW: twitter, github         - published blogs filtered by    │
│  - NEW: linkedin, website          status=1 (published)          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| ProfilePage | Display public profile + blog grid | React component with useParams() |
| ProfileEditModal | Edit bio, avatar, social links | Modal with form, authenticated |
| UserProfileController | Handle profile API requests | Spring REST controller |
| UserService | Business logic for profiles | Service layer with MyBatis-Plus |
| BlogService | Fetch user's published blogs | Extend with new query method |

---

## Recommended Project Structure

### Backend

```
backend/src/main/java/com/onepage/
├── controller/
│   └── UserProfileController.java  # NEW: profile endpoints
├── service/
│   └── UserService.java             # MODIFIED: add profile methods
├── dto/
│   ├── ProfileDTO.java              # NEW: public profile response
│   └── UpdateProfileRequest.java    # NEW: profile update request
└── model/
    └── User.java                    # MODIFIED: add profile fields
```

### Frontend

```
frontend/src/
├── pages/
│   └── Profile/
│       ├── Profile.tsx              # Public profile page
│       └── components/
│           ├── ProfileHeader.tsx    # Avatar, name, bio, social links
│           ├── ProfileEditModal.tsx # Edit own profile
│           └── BlogGrid.tsx         # User's published blogs
├── services/
│   └── profileApi.ts               # NEW: API calls
└── types/
    └── profile.d.ts                # NEW: TypeScript types
```

---

## Data Flow

### View Public Profile (`/user/:username`)

```
1. User visits /user/johndoe
2. Frontend calls GET /api/user/profile/johndoe
3. Backend:
   a. UserService.findByUsername("johndoe")
   b. If not found → 404 BusinessException
   c. If found → build ProfileDTO (excludes sensitive fields: password, email, etc.)
   d. BlogService.getPublishedBlogsByUserId(userId, status=1)
   e. Return ProfileDTO with blogs list
4. Frontend renders ProfilePage with profile data + blog grid
```

### Update Profile (authenticated)

```
1. Authenticated user opens ProfileEditModal
2. User edits bio/social links and saves
3. Frontend calls PUT /api/user/profile with JWT token
4. Backend:
   a. Validate JWT → get userId from JwtUserPrincipal
   b. UserService.updateProfile(userId, request)
   c. Update users table fields
   d. Invalidate profile cache if cached
5. Return updated profile
```

---

## API Design

### GET /api/user/profile/{username}

**Purpose:** Fetch public profile with published blogs
**Auth:** None (public endpoint)
**Response:**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "username": "johndoe",
    "avatar": "https://...",
    "bio": "Software developer",
    "twitter": "johndoe",
    "github": "johndoe",
    "linkedin": "johndoe",
    "website": "https://johndoe.com",
    "blogs": [
      {
        "id": 123,
        "title": "My Blog",
        "coverImage": "https://...",
        "shareCode": "abc12345",
        "publishTime": "2026-03-20T10:00:00"
      }
    ]
  }
}
```

### PUT /api/user/profile

**Purpose:** Update own profile
**Auth:** Required (JWT in Authorization header)
**Request:**
```json
{
  "bio": "Software developer",
  "avatar": "https://...",
  "twitter": "johndoe",
  "github": "johndoe",
  "linkedin": "johndoe",
  "website": "https://johndoe.com"
}
```

**Response:** Updated ProfileDTO

---

## Database Schema

### Option A: Extend users table (Recommended for v1.7)

Add columns to existing `users` table:

```sql
ALTER TABLE users ADD COLUMN bio VARCHAR(500);
ALTER TABLE users ADD COLUMN twitter VARCHAR(100);
ALTER TABLE users ADD COLUMN github VARCHAR(100);
ALTER TABLE users ADD COLUMN linkedin VARCHAR(100);
ALTER TABLE users ADD COLUMN website VARCHAR(255);
```

**Pros:** Simpler queries, no JOIN needed for profile
**Cons:** Users table grows with optional fields

### Option B: Separate user_profiles table

```sql
CREATE TABLE user_profiles (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL UNIQUE,
  bio VARCHAR(500),
  twitter VARCHAR(100),
  github VARCHAR(100),
  linkedin VARCHAR(100),
  website VARCHAR(255),
  create_time DATETIME,
  update_time DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**Recommendation:** Option A (extend users table) for v1.7 simplicity. Profile data is small and single-table queries perform well.

---

## New vs Modified Components

### Backend

| Type | Component | Changes |
|------|-----------|---------|
| NEW | UserProfileController | GET /profile/{username}, PUT /profile |
| MODIFIED | UserService | Add getPublicProfile(), updateProfile() |
| MODIFIED | User entity | Add bio, twitter, github, linkedin, website |
| NEW | ProfileDTO | Response DTO excluding sensitive fields |
| NEW | UpdateProfileRequest | Request DTO for profile updates |
| MODIFIED | BlogService | Add getPublishedBlogsByUserId() |

### Frontend

| Type | Component | Changes |
|------|-----------|---------|
| NEW | Profile.tsx | Public profile page at /user/:username |
| NEW | ProfileHeader.tsx | Display avatar, name, bio, social links |
| NEW | ProfileEditModal.tsx | Edit own profile (authenticated) |
| NEW | BlogGrid.tsx | Grid of user's published blogs |
| NEW | profileApi.ts | API service for profile endpoints |
| NEW | profile.d.ts | TypeScript types |
| MODIFIED | App.tsx | Add route /user/:username |

---

## Build Order

### Phase 1: Database & Backend Foundation

1. **Add columns to users table**
   - bio, twitter, github, linkedin, website

2. **Update User entity**
   - Add new fields with @TableField annotation

3. **Create ProfileDTO**
   - Exclude password, email, internal fields
   - Include username, avatar, bio, socialLinks, blogs[]

4. **Create UpdateProfileRequest DTO**
   - Validate field lengths and formats

5. **Update UserService**
   - getPublicProfile(username) - find user, build ProfileDTO, fetch blogs
   - updateProfile(userId, request) - update fields, save

6. **Update BlogService**
   - getPublishedBlogsByUserId(userId) - query blogs by userId where status=1

7. **Create UserProfileController**
   - GET /profile/{username} - public endpoint
   - PUT /profile - authenticated endpoint

### Phase 2: Frontend

8. **Create ProfileApi service**
   - fetchProfile(username)
   - updateProfile(data)

9. **Create Profile.tsx page component**
   - Route: /user/:username
   - Fetch and display profile data

10. **Create ProfileHeader.tsx**
    - Display avatar, username, bio, social link icons

11. **Create BlogGrid.tsx**
    - Display user's published blogs as cards
    - Link to /blog/:shareCode

12. **Create ProfileEditModal.tsx**
    - Authenticated users edit their own profile
    - Form with bio, avatar upload, social links

13. **Update App.tsx**
    - Add route: `<Route path="/user/:username" element={<Profile />} />`

### Phase 3: Integration

14. **Add profile link to navigation** (after login)

15. **Add redirect to profile after login** (auto-redirect to /user/{username})

---

## Anti-Patterns

### Anti-Pattern 1: N+1 Queries on Profile

**What:** Fetching blogs one-by-one in a loop
**Problem:** Performance degrades linearly with blog count
**Fix:** Use batch query: `BlogService.getPublishedBlogsByUserId(userId)`

### Anti-Pattern 2: Exposing Sensitive User Data

**What:** Returning password hash, email, or internal IDs in profile response
**Problem:** Data leak
**Fix:** Create separate ProfileDTO that explicitly excludes sensitive fields

### Anti-Pattern 3: Blocking Avatar Uploads on Profile Save

**What:** Processing avatar upload synchronously during profile update
**Problem:** Slow response times for profile updates
**Fix:** Use existing ImageController for uploads; store returned URL in profile

### Anti-Pattern 4: Not Filtering Unpublished Blogs

**What:** Displaying all user blogs regardless of publish status
**Problem:** Users may have draft blogs they don't want publicly visible
**Fix:** Filter by status=1 (published) in getPublishedBlogsByUserId()

---

## Scaling Considerations

| Scale | Architecture |
|-------|--------------|
| 0-10k users | Single MySQL sufficient, Redis cache profiles (24h TTL) |
| 10k-100k users | Add index on users.username, profile cache warm-up |
| 100k+ users | Read replicas for profile reads, CDN for avatars |

**First bottleneck:** Profile page with many blogs
**Fix:** Pagination (12 blogs per page), batch query

**Second bottleneck:** Avatar image loading
**Fix:** CDN for avatar URLs, lazy loading

---

## Sources

- Existing Vibe Onepage architecture patterns (User entity, BlogService, BlogController)
- MyBatis-Plus documentation for query patterns
- Spring Boot REST best practices

---

*Architecture research for: Vibe Onepage v1.7 User Profiles - Public Profile Pages*
*Researched: 2026-03-22*
