# Requirements: Vibe Onepage

**Defined:** 2026-03-24
**Core Value:** Users can have a beautiful, personalized website live in minutes by combining AI-assisted generation with an intuitive block-level editor.

## v1.9 Requirements

Requirements for Lexical editor rebuild. Migrate from custom contentEditable to production-grade Lexical framework.

### Editor Core

- [ ] **LEXICAL-01**: User can edit text inline in blocks using Lexical TextNode with stable contentEditable behavior
- [ ] **LEXICAL-02**: User can drag-and-drop reorder blocks using @dnd-kit integrated with Lexical commands
- [ ] **LEXICAL-03**: Editor state syncs to Zustand store via Lexical update listener
- [ ] **LEXICAL-04**: Editor auto-saves to backend API with 500ms debounce

### Block Types

- [ ] **BLOCK-01**: User can add/edit Text blocks (H1, H2, Paragraph, List) with Lexical nodes
- [ ] **BLOCK-02**: User can add/edit Image blocks with aspect ratio and corner style config
- [ ] **BLOCK-03**: User can add/edit Social Links blocks with editable URLs
- [ ] **BLOCK-04**: User can add/edit Contact Form blocks
- [ ] **BLOCK-05**: User can add/edit Divider blocks

### Block Configuration

- [ ] **CONFIG-01**: User can change text alignment (left, center, right) per block
- [ ] **CONFIG-02**: User can change text color and background color per block
- [ ] **CONFIG-03**: User can toggle block visibility
- [ ] **CONFIG-04**: Config changes persist to backend via existing API

### AI Integration

- [ ] **AI-01**: User can trigger AI Write Assist on selected text block
- [ ] **AI-02**: AI suggestions show confidence score and apply via Replace/Append modes

### Migration

- [ ] **MIGRATE-01**: Existing saved blocks load correctly from backend into Lexical editor
- [ ] **MIGRATE-02**: Preview page renders edited blocks correctly
- [ ] **MIGRATE-03**: Published blog displays all block types correctly

## v2 Requirements

Deferred to future release.

### Rich Text
- **RICH-01**: Bold, italic, underline formatting within text blocks
- **RICH-02**: Link insertion within text

### Media
- **MEDIA-01**: Video embedding
- **MEDIA-02**: Audio playback blocks

### Collaboration
- **COLLAB-01**: Real-time collaborative editing (multi-user)
- **COLLAB-02**: Comments/annotations on blocks

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time collaboration | Single-user editing only per v1 constraints |
| Custom domain binding | Deferred to future |
| User-generated block components | Deferred |
| Multi-page websites | Single page only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| LEXICAL-01 | Phase 1 | Pending |
| LEXICAL-02 | Phase 1 | Pending |
| LEXICAL-03 | Phase 1 | Pending |
| LEXICAL-04 | Phase 1 | Pending |
| BLOCK-01 | Phase 2 | Pending |
| BLOCK-02 | Phase 2 | Pending |
| BLOCK-03 | Phase 2 | Pending |
| BLOCK-04 | Phase 2 | Pending |
| BLOCK-05 | Phase 2 | Pending |
| CONFIG-01 | Phase 2 | Pending |
| CONFIG-02 | Phase 2 | Pending |
| CONFIG-03 | Phase 2 | Pending |
| CONFIG-04 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| MIGRATE-01 | Phase 3 | Pending |
| MIGRATE-02 | Phase 3 | Pending |
| MIGRATE-03 | Phase 3 | Pending |

**Coverage:**
- v1.9 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after initial definition*
