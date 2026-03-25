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
- [x] **v1.9 Lexical Editor Rebuild** — Phases 24-26 (SHIPPED 2026-03-24) — [archive](milestones/v1.9-ROADMAP.md)
- [ ] **v1.10 Rich Text Formatting** — Phases 27-31

---

## Phases

- [ ] **Phase 27: LinkNode Foundation** - Install @lexical/link, implement URL validation, register LinkNode
- [ ] **Phase 28: Floating Toolbar** - Create toolbar that appears on text selection with format buttons
- [ ] **Phase 29: Text Formatting** - Implement bold, italic, underline with keyboard shortcuts
- [ ] **Phase 30: Link Support** - Insert, edit, remove links with URL validation and new tab option
- [ ] **Phase 31: UI Polish** - Active formatting states, mixed formatting verification, edge cases

---

## Phase Details

### Phase 27: LinkNode Foundation
**Goal:** Install required package and establish link infrastructure with URL validation
**Depends on:** Phase 26 (Lexical Editor Rebuild)
**Requirements:** LINK-04
**Success Criteria** (what must be TRUE):
  1. User can insert a link with valid http/https URL
  2. User cannot insert javascript:, data:, or other dangerous URL schemes
  3. Invalid URL attempts show validation error message
**Plans:** TBD

### Phase 28: Floating Toolbar
**Goal:** Toolbar appears when text is selected with format buttons
**Depends on:** Phase 27
**Requirements:** UI-01, UI-02, UI-03
**Success Criteria** (what must be TRUE):
  1. Selecting text in a text block triggers floating toolbar to appear
  2. Toolbar displays Bold, Italic, Underline, and Link buttons
  3. Toolbar visually indicates which formats are currently active on selection
  4. Clicking outside selection dismisses toolbar
**Plans:** TBD

### Phase 29: Text Formatting
**Goal:** User can apply bold, italic, and underline formatting to text
**Depends on:** Phase 28
**Requirements:** RICH-01, RICH-02, RICH-03
**Success Criteria** (what must be TRUE):
  1. User can make text bold via toolbar button or Ctrl+B
  2. User can make text italic via toolbar button or Ctrl+I
  3. User can underline text via toolbar button or Ctrl+U
  4. Formatting persists when saving and reopening the editor
**Plans:** TBD

### Phase 30: Link Support
**Goal:** User can insert, edit, and remove links within text
**Depends on:** Phase 29
**Requirements:** LINK-01, LINK-02, LINK-03, LINK-05
**Success Criteria** (what must be TRUE):
  1. User can insert a link on selected text via Ctrl+K or toolbar button
  2. User can edit an existing link URL
  3. User can remove a link from text (converts to plain text)
  4. User can set link to open in new tab via toggle
**Plans:** TBD

### Phase 31: UI Polish
**Goal:** Verify complex interactions and polish user experience
**Depends on:** Phase 30
**Requirements:** UI-03
**Success Criteria** (what must be TRUE):
  1. Active formatting states correctly reflect current selection
  2. Mixed formatting within paragraphs works correctly (e.g., bold within italic)
  3. Undo/redo preserves formatting
  4. Links with new tab setting render correctly on published site
**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 27. LinkNode Foundation | 0/1 | Not started | - |
| 28. Floating Toolbar | 0/1 | Not started | - |
| 29. Text Formatting | 0/1 | Not started | - |
| 30. Link Support | 0/1 | Not started | - |
| 31. UI Polish | 0/1 | Not started | - |

---

## Coverage

| Requirement | Phase |
|-------------|-------|
| RICH-01 | Phase 29 |
| RICH-02 | Phase 29 |
| RICH-03 | Phase 29 |
| LINK-01 | Phase 30 |
| LINK-02 | Phase 30 |
| LINK-03 | Phase 30 |
| LINK-04 | Phase 27 |
| LINK-05 | Phase 30 |
| UI-01 | Phase 28 |
| UI-02 | Phase 28 |
| UI-03 | Phase 28, Phase 31 |

**Coverage:** 11/11 requirements mapped
