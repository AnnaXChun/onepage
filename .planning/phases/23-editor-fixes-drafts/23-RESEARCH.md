# Phase 23: Editor Fixes & Drafts - Research

**Researched:** 2026-03-23
**Domain:** React Editor + Draft Management + Backend State
**Confidence:** HIGH

## Summary

This phase fixes three critical editor bugs and adds drafts functionality. The core issues are:
1. The editor loads template defaults instead of saved blog blocks when editing an existing blog
2. The Done button navigates without ensuring auto-save completes
3. No draft status exists - all blogs are effectively "published" once created

The fixes involve: updating Editor.tsx and EditorPage.tsx to load from backend, ensuring Done button waits for save, adding draft status to Blog model, creating backend support for drafts, and adding a drafts section to the profile page.

**Primary recommendation:** Fix editor block loading first (D-01), then add draft status infrastructure, then update profile page for drafts display.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Resume saved edits - load blog's last saved blocks from backend, NOT localStorage or template defaults
- **D-02:** Status field on blogs table - add `status` column with values 'draft'/'published'
- **D-03:** Separate Drafts section - on profile page, show distinct "My Drafts" section above/below published sites
- **D-04:** Continuous auto-save - save to backend on changes with 500ms debounce (current behavior but must be connected to correct blog data)
- **D-05:** Done button saves blocks to backend before navigating - ensure auto-save completes before navigation

### Deferred Ideas
None - discussion stayed within phase scope.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| EDIT-01 | Editor text input works | TextBlock.tsx uses contentEditable correctly; bug is that template blocks override saved content |
| EDIT-02 | Template images reset on new session | Editor.tsx loads template blocks.json instead of fetching saved blocks from backend |
| EDIT-03 | Done button saves user's actual edits | Done button (App.tsx EditorPage) navigates without waiting for auto-save to complete |
| DRAFT-01 | View draft sites from profile | Need separate API endpoint and profile UI section for drafts |
| DRAFT-02 | Resume editing a draft | Must load blog's saved blocks from backend, not template defaults |
| DRAFT-03 | Draft auto-save | useAutoSave.ts already implemented with 500ms debounce; needs correct blogId |

## Standard Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18.2.0 | UI framework |
| Zustand | 5.0.12 | State management with persist middleware |
| zundo | 2.2.0 | Temporal undo/redo for Zustand |
| use-debounce | 10.0.4 | Debounced auto-save callback |
| React Router | 6.20.0 | Client-side routing |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Spring Boot | 3.2.0 | Application framework |
| MyBatis-Plus | 3.5.5 | Database ORM |
| fastjson2 | 2.0.43 | JSON serialization for blocks |

## Architecture Patterns

### Current Editor Block Loading Flow (BUGGY)
```
EditorPage (App.tsx)
  -> loads selectedTemplate.blocksJsonPath via fetch()
  -> passes as initialBlocks to Editor
  -> Editor.tsx initializes blocks from initialBlocks.defaultContent
  -> useAutoSave saves to /blogs/${blogId}/blocks
```

**Problem:** When editing an existing blog, it loads template defaults instead of the blog's saved blocks.

### Correct Editor Block Loading Flow (D-01)
```
EditorPage (App.tsx)
  -> fetch GET /blog/{blogId} to get blog data
  -> if blog.blocks exists, use that
  -> else load selectedTemplate.blocksJsonPath as fallback
  -> passes as initialBlocks to Editor
  -> useAutoSave saves to /blogs/${blogId}/blocks
```

### Done Button Flow (D-05)
```
handleDone (App.tsx EditorPage)
  -> trigger useAutoSave.save() immediately
  -> wait for save promise to resolve
  -> then navigate to /preview/${blogId}
```

### Backend Blog Status Values
| Status | Value | Meaning |
|--------|-------|---------|
| draft | 0 | Draft - not visible publicly |
| published | 1 | Published - visible at /blog/{shareCode} |
| unpublished | 2 | Unpublished - was published, now hidden |

