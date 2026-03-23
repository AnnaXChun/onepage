---
phase: 23-editor-fixes-drafts
plan: "02"
status: completed
completed: "2026-03-23T05:50:00Z"
duration: ~6 minutes
tasks_completed: 4
commits:
  - "6143176: feat(23-02): fix EditorPage to load saved blocks and await auto-save before navigation"
  - "b2098ea: fix(23-02): export saveBlocksToBackend for use in App.tsx"
files_modified:
  - frontend/src/App.tsx
  - frontend/src/services/api.ts
  - frontend/src/components/Editor/useAutoSave.ts
requirements:
  - EDIT-01: Editor text input works
  - EDIT-02: Template images reset on new session
  - EDIT-03: Done button saves user's actual edits
  - DRAFT-03: Draft auto-save
---

# Phase 23 Plan 02: Editor Fixes - Load Saved Blocks & Await Save

## Summary

Fixed EditorPage to properly load saved blocks from backend when editing an existing blog, and modified Done button to await auto-save completion before navigation.

## Changes Made

### 1. Added getDrafts API function (api.ts)
- New function `getDrafts(): Promise<ApiResponse<Blog[]>>` calls `GET /blog/drafts`
- Located after `getBlogById` for consistency

### 2. EditorPage loads saved blocks from backend (App.tsx)
- Added useEffect that calls `getBlogById(blogId)` when blogId exists
- Parses `response.data.blocks` JSON and sets `blocksJson` with saved blocks
- This replaces template defaults when editing existing blog (EDIT-02)

### 3. handleDone awaits saveBlocksToBackend before navigation (App.tsx)
- Changed `handleDone` from sync to `async` function
- Added `await saveBlocksToBackend(targetBlogId, blocks)` call before navigation
- Uses `useEditorStore` to get current blocks
- Navigation only proceeds after save completes (EDIT-03)

### 4. Exported saveBlocksToBackend (useAutoSave.ts)
- Changed `saveBlocksToBackend` from private to `export async function`
- Allows import in App.tsx for direct save call

## Deviations from Plan

**Rule 3 - Auto-fix blocking issue:** The plan referenced `saveBlocksToBackend` as already exported, but it was a private function. Fixed by exporting it.

## Verification

- `npm run build` passes
- `grep -n "getDrafts" frontend/src/services/api.ts` - found at line 156
- `grep -n "loadSavedBlocks\|await saveBlocksToBackend" frontend/src/App.tsx` - both patterns found
- `grep -n "useAutoSave(blogId)" frontend/src/components/Editor/Editor.tsx` - confirmed at line 34

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Export saveBlocksToBackend | Plan referenced it as importable but it wasn't exported |
| await saveBlocksToBackend in handleDone | Must wait for save to complete before navigation to ensure edits are persisted (EDIT-03) |

## Known Stubs

None.

## Self-Check: PASSED

- [x] Commits exist: 6143176, b2098ea
- [x] Files modified exist
- [x] Frontend builds successfully
