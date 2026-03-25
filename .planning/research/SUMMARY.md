# Project Research Summary

**Project:** Vibe Onepage - Rich Text Formatting (v1.10)
**Domain:** Block editor rich text formatting with Lexical
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

This research addresses adding rich text formatting (bold, italic, underline, links) to the existing Lexical-based block editor. The good news: all core packages are already installed at v0.42.0 and the foundation exists. The work involves building a custom floating toolbar component that appears on text selection and integrating link support which requires installing `@lexical/link` (currently missing from package.json).

The recommended approach is Option B: Floating Toolbar on Existing Structure. This keeps the current TextBlock contentEditable architecture but adds a floating format toolbar that dispatches Lexical commands. This is faster to implement than Option A (full Lexical per-block editors) while still delivering working rich text for v1.10, with migration to Option A possible in a later milestone.

Key risks center on content model changes. The current Zustand store treats block content as plain strings, but rich text formatting requires storing structured Lexical JSON. The sync logic in `editorStore.ts` currently only extracts `.text` property, which will lose format flags. This must be redesigned before any formatting persists correctly. Link URL validation is also critical to prevent XSS attacks on published sites.

## Key Findings

### Recommended Stack

**Core technologies:**
- `lexical@0.42.0` (core editor framework) — already installed
- `@lexical/react@0.42.0` (React bindings) — already installed
- `@lexical/rich-text@0.42.0` (formatting commands) — already installed
- `@lexical/link@0.42.0` (link support) — **MISSING, must install**
- `@lexical/code-core@0.42.0` (code highlighting) — already installed
- `FloatingTextFormatToolbarPlugin` (playground reference) — custom implementation required

No new npm packages required except `@lexical/link`. All other packages are installed and version-aligned at 0.42.0.

### Expected Features

**Must have (table stakes):**
- Bold, Italic, Underline (Ctrl+B/I/U) — universal editing expectation
- Strikethrough, Inline code — common formatting needs
- Clickable links (Ctrl+K) — web-standard expectation
- Floating toolbar on text selection — modern editor UX pattern
- Keyboard shortcuts — power user requirement
- Mixed formatting within paragraphs — rich text expectation

**Should have (competitive):**
- Link URL editing inline — professional feel
- Highlight formatting — nice-to-have

**Defer (v2+):**
- Real-time collaborative formatting — requires Yjs, significant complexity
- Table blocks — low value vs complexity for single-page builder
- Custom formatting presets — theme inconsistency risk
- Inline image formatting — requires complex node types

### Architecture Approach

The system uses Lexical's command-based architecture where actions dispatch commands (FORMAT_TEXT_COMMAND, TOGGLE_LINK_COMMAND) that registered listeners handle. The floating toolbar subscribes to SELECTION_CHANGE_COMMAND to appear on text selection and positions via portal at the selection bounding rect.

**Major components:**
1. **RichTextPlugin** — registers keyboard shortcuts and formatting commands via FORMAT_TEXT_COMMAND
2. **FloatingToolbar** — shows on text selection, positions near selection, dispatches format commands
3. **LinkEditorModal** — URL input, validation, insert/edit links via TOGGLE_LINK_COMMAND
4. **TextNode** — stores text with inline styles (bold, italic, etc.) via __format flags
5. **LinkNode** — hyperlink element with URL, target, rel attributes

**New files to create:**
- `FloatingToolbar.tsx` — selection-aware toolbar with format buttons
- `LinkEditorModal.tsx` — modal for URL input and validation
- `useTextFormat.ts` — hook wrapping dispatchCommand for each format
- `useSelectionPosition.ts` — hook calculating toolbar position from selection rect
- `linkUtils.ts` — URL sanitization and validation (critical for XSS prevention)
- `toolbar.css` — floating toolbar styling with OKLCH colors

**Modified files:**
- `LexicalBlockNode.tsx` — add LinkNode to initialConfig.nodes
- `EditorContext.tsx` — add FloatingToolbar and LinkEditorModal to editor wrapper

### Critical Pitfalls

1. **BlockNode content treated as plain string** — `editorStore.ts` sync only extracts `.text`, losing format flags. Must redesign content model to store Lexical JSON or structured format data.

2. **Floating toolbar positioning breaks with BlockNode** — selection.getBoundingClientRect() calculates incorrectly because editor root differs from block container. Requires proper anchor positioning within LexicalComposer context.

3. **Link insertion without URL validation** — XSS risk. Users can insert `javascript:alert(1)` links. Must create URL validation utility rejecting non-http/https protocols before insertion.

4. **Keyboard shortcuts fire when editor not focused** — Ctrl+B/I/U fires system-wide. Must wrap handlers with `editor.isFocused()` check.

