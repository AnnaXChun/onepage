# Requirements: Vibe Onepage

**Defined:** 2026-03-24
**Core Value:** Users can have a beautiful, personalized website live in minutes by combining AI-assisted generation with an intuitive block-level editor.

## v1.9 Requirements (SHIPPED 2026-03-24)

Requirements for Lexical editor rebuild. Migrated from custom contentEditable to production-grade Lexical framework.

### Editor Core

- [x] **LEXICAL-01**: User can edit text inline in blocks using Lexical TextNode with stable contentEditable behavior
- [x] **LEXICAL-02**: User can drag-and-drop reorder blocks using @dnd-kit integrated with Lexical commands
- [x] **LEXICAL-03**: Editor state syncs to Zustand store via Lexical update listener
- [x] **LEXICAL-04**: Editor auto-saves to backend API with 500ms debounce

### Block Types

- [x] **BLOCK-01**: User can add/edit Text blocks (H1, H2, Paragraph, List) with Lexical nodes
- [x] **BLOCK-02**: User can add/edit Image blocks with aspect ratio and corner style config
- [x] **BLOCK-03**: User can add/edit Social Links blocks with editable URLs
- [x] **BLOCK-04**: User can add/edit Contact Form blocks
- [x] **BLOCK-05**: User can add/edit Divider blocks

### Block Configuration

- [x] **CONFIG-01**: User can change text alignment (left, center, right) per block
- [x] **CONFIG-02**: User can change text color and background color per block
- [x] **CONFIG-03**: User can toggle block visibility
- [x] **CONFIG-04**: Config changes persist to backend via existing API

### AI Integration

- [x] **AI-01**: User can trigger AI Write Assist on selected text block
- [x] **AI-02**: AI suggestions show confidence score and apply via Replace/Append modes

### Migration

- [x] **MIGRATE-01**: Existing saved blocks load correctly from backend into Lexical editor
- [x] **MIGRATE-02**: Preview page renders edited blocks correctly
- [x] **MIGRATE-03**: Published blog displays all block types correctly

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
| LEXICAL-01 | 24 | Complete |
| LEXICAL-02 | 24 | Complete |
| LEXICAL-03 | 24 | Complete |
| LEXICAL-04 | 24 | Complete |
| BLOCK-01 | 25 | Complete |
| BLOCK-02 | 25 | Complete |
| BLOCK-03 | 25 | Complete |
| BLOCK-04 | 25 | Complete |
| BLOCK-05 | 25 | Complete |
| CONFIG-01 | 25 | Complete |
| CONFIG-02 | 25 | Complete |
| CONFIG-03 | 25 | Complete |
| CONFIG-04 | 25 | Complete |
| AI-01 | 26 | Complete |
| AI-02 | 26 | Complete |
| MIGRATE-01 | 26 | Complete |
| MIGRATE-02 | 26 | Complete |
| MIGRATE-03 | 26 | Complete |

**Coverage:**
- v1.9 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-24*
*Last updated: 2026-03-24 after initial definition*
