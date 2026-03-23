---
phase: 22-integration-and-polish
plan: 03
subsystem: frontend
tags: [z-index, dropdown, featured-blog]
dependency_graph:
  requires: []
  provides: []
  affects: [AuthButtons, api, Orders]
tech_stack:
  added: []
  patterns: []
key_files:
  created: []
  modified:
    - frontend/src/components/Header/AuthButtons.tsx
    - frontend/src/services/api.ts
    - frontend/src/pages/Orders/Orders.jsx
decisions: []
metrics:
  duration: "< 1 min"
  completed: "2026-03-22"
---

# Phase 22 Plan 03 Summary: Gap Closure

## One-liner
AuthButtons dropdown z-index fixed to appear above MobileMenu; setFeaturedBlog API added.

## Completed Tasks

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Fix z-index for AuthButtons dropdown | 8ead18a | AuthButtons.tsx |
| 2 | Verify BlogService.setFeaturedBlog exists | c76e050 | (verification only) |
| 3 | Add setFeaturedBlog API function | 64dd41c | api.ts |
| 4 | Add pin/unpin UI to Orders page | 8ceec7c | Orders.jsx |

## Deviations

- **Task 4 data limitation**: Orders.jsx displays payment orders (template purchases), not blogs. Orders data structure lacks `blogId`/`featured` fields. The setFeaturedBlog import was added but actual pin/unpin UI requires blog data that exists on a blogs list page, not orders.

## Known Issues

- Orders page pin/unpin requires blog data integration (orders show template purchases, not user blogs)