5. **Double-update sync loop between Lexical and Zustand** — Lexical update triggers Zustand sync triggers auto-save triggers Lexical re-render. Must add sync flag and use Lexical's dirtyLeaves/dirtyElements to only sync changed nodes.

## Implications for Roadmap

### Phase 1: Foundation - LinkNode and URL Validation
**Rationale:** Links require `@lexical/link` package installation and URL validation is security-critical before any link feature ships.
**Delivers:** `@lexical/link` installed, LinkNode registered in Lexical config, linkUtils.ts with URL validation
**Addresses:** Links feature from FEATURES.md
**Avoids:** XSS via link insertion (Pitfall 29)
**Research flag:** Standard Lexical patterns, no additional research needed

### Phase 2: Core Formatting - Bold, Italic, Underline
**Rationale:** These are the most expected features and use the same FORMAT_TEXT_COMMAND pattern. Build toolbar structure with these first.
**Delivers:** FloatingToolbar.tsx with bold/italic/underline buttons, useTextFormat.ts hook
**Addresses:** Bold, Italic, Underline, Floating toolbar, Keyboard shortcuts
**Avoids:** Toolbar positioning issues by implementing proper anchor positioning from the start
**Research flag:** Standard Lexical patterns

### Phase 3: Extended Formatting - Strikethrough, Code, Highlight
**Rationale:** Lower priority, same implementation pattern as core formatting.
**Delivers:** Additional format buttons on toolbar
**Uses:** Same useTextFormat.ts hook, new format types
**Research flag:** Standard Lexical patterns

### Phase 4: Link Support - Insert, Edit, Remove
**Rationale:** Depends on Phase 1 URL validation. Link insertion requires user input modal.
**Delivers:** LinkEditorModal.tsx, link button on toolbar, edit-existing-link flow
**Implements:** LinkEditorModal component
**Avoids:** Sync loop by careful update listener architecture
**Research flag:** Standard Lexical patterns

### Phase 5: Polish - Testing and Edge Cases
**Rationale:** Verify the complex interactions work correctly before release.
**Delivers:** Mixed formatting within paragraphs, paste handling, undo/redo with formatting
**Avoids:** Paste stripping formatting (must remove custom paste handler), undo losing formats
**Research flag:** May need integration testing research

### Phase Ordering Rationale

- **Links first for security:** URL validation must ship with link feature, not added after
- **Core formatting first:** Bold/italic/underline are highest-value, simplest to implement
- **Link modal after toolbar:** The modal builds on the same toolbar infrastructure
- **Polish last:** Undo/redo and paste handling are complex interactions that need full feature set working

### Research Flags

Phases with standard patterns (skip research-phase):
- **Phases 1-4:** Lexical rich text is well-documented, official patterns available

Phases likely needing deeper research during planning:
- **Phase 5 (Polish):** Paste handling conflict between custom handler and Lexical's built-in requires investigation of current TextBlock implementation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified in node_modules, versions aligned at 0.42.0 |
| Features | MEDIUM-HIGH | User expectations clear; implementation approach (Option B) is recommended but not final |
| Architecture | HIGH | Lexical patterns well-documented; floating toolbar reference implementation available |
| Pitfalls | HIGH | v1.10 pitfalls identified from code analysis; architectural issues verified in source |

**Overall confidence:** HIGH

The research is specific and actionable. The main uncertainty is whether Option B (floating toolbar on existing structure) is the right long-term approach versus Option A (per-block Lexical editors), but Option B is correct for v1.10 to ship working rich text quickly.

### Gaps to Address

- **Content model redesign:** The sync between Lexical JSON and Zustand store needs architectural decision before Phase 2 begins. Options: (a) store Lexical JSON in content field, (b) create structured format data type. Must resolve in planning.

- **TextBlock migration path:** Current TextBlock uses contentEditable. Research assumes it will be migrated to use Lexical's ContentEditable. If this is not feasible, Option B implementation changes significantly.

- **@lexical/link installation:** The package is missing from package.json. Must be installed before Phase 1 can proceed.

## Sources

### Primary (HIGH confidence)
- Lexical 0.42.0 official documentation (lexical.dev) — rich text concepts, commands, selection
- Lexical Playground FloatingTextFormatToolbarPlugin (GitHub) — reference implementation
- Lexical npm packages — verified installed at 0.42.0
- Existing codebase: LexicalConfig.ts, editorStore.ts, LexicalBlockNode.ts

### Secondary (MEDIUM confidence)
- Lexical Playground ToolbarPlugin — implementation patterns for toolbar
- Community discussions on floating toolbar positioning with custom nodes

### Tertiary (LOW confidence)
- None identified

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*
