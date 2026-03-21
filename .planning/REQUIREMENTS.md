# Requirements: Vibe Onepage

**Defined:** 2026-03-21
**Core Value:** Users can have a beautiful, personalized website live in minutes — not hours — by combining AI-assisted generation with an intuitive block-level editor.

## v1 Requirements

### Template System

- [ ] **TPL-01**: 10 fixed templates across Blog, Resume, Personal Intro categories
- [ ] **TPL-02**: Templates define block component structure (Text, Image, Social Links, Contact)
- [ ] **TPL-03**: Template categories displayed in gallery with animated preview cards
- [ ] **TPL-04**: Free vs paid template flag; paid templates show price (1-10 RMB)
- [ ] **TPL-05**: Template thumbnail preview before selection

### Block Editor

- [ ] **EDIT-01**: Block-level drag-and-drop using dnd-kit (add, remove, reorder blocks)
- [ ] **EDIT-02**: Block component library: Text (H1, H2, paragraph, list), Image (single, gallery), Social Links, Contact Form, Divider
- [ ] **EDIT-03**: Drag handle on each block for reordering
- [ ] **EDIT-04**: Click-to-Edit: click any text element to edit inline
- [ ] **EDIT-05**: Click-to-Edit: click image to replace with uploaded image
- [ ] **EDIT-06**: Block configuration panel (right sidebar) for block-specific settings
- [ ] **EDIT-07**: Editor state persisted to backend on change (debounced 500ms)
- [ ] **EDIT-08**: Editor state backed up to localStorage on each change
- [ ] **EDIT-09**: Undo/redo support via Zustand history store

### AI Website Generation

- [ ] **AI-01**: User uploads one main image + enters one-sentence description
- [ ] **AI-02**: AI extracts RGB color palette and mood keywords from uploaded image via MiniMax
- [ ] **AI-03**: AI generates complete page content (title, paragraphs, image placements, block layout) matching extracted style
- [ ] **AI-04**: Generated content is placed into editable blocks in the editor
- [ ] **AI-05**: Generation runs async as background job; user can edit other content while waiting
- [ ] **AI-06**: Generation progress indicator shown to user
- [ ] **AI-07**: Generated content has confidence score; low-confidence blocks are highlighted for user review

### AI Writing Assist

- [ ] **WRT-01**: Each text block has inline "AI Write" button (sparkle icon)
- [ ] **WRT-02**: Click AI Write button generates content based on existing text in the block
- [ ] **WRT-03**: Generated text replaces or appends to existing text (user choice: "Replace" / "Append")
- [ ] **WRT-04**: AI Write uses Spring AI + MiniMax API
- [ ] **WRT-05**: Each text block has independent AI generation context

### AI Workflow Orchestration

- [ ] **ORCH-01**: Spring AI orchestrates pipeline: Image Analysis → Style Extraction → Content Generation → Block Assembly
- [ ] **ORCH-02**: Each pipeline stage has validation gate before proceeding
- [ ] **ORCH-03**: Pipeline stages are request-scoped; no state leakage between requests
- [ ] **ORCH-04**: Pipeline result includes structured block data (type, content, position, style)

### Platform Hosting

- [ ] **HOST-01**: User clicks "Publish" to deploy site to platform
- [ ] **HOST-02**: Published site accessible at `username.vibe.com` (production) or `localhost:port` (dev)
- [ ] **HOST-03**: Published site is static HTML/CSS output (no server-side rendering)
- [ ] **HOST-04**: Unique shareable link per published site
- [ ] **HOST-05**: User can unpublish site (removes from public access)
- [ ] **HOST-06**: Subdomain DNS routing configured in production

### PDF Export

- [ ] **PDF-01**: User can export current page as PDF
- [ ] **PDF-02**: PDF generated server-side using OpenPDF
- [ ] **PDF-03**: PDF generation runs as async job (not blocking UI)
- [ ] **PDF-04**: PDF generation costs ~0.1-0.5 RMB (charged to user balance)
- [ ] **PDF-05**: Generated PDF is downloadable via link (expires after 24h)
- [ ] **PDF-06**: PDF preview shown before charging user

### Payments & Subscriptions

- [ ] **PAY-01**: VIP subscription: 10 RMB/month
- [ ] **PAY-02**: VIP users can access all templates (free + paid)
- [ ] **PAY-03**: Non-VIP users can purchase individual templates (1-10 RMB per template)
- [ ] **PAY-04**: Payment via existing WeChat Pay integration
- [ ] **PAY-05**: Template purchase is one-time (lifetime access to that template)
- [ ] **PAY-06**: User balance tracking (credits purchased, credits spent)
- [ ] **PAY-07**: PDF export deducted from user balance

### User Authentication

- [ ] **AUTH-01**: User registration and login (existing, keep as-is)
- [ ] **AUTH-02**: JWT authentication with 7-day access token, 30-day refresh token (existing, keep as-is)
- [ ] **AUTH-03**: VIP status checked on each protected action

### Performance & Infrastructure

- [ ] **PERF-01**: Hot endpoints (template listing, blog view) handle 500 QPS
- [ ] **PERF-02**: Redis caching for template listing (24h TTL) and blog pages
- [ ] **PERF-03**: Database indexes on frequently queried fields (userId, shareCode)
- [ ] **PERF-04**: HikariCP connection pool tuning for high concurrency
- [ ] **PERF-05**: Async job processing via RabbitMQ for PDF generation and AI generation

## v2 Requirements

### Additional Features

- **V2-01**: Custom domain binding (user brings their own domain)
- **V2-02**: More templates (20+ templates)
- **V2-03**: Custom user-created block components
- **V2-04**: Team collaboration (multiple editors per site)
- **V2-05**: Analytics dashboard (visitor counts, page views)
- **V2-06**: Email notifications (new comments, site published)

### Additional Platforms

- **V2-07**: Social media sharing optimization (OG tags, Twitter cards)
- **V2-08**: SEO tools (sitemap, robots.txt, custom meta tags)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-page websites | Single-page is core value proposition |
| Mobile app | Web-only for now |
| Code export | Removes SaaS lock-in, reduces revenue |
| OAuth-only signup | Email/password needed for account recovery |
| Real-time collaborative editing | Extreme complexity with locking/conflict resolution |
| User-generated templates | Template system complexity; fixed templates first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TPL-01 | Phase 1 | Pending |
| TPL-02 | Phase 1 | Pending |
| TPL-03 | Phase 1 | Pending |
| TPL-04 | Phase 1 | Pending |
| TPL-05 | Phase 1 | Pending |
| EDIT-01 | Phase 2 | Pending |
| EDIT-02 | Phase 2 | Pending |
| EDIT-03 | Phase 2 | Pending |
| EDIT-04 | Phase 2 | Pending |
| EDIT-05 | Phase 2 | Pending |
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

**Coverage:**
- v1 requirements: 52 total (3 existing, 49 to build)
- Mapped to phases: 52
- Unmapped: 0

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 after roadmap creation*
