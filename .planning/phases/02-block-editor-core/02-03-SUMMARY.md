---
phase: 02-block-editor-core
plan: '03'
subsystem: editor
tags:
  - editor-toolbar
  - undo-redo
  - block-config
  - auto-save
  - persistence
dependency_graph:
  requires:
    - 02-02
  provides:
    - EDIT-06
    - EDIT-07
    - EDIT-08
    - EDIT-09
tech_stack:
  added:
    - use-debounce
  patterns:
    - Zustand temporal middleware for undo/redo
    - Debounced auto-save with 500ms delay
    - Block configuration panel with type-specific settings
    - sendBeacon for page unload saves
key_files:
  created:
    - frontend/src/components/Editor/EditorToolbar.tsx
    - frontend/src/components/Editor/BlockConfigPanel.tsx
    - frontend/src/components/Editor/useAutoSave.ts
    - frontend/src/components/Editor/Editor.tsx
  modified:
    - backend/src/main/java/com/onepage/model/Blog.java
    - backend/src/main/java/com/onepage/service/BlogService.java
    - backend/src/main/java/com/onepage/controller/BlogController.java
    - backend/src/main/resources/schema.sql
decisions:
  - "Used Zustand temporal middleware for undo/redo (per research recommendation)"
  - "Auto-save debounce set to 500ms with maxWait 2000ms"
  - "Blocks stored as JSON string in Blog.blocks field"
  - "API endpoint at PUT /api/blog/{id}/blocks (consistent with existing pattern)"
metrics:
  duration: 10 minutes
  completed: 2026-03-21
---

# Phase 2 Plan 3: Block Editor Core - Editor Polish

## One-liner

Editor toolbar with undo/redo, block configuration panel, auto-save hook, and main Editor orchestrator combining all components.

## What was built

### EditorToolbar component
Header toolbar with undo/redo buttons and publish button:
- **Undo button**: Calls `useEditorStore.temporal.getState().undo()` on click
- **Redo button**: Calls `useEditorStore.temporal.getState().redo()` on click
- **Keyboard shortcuts**: Cmd/Ctrl+Z for undo, Cmd/Ctrl+Shift+Z for redo
- **Visual feedback**: Buttons disabled when no past/future states available
- **Dirty state indicator**: Shows "Unsaved changes" (amber) or "Saved" (green)
- **Block count**: Shows number of blocks in editor

### BlockConfigPanel component
Right sidebar panel for block-specific settings:
- **Appears when block selected** via `selectedBlockId` from store
- **Close button** to deselect block
- **Type-specific settings**:
  - `image-single`: aspectRatio dropdown (1:1, 16:9, 4:3, 3:4, auto), rounded corners toggle
  - `image-gallery`: columns dropdown (2, 3, 4), rounded corners toggle
  - `text-h1/h2/paragraph`: text align dropdown (left, center, right)
  - `text-list`: list style dropdown (bullet, numbered)
  - `divider`: style dropdown (solid, dashed, dotted)
  - `social-links`/`contact-form`: placeholder text (settings coming soon)

### useAutoSave hook
Custom hook for debounced persistence:
- **Watches** `editorStore.blocks` and `isDirty` for changes
- **Debounces** 500ms using `use-debounce` library (maxWait 2000ms)
- **Saves** via PUT to `/api/blog/{id}/blocks`
- **Includes auth token** from localStorage
- **On success**: Updates `lastSavedBlocksRef`, calls `markSaved()`
- **On error**: Logs error (TODO: show error toast)
- **Before unload**: Uses `sendBeacon` for immediate save, localStorage backup

### Editor orchestrator component
Main component combining all editor parts:
- **Composes**: EditorToolbar, EditorCanvas, BlockLibrary, BlockConfigPanel
- **Initializes blocks** from `initialBlocks` prop (from blocks.json)
- **Auto-save**: Calls `useAutoSave(blogId)` hook
- **Click outside**: Deselects block when clicking canvas background
- **Graceful fallback**: Shows message if no blogId provided

### Backend API endpoint
Block persistence via REST API:
- **Endpoint**: `PUT /api/blog/{id}/blocks`
- **Request body**: `{ blocks: [...] }` array of block objects
- **Ownership validation**: Checks userId matches blog owner
- **Storage**: Blocks JSON string saved to `Blog.blocks` field
- **Cache invalidation**: Redis cache cleared on update

## Deviations from Plan

### None - plan executed exactly as written

## Verification

- [x] EditorToolbar shows undo/redo buttons with disabled state when unavailable
- [x] Keyboard shortcuts Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z work
- [x] BlockConfigPanel updates block config in real-time
- [x] BlockConfigPanel shows correct settings per block type
- [x] useAutoSave debounces saves to backend API (500ms)
- [x] Zustand persist middleware backs up to localStorage
- [x] Backend endpoint exists at PUT /api/blog/{id}/blocks
- [x] Blog model has `blocks` field

## Commits

- `8d9750e`: feat(02-03): add EditorToolbar with undo/redo buttons and keyboard shortcuts
- `8fffbfc`: feat(02-03): add BlockConfigPanel for block-specific settings
- `15439ea`: feat(02-03): add useAutoSave hook with debounce
- `b739cb8`: feat(02-03): create main Editor orchestrator component
- `132f0c5`: feat(02-03): add block persistence API endpoint

## Requirements Met

| ID | Requirement | Status |
|----|-------------|--------|
| EDIT-06 | Block configuration panel (right sidebar) | DONE |
| EDIT-07 | Auto-save to backend (debounced 500ms) | DONE |
| EDIT-08 | localStorage backup on each change | DONE (via Zustand persist) |
| EDIT-09 | Undo/redo via toolbar buttons and keyboard | DONE |
