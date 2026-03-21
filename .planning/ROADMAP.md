# Vibe Onepage - Roadmap

**Project:** Vibe Onepage - AI-Powered Single-Page Website Builder
**Granularity:** Standard
**Total v1 Requirements:** 52 (3 existing, 49 to build)

## Phases

- [ ] **Phase 1: Template System Foundation** - Define 10 templates with block structures, establish component library
- [x] **Phase 2: Block Editor Core** - Drag-and-drop editor with dnd-kit, click-to-edit, state persistence (completed 2026-03-21)
- [ ] **Phase 3: AI Generation Pipeline** - Image analysis, style extraction, content generation, block assembly
- [ ] **Phase 4: Publishing, Payments & PDF** - Static site generation, subdomain hosting, WeChat Pay, PDF export
- [ ] **Phase 5: Polish & Performance** - Redis caching, 500 QPS optimization, animations, load testing

---

## Phase Details

### Phase 1: Template System Foundation

**Goal:** Users can browse and select from 10 templates that define block component structures

**Depends on:** Nothing (first phase)

**Requirements:** TPL-01, TPL-02, TPL-03, TPL-04, TPL-05

**Success Criteria** (what must be TRUE):
1. User sees template gallery with animated preview cards for all 10 templates
2. User can filter templates by category (Blog, Resume, Personal Intro)
3. Free templates display "Free" badge; paid templates display price (1-10 RMB)
4. User can click template to see full preview before selection
5. Each template defines a block component structure (Text, Image, Social Links, Contact)

**Plans:** 1 plan

Plans:
- [x] 01-01-PLAN.md -- Template gallery with animated cards, category filtering, template preview

---

### Phase 2: Block Editor Core

**Goal:** Users can build and edit pages using drag-and-drop block manipulation with inline editing

**Depends on:** Phase 1

**Requirements:** EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, EDIT-08, EDIT-09

**Success Criteria** (what must be TRUE):
1. User can add blocks from component library (Text H1/H2/paragraph/list, Image single/gallery, Social Links, Contact Form, Divider)
2. User can drag blocks to reorder using dnd-kit drag handles
3. User can remove blocks from the page
4. User can click any text element to edit inline directly on the page
5. User can click any image to replace it with an uploaded image
6. User can configure block-specific settings in a right sidebar panel
7. Editor state auto-saves to backend (debounced 500ms) and backs up to localStorage
8. User can undo/redo changes via keyboard shortcuts or buttons

**Plans:** 3/3 plans complete

Plans:
- [x] 02-01-PLAN.md -- Editor foundation: block components, Zustand store with undo/redo, BlockRenderer
- [x] 02-02-PLAN.md -- Editor canvas: dnd-kit integration, SortableBlock, click-to-edit, drag handles
- [x] 02-03-PLAN.md -- Editor polish: BlockConfigPanel, EditorToolbar, auto-save hook, main Editor orchestrator

---

### Phase 3: AI Generation Pipeline

**Goal:** Users can generate complete pages from a single image + description, with AI writing assist per block

**Depends on:** Phase 2

**Requirements:** AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, WRT-01, WRT-02, WRT-03, WRT-04, WRT-05, ORCH-01, ORCH-02, ORCH-03, ORCH-04

**Success Criteria** (what must be TRUE):
1. User can upload one main image and enter a one-sentence description to trigger AI generation
2. AI extracts color palette and mood keywords from the uploaded image
3. AI generates page content (title, paragraphs, image placements, block layout) matching the extracted style
4. Generated content appears as editable blocks in the editor; user can edit while generation runs
5. Each text block has a sparkle icon button that triggers AI writing assist
6. AI Write shows Replace/Append choice and generates content based on existing text
7. Generated blocks with low confidence scores are visually highlighted for user review
8. AI pipeline stages (Image Analysis, Style Extraction, Content Generation, Block Assembly) execute sequentially with validation gates

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md -- AI foundation: color extraction, Spring AI config, AIGenerationService
- [ ] 03-02-PLAN.md -- Async generation: RabbitMQ messaging, progress UI, block assembly
- [ ] 03-03-PLAN.md -- AI Writing Assist: sparkle button, Replace/Append modal, confidence highlighting

---

### Phase 4: Publishing, Payments & PDF

**Goal:** Users can publish sites to subdomains, purchase templates/credits, and export PDFs

**Depends on:** Phase 3

**Requirements:** HOST-01, HOST-02, HOST-03, HOST-04, HOST-05, HOST-06, PDF-01, PDF-02, PDF-03, PDF-04, PDF-05, PDF-06, PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07

