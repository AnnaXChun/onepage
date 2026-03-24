---
phase: 24-lexical-core-setup
plan: "01"
subsystem: editor
tags: [lexical, editor, dnd-kit, zustand, auto-save]
dependency-graph:
  requires: []
  provides:
    - id: LEXICAL-01
      description: TextNode inline editing with stable contentEditable
    - id: LEXICAL-02
      description: @dnd-kit drag integrated with Lexical commands
    - id: LEXICAL-03
      description: Zustand sync via Lexical update listener
    - id: LEXICAL-04
      description: 500ms debounced auto-save to backend
  affects:
    - frontend/src/components/Editor/Editor.tsx
    - frontend/src/components/Editor/LexicalEditor.tsx
    - frontend/src/components/Editor/LexicalBlockNode.ts
    - frontend/src/components/Editor/LexicalConfig.ts
    - frontend/src/stores/editorStore.ts
    - frontend/src/components/Editor/useAutoSave.ts
tech-stack:
  added:
    - "@lexical/react@^0.42.0"
    - "lexical@^0.42.0"
    - "@lexical/rich-text@^0.42.0"
    - "@lexical/list@^0.42.0"
    - "@lexical/utils@^0.42.0"
  patterns:
    - LexicalComposer for editor context
    - Custom BlockNode extending ElementNode
    - Zustand store for editor state
    - Debounced auto-save with Lexical state priority
key-files:
  created:
    - frontend/src/components/Editor/LexicalBlockNode.ts
    - frontend/src/components/Editor/LexicalConfig.ts
    - frontend/src/components/Editor/LexicalEditor.tsx
  modified:
    - frontend/package.json
    - frontend/src/stores/editorStore.ts
    - frontend/src/components/Editor/useAutoSave.ts
    - frontend/src/components/Editor/Editor.tsx
decisions:
  - "Lexical 0.42.0 bundles core in main 'lexical' package, not @lexical/core"
  - "Custom BlockNode extends ElementNode to support nested content"
  - "lexicalEditor stored in Zustand for cross-component access"
  - "Auto-save prioritizes Lexical state when available"
metrics:
  duration: ~5 minutes
  completed: "2026-03-24T08:10:00Z"
---

# Phase 24 Plan 01: Lexical Core Setup Summary

## Objective
Install Lexical framework, create editor wrapper with custom block nodes, integrate @dnd-kit drag-and-drop with Lexical commands, sync editor state to Zustand store, and ensure auto-save works with 500ms debounce.

## One-liner
Lexical text editor framework integrated with Zustand store and debounced auto-save for stable inline editing.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Install Lexical packages | 9483ad5 | package.json, package-lock.json |
| 2 | Create LexicalBlockNode | 1685e15 | LexicalBlockNode.ts |
| 3 | Create LexicalConfig | aba1ffe | LexicalConfig.ts |
| 4 | Create LexicalEditor | d90756a | LexicalEditor.tsx |
| 5 | Extend editorStore | edde3e5 | editorStore.ts |
| 6 | Update useAutoSave | 855e359 | useAutoSave.ts |
| 7 | Update Editor.tsx | cd44aa0 | Editor.tsx |
| 8 | Build verification | 96bebb8 | (verification only) |

## Implementation Details

### LexicalBlockNode.ts
Custom Lexical node extending ElementNode that stores:
- `blockId: string` - Unique identifier
- `blockType: BlockType` - Type from block.ts
- `blockConfig: string` - JSON serialized config

Exports `$createBlockNode()` factory and `$isBlockNode()` type guard.

### LexicalConfig.ts
Provides:
- `lexicalConfig` - Initial config for LexicalComposer with BlockNode
- `createLexicalUpdateListener()` - Factory for state sync

### LexicalEditor.tsx
LexicalComposer wrapper that:
- Stores editor reference in Zustand via `setLexicalEditor()`
- Registers update listener for state sync

### editorStore.ts additions
- `lexicalEditor: LexicalEditor | null` state
- `setLexicalEditor()` action
- `syncFromLexical()` action for state synchronization

### useAutoSave.ts updates
- Prioritizes Lexical state when `lexicalEditor` available
- Keeps 500ms debounce via `useDebouncedCallback`
- Keeps beforeunload handler for backup save

## Success Criteria Met

- [x] All @lexical/* packages installed >= 0.14.0 (actually 0.42.0)
- [x] LexicalComposer wraps editor with initial config
- [x] Custom BlockNode enables inline editing
- [x] Zustand syncs with Lexical via update listener
- [x] Auto-save debounced at 500ms
- [x] Build passes without errors

## Known Stubs

None - all stubs will be addressed in subsequent phases.

## Deviations from Plan

### Auto-fixed Issue: Lexical Package Structure Change

**Found during:** Task 1
**Issue:** Lexical 0.42.0 bundles core in main `lexical` package, not `@lexical/core` as originally specified in plan.
**Fix:** Updated package.json to use `lexical@^0.42.0` instead of `@lexical/core@^0.14.0`.
**Files modified:** frontend/package.json

## Commits

- `9483ad5` feat(phase-24): install Lexical packages
- `1685e15` feat(phase-24): create LexicalBlockNode custom node type
- `aba1ffe` feat(phase-24): create LexicalConfig with update listener factory
- `d90756a` feat(phase-24): create LexicalEditor wrapper component
- `edde3e5` feat(phase-24): extend editorStore with Lexical sync methods
- `855e359` feat(phase-24): update useAutoSave to use Lexical state
- `cd44aa0` feat(phase-24): import LexicalEditor in Editor
- `96bebb8` feat(phase-24): verify build succeeds with Lexical

## Next Steps

Phase 24 Plan 02 should integrate LexicalEditor into SortableBlock for per-block inline editing, completing the @dnd-kit drag-and-drop integration with Lexical commands.

## Self-Check: PASSED

- All required packages installed: @lexical/react, lexical, @lexical/rich-text, @lexical/list, @lexical/utils
- LexicalEditor.tsx uses LexicalComposer
- BlockNode class exports work
- editorStore.ts has Lexical sync methods
- Build succeeds without errors
