# Vibe Onepage - Project State

**Last Updated:** 2026-03-21

## Project Reference

**Core Value:** Users can have a beautiful, personalized website live in minutes by combining AI-assisted generation with an intuitive block-level editor.

**Current Phase:** 1 - Template System Foundation

**Current Milestone:** v1 MVP

## Current Position

| Field | Value |
|-------|-------|
| Current Phase | 2 - Block Editor Core |
| Current Plan | Not started |
| Phase Status | Not started |
| Milestone Progress | 1/5 phases complete |

## Performance Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Requirements Mapped | 52/52 | 100% |
| Phases Defined | 5 | 5 |
| Plans Created | 0/5 | All phases |
| v1 Completion | 0% | 100% |

## Accumulated Context

### Decisions Made
- **dnd-kit** for drag-and-drop (not react-dnd or GrapesJS)
- **Spring AI** for AI pipeline orchestration (not LangChain4j - lighter for linear workflows)
- **OpenPDF** for PDF generation (not iText - better licensing)
- **5 phases** for v1 delivery (standard granularity)

### Block Component Model
Blocks are typed components with consistent interfaces:
- Text (H1, H2, paragraph, list)
- Image (single, gallery)
- Social Links
- Contact Form
- Divider

### AI Pipeline Pattern
Sequential stages with validation gates:
1. Image Analysis (MiniMax)
2. Style Extraction (colors, mood)
3. Content Generation
4. Block Assembly

### Research Flags (deferred to planning)
- Phase 3: Validate Spring AI vs LangChain4j decision
- Phase 4: Benchmark OpenPDF HTML-to-PDF CSS support

## Session Continuity

No active session. Roadmap just created.

## Notes

- AUTH-01, AUTH-02, AUTH-03 are existing capabilities (keep as-is)
- Phase 3 AI Pipeline can parallelize with Phase 1-2 frontend work after architecture defined
- Core revenue loop (Payments + PDF) must work before Phase 5 polish