**Success Criteria** (what must be TRUE):
1. User can click "Publish" to deploy their site to username.vibe.com (or localhost:port in dev)
2. Published site is accessible via unique shareable link
3. User can unpublish their site to remove from public access
4. User can purchase VIP subscription (10 RMB/month) to access all templates
5. Non-VIP users can purchase individual templates (1-10 RMB) or pay-per-PDF export
6. User balance is tracked (credits purchased, credits spent); PDF costs deducted
7. User can export current page as PDF; PDF generates server-side and is downloadable via link (expires 24h)
8. User sees PDF preview before being charged

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md -- AI foundation: color extraction, Spring AI config, AIGenerationService
- [ ] 03-02-PLAN.md -- Async generation: RabbitMQ messaging, progress UI, block assembly
- [ ] 03-03-PLAN.md -- AI Writing Assist: sparkle button, Replace/Append modal, confidence highlighting

---

### Phase 5: Polish & Performance

**Goal:** System handles 500 QPS on hot endpoints with smooth UX and template variety

**Depends on:** Phase 4

**Requirements:** PERF-01, PERF-02, PERF-03, PERF-04, PERF-05

**Success Criteria** (what must be TRUE):
1. Template listing and blog view endpoints handle 500 QPS under load (verified with JMeter)
2. Redis caching is active for template listing (24h TTL) and blog pages
3. Database indexes exist on userId and shareCode fields
4. HikariCP connection pool is tuned for high concurrency
5. Async job processing via RabbitMQ handles PDF and AI generation without blocking

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md -- AI foundation: color extraction, Spring AI config, AIGenerationService
- [ ] 03-02-PLAN.md -- Async generation: RabbitMQ messaging, progress UI, block assembly
- [ ] 03-03-PLAN.md -- AI Writing Assist: sparkle button, Replace/Append modal, confidence highlighting

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Template System Foundation | 1/1 | Completed | 2026-03-21 |
| 2. Block Editor Core | 3/3 | Complete   | 2026-03-21 |
| 3. AI Generation Pipeline | 0/1 | Not started | - |
| 4. Publishing, Payments & PDF | 0/1 | Not started | - |
| 5. Polish & Performance | 0/1 | Not started | - |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| TPL-01 | Phase 1 | Pending |
| TPL-02 | Phase 1 | Pending |
| TPL-03 | Phase 1 | Pending |
| TPL-04 | Phase 1 | Pending |
| TPL-05 | Phase 1 | Pending |
| EDIT-01 | Phase 2 | Done (02-02) |
| EDIT-02 | Phase 2 | Pending |
| EDIT-03 | Phase 2 | Done (02-02) |
| EDIT-04 | Phase 2 | Done (02-02) |
| EDIT-05 | Phase 2 | Done (02-02) |
| EDIT-06 | Phase 2 | Pending |
| EDIT-07 | Phase 2 | Pending |
| EDIT-08 | Phase 2 | Pending |
| EDIT-09 | Phase 2 | Pending |
| AI-01 | Phase 3 | Pending |
| AI-02 | Phase 3 | Pending |
| AI-03 | Phase 3 | Pending |
| AI-04 | Phase 3 | Pending |
| AI-05 | Phase 3 | Pending |
| AI-06 | Phase 3 | Pending |
| AI-07 | Phase 3 | Pending |
| WRT-01 | Phase 3 | Pending |
| WRT-02 | Phase 3 | Pending |
| WRT-03 | Phase 3 | Pending |
| WRT-04 | Phase 3 | Pending |
| WRT-05 | Phase 3 | Pending |
| ORCH-01 | Phase 3 | Pending |
| ORCH-02 | Phase 3 | Pending |
| ORCH-03 | Phase 3 | Pending |
| ORCH-04 | Phase 3 | Pending |
| HOST-01 | Phase 4 | Pending |
| HOST-02 | Phase 4 | Pending |
| HOST-03 | Phase 4 | Pending |
| HOST-04 | Phase 4 | Pending |
| HOST-05 | Phase 4 | Pending |
| HOST-06 | Phase 4 | Pending |
| PDF-01 | Phase 4 | Pending |
| PDF-02 | Phase 4 | Pending |
| PDF-03 | Phase 4 | Pending |
| PDF-04 | Phase 4 | Pending |
| PDF-05 | Phase 4 | Pending |
| PDF-06 | Phase 4 | Pending |
| PAY-01 | Phase 4 | Pending |
| PAY-02 | Phase 4 | Pending |
| PAY-03 | Phase 4 | Pending |
| PAY-04 | Phase 4 | Pending |
| PAY-05 | Phase 4 | Pending |
| PAY-06 | Phase 4 | Pending |
| PAY-07 | Phase 4 | Pending |
| AUTH-01 | Existing | Existing |
| AUTH-02 | Existing | Existing |
| AUTH-03 | Phase 4 | Pending |
| PERF-01 | Phase 5 | Pending |
| PERF-02 | Phase 5 | Pending |
| PERF-03 | Phase 5 | Pending |
| PERF-04 | Phase 5 | Pending |
| PERF-05 | Phase 5 | Pending |

**Coverage:** 52/52 requirements mapped (3 existing, 49 to build)