### Draft Storage Model
- Blog model already has `status` field (Integer)
- New blogs created with `status=1` (published) via `createBlog()` in BlogService
- Need to update create to use `status=0` (draft) initially
- Need `getDraftBlogsByUserId()` method in BlogService

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Auto-save with debounce | Custom throttle implementation | use-debounce library (already in use) |
| Undo/redo state | Custom implementation | zundo temporal middleware (already in use) |
| JSON serialization | Manual JSON building | fastjson2 (already in use) |
| Block content editing | Raw contentEditable management | React state with onChange pattern |

## Common Pitfalls

### Pitfall 1: LocalStorage Overwrites Backend Data
**What goes wrong:** editorStore persist middleware loads blocks from localStorage, which may contain stale template blocks from a previous session.
**Why it happens:** Zustand persist middleware runs before initial block fetch completes.
**How to avoid:** In Editor.tsx, clear existing blocks before loading from backend when editing an existing blog (blogId exists and has saved blocks).
**Warning signs:** User sees template content instead of their saved edits.

### Pitfall 2: Navigation Before Save Completes
**What goes wrong:** Done button triggers navigation immediately, but auto-save is debounced.
**Why it happens:** handleDone navigates without waiting for pending save operations.
**How to avoid:** Call `save()` immediately (not debounced) and await its completion before navigating.
**Warning signs:** Users report edits are lost after clicking Done.

### Pitfall 3: Status Field Not Updated on Create
**What goes wrong:** New blogs created with status=1 (published) instead of status=0 (draft).
**Why it happens:** BlogService.createBlog hardcodes `blog.setStatus(1)`.
**How to avoid:** Change to `blog.setStatus(0)` for draft creation; add publish action to set status=1.

### Pitfall 4: Profile Shows All Blogs Instead of Published Only
**What goes wrong:** /blog/list returns all blogs without status filter.
**Why it happens:** BlogController.listMyBlogs() calls `lambdaQuery().list()` without status filter.
**How to avoid:** Add status filter or create separate endpoints for drafts vs published.

## Code Examples

### Backend: Blog Status Constants
```java
// BlogService.java - Status constants
public static final int STATUS_DRAFT = 0;
public static final int STATUS_PUBLISHED = 1;
public static final int STATUS_UNPUBLISHED = 2;
```

### Backend: Get Draft Blogs Method
```java
// BlogService.java
public List<Blog> getDraftBlogsByUserId(Long userId) {
    if (userId == null) {
        return List.of();
    }
    return this.lambdaQuery()
            .eq(Blog::getUserId, userId)
            .eq(Blog::getStatus, STATUS_DRAFT)
            .orderByDesc(Blog::getUpdateTime)
            .list();
}
```

### Backend: Update Create to Set Draft Status
```java
// BlogService.createBlog() - change this line:
// blog.setStatus(1);  // OLD - published by default
blog.setStatus(STATUS_DRAFT);  // NEW - draft by default
```

### Backend: Add Publish Endpoint for Drafts
```java
// BlogController.java
@PostMapping("/publish/{id}")
public Result<Blog> publish(@PathVariable Long id) {
    // existing logic sets status=1
}
```

### Frontend: Load Blocks from Backend (EditorPage)
```typescript
// App.tsx EditorPage - fetch blog and its blocks
useEffect(() => {
  const loadBlogBlocks = async () => {
    if (blogId) {
      const response = await getBlogById(blogId);
      if (response.code === 200 && response.data?.blocks) {
        // Use saved blocks from backend
        setBlocksJson(JSON.parse(response.data.blocks));
      } else if (selectedTemplate?.blocksJsonPath) {
        // Fallback to template blocks
        const resp = await fetch(selectedTemplate.blocksJsonPath);
        setBlocksJson(await resp.json());
      }
    }
  };
  loadBlogBlocks();
}, [blogId]);
```

### Frontend: Done Button with Save Wait (D-05)
```typescript
// App.tsx EditorPage - handleDone
const handleDone = async () => {
  // Trigger immediate save and wait
  if (currentBlog?.id) {
    await saveBlocksToBackend(currentBlog.id.toString(), blocks);
  }
  navigate(`/preview/${currentBlog?.id}`);
};
```

