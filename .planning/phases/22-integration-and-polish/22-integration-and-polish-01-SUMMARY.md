---
phase: 22-integration-and-polish
plan: "01"
subsystem: backend
tags:
  - profile
  - visitor-stats
  - featured-site
  - PROF-11
  - PROF-12
dependency_graph:
  requires: []
  provides:
    - ProfileAPI.totalVisitors
    - ProfileAPI.BlogSummary.featured
    - BlogService.getTotalVisitorsByUserId
    - BlogService.setFeaturedBlog
    - PUT /api/blog/{id}/featured
  affects:
    - UserProfileController
    - BlogController
tech_stack:
  added:
    - MyBatis @Select with foreach for SQL IN clause
    - @Transactional on setFeaturedBlog
key_files:
  created: []
  modified:
    - backend/src/main/java/com/onepage/model/Blog.java
    - backend/src/main/java/com/onepage/dto/ProfileDTO.java
    - backend/src/main/java/com/onepage/mapper/BlogMapper.java
    - backend/src/main/java/com/onepage/service/BlogService.java
    - backend/src/main/java/com/onepage/service/UserService.java
    - backend/src/main/java/com/onepage/controller/BlogController.java
    - backend/src/main/java/com/onepage/controller/UserProfileController.java
decisions:
  - id: "22-01-01"
    decision: "Use COALESCE in SQL to handle NULL sum as 0"
    rationale: "selectTotalVisitorsByBlogIds may return NULL when no stats exist"
  - id: "22-01-02"
    decision: "Clear all featured flags before setting new one"
    rationale: "Only one blog can be featured per user at a time"
key_links:
  - from: "BlogDailyStats"
    to: "BlogService.getTotalVisitorsByUserId()"
    via: "BlogMapper.selectTotalVisitorsByBlogIds()"
  - from: "Blog.featured"
    to: "ProfileDTO.BlogSummary.featured"
    via: "UserService.getPublicProfile()"
---

# Phase 22 Plan 01 Summary: Visitor Counts and Featured Site

## Objective

Add backend infrastructure for total visitor counts and featured site pinning. Profile API will return totalVisitors and featured flag on each blog. BlogController will expose setFeaturedBlog endpoint.

## One-liner

Total visitor counts aggregation and featured site pinning for user profiles.

## Tasks Completed

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Add featured field to Blog model | DONE | cee768a |
| 2 | Update ProfileDTO with totalVisitors and featured flag | DONE | cee768a |
| 3 | Add selectTotalVisitorsByBlogIds to BlogMapper | DONE | cee768a |
| 4 | Add getTotalVisitorsByUserId and setFeaturedBlog to BlogService | DONE | cee768a |
| 5 | Update UserProfileController/UserService to populate totalVisitors and featured | DONE | cee768a |
| 6 | Add PUT /api/blog/{id}/featured endpoint | DONE | cee768a |

## Truths Verified

- [x] Profile API returns total visitor count across all user's published sites
- [x] Profile API returns featured flag on each blog
- [x] User can set featured blog via API endpoint
- [x] Only one blog can be featured at a time per user

## Must-Haves Checklist

- [x] `private Boolean featured` in Blog.java
- [x] `totalVisitors` field in ProfileDTO
- [x] `BlogSummary.featured` exported in ProfileDTO
- [x] `getTotalVisitorsByUserId` method in BlogService
- [x] `setFeaturedBlog` method in BlogService
- [x] `selectTotalVisitorsByBlogIds` in BlogMapper
- [x] `PUT.*featured` endpoint in BlogController

## Verification

- Maven compile passes: `cd backend && mvn compile -q` - PASSED

## Deviations from Plan

None - plan executed exactly as written.

## Auth Gates

None.

## Known Stubs

None.

## Metrics

- Duration: ~20 minutes
- Files modified: 7
- Tasks completed: 6/6
- Commit hash: cee768a

## Self-Check

- [x] All modified files exist
- [x] Commit cee768a found in git log
- [x] All must-haves verified present
