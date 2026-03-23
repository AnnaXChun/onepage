---
phase: 22-integration-and-polish
plan: "04"
subsystem: frontend
tags: [featured-blog, pin-unpin, account-settings]
dependency_graph:
  requires: []
  provides: []
  affects: [AccountSettings, profileApi]
tech_stack:
  added:
    - fetchMyBlogs API function (profileApi.ts)
    - Featured Blog UI section with star toggle
  patterns:
    - Star icon toggle for featured/pinned state
    - Optimistic UI refresh after toggle
key_files:
  created: []
  modified:
    - frontend/src/services/profileApi.ts
    - frontend/src/components/AccountSettings/AccountSettings.tsx
decisions:
  - id: "22-04-1"
    decision: "Reused existing setFeaturedBlog from api.ts instead of duplicating"
    rationale: "setFeaturedBlog already exists in api.ts, imported it for use"
  - id: "22-04-2"
    decision: "Filter to only show published blogs (status === 1)"
    rationale: "Users should only be able to feature blogs that are actually published"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-23"
---

# Phase 22 Plan 04: Add Pin/Unpin UI to Account Settings Summary

## One-liner

Pin/unpin UI for featured blog added to Account Settings with star toggle button.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add fetchMyBlogs API function | 8dbda98 | profileApi.ts |
| 2 | Add Featured Blog section to AccountSettings | 8dbda98 | AccountSettings.tsx |

## Changes

### Task 1: Add fetchMyBlogs API function

Added `fetchMyBlogs` function to `profileApi.ts` that calls `GET /blog/list` to retrieve user's own blogs for the featured toggle.

### Task 2: Add "Manage Featured Blog" section to AccountSettings

Added to AccountSettings component:

**State:**
- `userBlogs` - array of user's published blogs
- `loadingBlogs` - loading state while fetching blogs

**useEffect:**
- Fetches user's blogs when modal opens
- Filters to only show published blogs (status === 1)

**handleToggleFeatured:**
- Calls `setFeaturedBlog(blogId, !currentFeatured)` to toggle
- Refreshes blog list after successful toggle

**UI:**
- "Featured Blog" section with description
- List of user's published blogs with cover image, title, publish date
- Star toggle button (filled star when featured, outline when not)
- Featured blogs highlighted with primary border and subtle background

## Verification

- Vite build passes successfully
- AccountSettings shows "Featured Blog" section with pin/unpin UI
- Only published blogs (status=1) appear in the list

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `8dbda98` feat(22-04): add pin/unpin UI for featured blog in Account Settings

## Self-Check

- [x] ProfileApi.ts exports fetchMyBlogs function
- [x] AccountSettings has "Manage Featured Blog" section with pin/unpin UI
- [x] Vite build passes