### Frontend: Profile with Drafts Section
```typescript
// Profile.tsx - add drafts section
const [drafts, setDrafts] = useState<BlogSummary[]>([]);

// Fetch drafts alongside profile
useEffect(() => {
  const loadDrafts = async () => {
    const response = await api.get('/blog/drafts');
    if (response.data.code === 200) {
      setDrafts(response.data.data);
    }
  };
  loadDrafts();
}, []);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All blogs published by default | Draft status on create | Phase 23 | Users can save work in progress |
| Editor loads template blocks | Editor loads saved blocks from backend | Phase 23 | Edits persist correctly |
| Done button ignores save state | Done waits for save | Phase 23 | No lost edits on navigation |

**Deprecated/outdated:**
- None relevant to this phase.

## Open Questions

1. **How to handle existing blogs without status field?**
   - What we know: Blog model has Integer status field already, but all existing blogs likely have status=1
   - What's unclear: Do we need a migration for existing data?
   - Recommendation: Treat null/1 status as "published" for backward compatibility

2. **Should creating a blog from template start as draft or published?**
   - What we know: D-04 says auto-save with 500ms debounce, D-02 says add draft status
   - What's unclear: User expectation - should template selection immediately create a visible blog?
   - Recommendation: Start as draft (status=0), publish explicitly via Publish button

3. **What happens when editing a published blog?**
   - What we know: Currently both draft and published blogs use same editor
   - What's unclear: Should editing a published blog create a draft copy?
   - Recommendation: Edit in place - changes save to same blog; user can unpublish if needed

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `frontend/vitest.config.ts` (if exists) |
| Quick run command | `npm run test -- --run` |
| Full suite command | `npm run test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| EDIT-01 | Text input updates block content | unit | `vitest run TextBlock.test.tsx` | TBD |
| EDIT-02 | Editor loads saved blocks on resume | integration | `vitest run Editor.test.tsx` | TBD |
| EDIT-03 | Done button waits for save | unit | `vitest run EditorPage.test.tsx` | TBD |
| DRAFT-01 | Drafts appear in profile | e2e | Manual verification needed | N/A |
| DRAFT-02 | Resume draft loads saved content | integration | `vitest run Editor.test.tsx` | TBD |
| DRAFT-03 | Auto-save saves to correct blog | unit | `vitest run useAutoSave.test.ts` | TBD |

### Sampling Rate
- **Per task commit:** `npm run test -- --run`
- **Per wave merge:** `npm run test`
- **Phase gate:** All tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/src/components/Editor/__tests__/` - test directory for editor components
- [ ] `frontend/src/components/Editor/__tests__/TextBlock.test.tsx` - text input behavior
- [ ] `frontend/src/components/Editor/__tests__/Editor.test.tsx` - block loading flow
- [ ] `frontend/src/components/Editor/__tests__/useAutoSave.test.ts` - auto-save logic
- [ ] `frontend/src/pages/Profile/__tests__/DraftsSection.test.tsx` - drafts display
- [ ] Framework install: vitest already in dependencies (package.json line 26 shows zundo, but vitest not listed - need to verify)

## Sources

### Primary (HIGH confidence)
- Context7: Not used - this is custom application code
- Code analysis of `Editor.tsx`, `EditorToolbar.tsx`, `EditorPage.tsx`, `useAutoSave.ts`, `editorStore.ts`, `TextBlock.tsx` - direct inspection of implementation
- Backend `BlogController.java`, `BlogService.java`, `Blog.java` - direct inspection of implementation

### Secondary (MEDIUM confidence)
- React/Zustand documentation for state management patterns
- Spring Boot/MyBatis-Plus documentation for service/repository patterns

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - well-established libraries with verified versions
- Architecture: HIGH - clear flow from code inspection; D-01 through D-05 provide explicit guidance
- Pitfalls: MEDIUM - identified from code patterns but not validated with runtime testing

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days - editor patterns are stable)
