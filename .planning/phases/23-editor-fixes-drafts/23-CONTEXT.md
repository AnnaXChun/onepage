# Phase 23: Editor Fixes & Drafts - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix critical editor bugs (text input, template image reset, Done button saves edits) and add drafts functionality (view drafts on profile, resume editing, auto-save). This phase does NOT cover publishing flow changes.

</domain>

<decisions>
## Implementation Decisions

### New Session Behavior
- **D-01:** Resume saved edits — when opening an existing blog in the editor, load the blog's last saved blocks from the backend, NOT from localStorage or template defaults

### Draft Storage Model
- **D-02:** Status field on blogs table — add `status` column with values 'draft'/'published' to distinguish draft from published blogs

### Draft UI Location
- **D-03:** Separate Drafts section — on profile page, show a distinct "My Drafts" section above/below published sites, not mixed in

### Auto-save Strategy
- **D-04:** Continuous auto-save — save to backend on changes with 500ms debounce (current behavior but must be connected to correct blog data)

### Done Button Behavior
- **D-05:** Done button saves blocks to backend before navigating — ensure auto-save completes before navigation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Frontend Patterns
- `frontend/src/components/Editor/Editor.tsx` — Editor component, loads blocks from blocks.json currently
- `frontend/src/components/Editor/EditorToolbar.tsx` — Done button location (handleDone function)
- `frontend/src/stores/editorStore.ts` — Zustand store with localStorage persistence
- `frontend/src/components/Editor/useAutoSave.ts` — Auto-save hook (needs review for correct blogId)
- `frontend/src/components/Editor/blocks/TextBlock.tsx` — Text editing component (contentEditable)
- `frontend/src/pages/Profile/Profile.tsx` — Profile page where drafts section is needed
- `frontend/src/App.tsx` — EditorPage and routing

### Backend Patterns
- `backend/src/main/java/com/onepage/model/Blog.java` — Blog entity (needs status field)
- `backend/src/main/java/com/onepage/controller/BlogController.java` — Blog API endpoints
- `backend/src/main/java/com/onepage/service/BlogService.java` — Blog service

### Project
- `.planning/REQUIREMENTS.md` — EDIT-01, EDIT-02, EDIT-03, DRAFT-01, DRAFT-02, DRAFT-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAutoSave.ts`: Already has continuous auto-save with 500ms debounce
- `editorStore.ts`: Uses Zustand with localStorage persistence for undo/redo
- `TextBlock.tsx`: contentEditable-based text editing

### Established Patterns
- Blog API: `/api/v1/blogs/{id}/blocks` for blocks updates
- Profile page: Shows user's published sites in a grid
- Blog status: Currently no status field — all blogs are effectively published or unpublished

### Integration Points
- Backend: Blog entity needs `status` column ('draft'/'published')
- Frontend: Editor needs to load from saved blog blocks, not template
- Frontend: Profile page needs Drafts section
- Frontend: Done button needs to ensure save completes before navigation

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

---

*Phase: 23-editor-fixes-drafts*
*Context gathered: 2026-03-23*
