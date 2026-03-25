# Requirements: Vibe Onepage

**Defined:** 2026-03-25
**Core Value:** Users can have a beautiful, personalized website live in minutes by combining AI-assisted generation with an intuitive block-level editor.

## v1.10 Requirements

Requirements for rich text formatting. Add inline text formatting and link support within text blocks.

### Text Formatting

- [x] **RICH-01**: User can make text bold (Ctrl+B or toolbar button)
- [x] **RICH-02**: User can make text italic (Ctrl+I or toolbar button)
- [x] **RICH-03**: User can underline text (Ctrl+U or toolbar button)

### Links

- [x] **LINK-01**: User can insert a link on selected text (Ctrl+K or toolbar button)
- [x] **LINK-02**: User can edit an existing link URL
- [x] **LINK-03**: User can remove a link from text
- [x] **LINK-04**: Link URLs are validated (no javascript:, data:, or invalid URLs)
- [x] **LINK-05**: User can set link to open in new tab

### UI/UX

- [x] **UI-01**: Floating toolbar appears when text is selected
- [x] **UI-02**: Toolbar shows Bold, Italic, Underline, Link buttons
- [x] **UI-03**: Active formatting states are visually indicated in toolbar

## v2 Requirements

Deferred to future release.

### Extended Formatting
- **RICH-04**: User can strikethrough text
- **RICH-05**: User can apply inline code formatting
- **RICH-06**: User can highlight text

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
| Custom template creation by users | Deferred |
| User-generated block components | Deferred |
| Multi-page websites | Single page only |
| Mobile app | Web-only for now |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RICH-01 | Phase 29 | Complete |
| RICH-02 | Phase 29 | Complete |
| RICH-03 | Phase 29 | Complete |
| LINK-01 | Phase 30 | Complete |
| LINK-02 | Phase 30 | Complete |
| LINK-03 | Phase 30 | Complete |
| LINK-04 | Phase 27 | Complete |
| LINK-05 | Phase 30 | Complete |
| UI-01 | Phase 28 | Complete |
| UI-02 | Phase 28 | Complete |
| UI-03 | Phase 28, Phase 31 | Complete |

**Coverage:**
- v1.10 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after v1.10 roadmap created*
