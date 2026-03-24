# Vibe Onepage - Roadmap

**Project:** Vibe Onepage - AI-Powered Single-Page Website Builder
**Granularity:** Standard

---

## Milestones

- [x] **v1.0 MVP** — Phases 1-5 (shipped 2026-03-21)
- [x] **v1.1 Completion** — Phases 6-10 (shipped 2026-03-21)
- [x] **v1.2 Analytics** — Phase 11 (SHIPPED 2026-03-22)
- [x] **v1.3 SEO Tools** — Phase 12 (SHIPPED 2026-03-22)
- [x] **v1.4 Email & Notifications** — Phases 13-14 (SHIPPED 2026-03-22)
- [x] **v1.5 Enhanced Analytics** — Phases 15-17 (SHIPPED 2026-03-22)
- [x] **v1.6 UI Polish** — Phases 18-19 (SHIPPED 2026-03-22)
- [x] **v1.7 User Profiles** — Phases 20-22 (SHIPPED 2026-03-23)
- [x] **v1.8 Editor Fixes** — Phase 23 (SHIPPED 2026-03-23) — [archive](milestones/v1.8-ROADMAP.md)
- [ ] **v1.9 Lexical Editor Rebuild** — Phases 24-26 (IN PROGRESS)

---

_Current milestone: v1.9 Lexical Editor Rebuild_

## v1.9 Phases

### Phase 24: Lexical Core Setup
**Goal:** Install Lexical framework, create editor wrapper, integrate @dnd-kit for drag-and-drop, sync with Zustand store.

**Requirements:** LEXICAL-01, LEXICAL-02, LEXICAL-03, LEXICAL-04

**Success Criteria:**
1. Lexical packages installed (@lexical/react, @lexical/core)
2. LexicalComposer wraps editor with initial config
3. TextNode enables inline editing without contentEditable bugs
4. @dnd-kit drag handle triggers Lexical MOVE_BLOCK command
5. Lexical update listener syncs state to Zustand on every change
6. Auto-save debounced at 500ms writes to backend API

---

### Phase 25: Block Type Migration
**Goal:** Migrate all 5 block types to Lexical nodes with full config panel support.

**Requirements:** BLOCK-01, BLOCK-02, BLOCK-03, BLOCK-04, BLOCK-05, CONFIG-01, CONFIG-02, CONFIG-03, CONFIG-04

**Success Criteria:**
1. BlogHeadingNode (H1/H2) extends ElementNode
2. BlogParagraphNode supports text content
3. BlogListNode supports bullet/numbered lists
4. ImageNode stores URL, aspectRatio, rounded config
5. SocialLinksNode stores array of platform/URL objects
6. ContactFormNode stores form field configurations
7. DividerNode renders styled `<hr>` element
8. BlockConfigPanel reads/writes Lexical node properties
9. Config changes persist via `updateBlogBlocks` API

---

### Phase 26: AI Integration & Migration
**Goal:** Connect AI Write Assist to Lexical selection, ensure existing blogs load and render correctly.

**Requirements:** AI-01, AI-02, MIGRATE-01, MIGRATE-02, MIGRATE-03

**Success Criteria:**
1. Selecting text shows AI Assist button in toolbar
2. AI Assist triggers existing `aiService.suggest()`
3. Suggestions display confidence score; Replace/Append modes work
4. Backend returns blocks JSON → Lexical reconstructs nodes
5. Preview page renders edited blocks correctly
6. Published blog displays all block types correctly

---
