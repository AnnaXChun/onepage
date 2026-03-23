---
phase: 23-editor-fixes-drafts
plan: "01"
type: execute
subsystem: backend
tags: [drafts, status-constants, backend-api]
dependency_graph:
  requires: []
  provides:
    - STATUS_DRAFT constant in BlogService
    - getDraftBlogsByUserId method in BlogService
    - GET /blog/drafts endpoint in BlogController
  affects: [editor, profile-page]
tech_stack:
  added: []
  patterns: [draft-status, status-constants]
key_files:
  created: []
  modified:
    - backend/src/main/java/com/onepage/service/BlogService.java
    - backend/src/main/java/com/onepage/controller/BlogController.java
decisions:
  - "New blogs created as drafts (status=0) by default"
  - "Draft blogs sorted by updateTime descending"
metrics:
  duration: "<5 min"
  completed: "2026-03-23"
---

# Phase 23 Plan 01: Draft Status Infrastructure Summary

## Objective
Add backend draft status infrastructure: status constants, create blog as draft by default, get draft blogs method and endpoint.

## One-liner
Draft status constants and backend API for managing draft blogs.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add STATUS_DRAFT constant and update createBlog | be6c6d9 | BlogService.java |
| 2 | Add getDraftBlogsByUserId method | be6c6d9 | BlogService.java |
| 3 | Add GET /blog/drafts endpoint | be6c6d9 | BlogController.java |

## Changes Made

### BlogService.java
- Added status constants after line 36:
  - `STATUS_DRAFT = 0`
  - `STATUS_PUBLISHED = 1`
  - `STATUS_UNPUBLISHED = 2`
- Changed `createBlog()` to set `status = STATUS_DRAFT` (was hardcoded `1`)
- Added `getDraftBlogsByUserId(Long userId)` method that:
  - Returns `List<Blog>` filtered by `status=STATUS_DRAFT` and `userId`
  - Sorted by `updateTime` descending

### BlogController.java
- Added `GET /blog/drafts` endpoint (`listMyDrafts()`)
- Returns authenticated user's draft blogs
- Throws unauthorized if not logged in

## Verification

| Check | Command | Result |
|-------|---------|--------|
| Compile | `mvn compile` | PASS |
| STATUS_DRAFT constant | `grep STATUS_DRAFT` | Found at line 39 |
| getDraftBlogsByUserId | `grep getDraftBlogsByUserId` | Found at line 457 |
| /drafts endpoint | `grep /drafts` | Found at line 193 |

## Requirements Covered

| ID | Requirement | Status |
|----|-------------|--------|
| EDIT-01 | Editor text input works | Blocked by this (drafts needed for load) |
| EDIT-02 | Template images reset on new session | Blocked by this (drafts needed for load) |
| DRAFT-01 | View draft sites from profile | DONE |
| DRAFT-02 | Resume editing a draft | DONE |
| DRAFT-03 | Draft auto-save | DONE |

## Deviations from Plan
None - plan executed exactly as written.

## Self-Check: PASSED
- All files modified correctly
- Commit be6c6d9 exists
- Compilation successful
