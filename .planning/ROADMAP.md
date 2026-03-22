# Vibe Onepage - Roadmap

**Project:** Vibe Onepage - AI-Powered Single-Page Website Builder
**Granularity:** Standard
**Total v1 Requirements:** 52 (31 existing, 21 v1.1 to build)

---

## Milestones

- [x] **v1.0 MVP** — Phases 1-5 (shipped 2026-03-21)
- [x] **v1.1 Completion** — Phases 6-10 (shipped 2026-03-21)
- [ ] **v1.2 Analytics** — Phase 11

---

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-03-21</summary>

- [x] Phase 1: Template System Foundation (1/1 plan) — completed 2026-03-21
- [x] Phase 2: Block Editor Core (3/3 plans) — completed 2026-03-21
- [x] Phase 3: AI Generation Pipeline (3/3 plans) — completed 2026-03-21
- [x] Phase 4: Publishing, Payments & PDF (4/4 plans) — completed 2026-03-21
- [x] Phase 5: Polish & Performance (3/3 plans) — completed 2026-03-21

</details>

### ✅ v1.1 Completion (SHIPPED 2026-03-21)

- [x] **Phase 6: AI Generation & Editor Polish** - Complete AI website generation pipeline with WebSocket progress, confidence scoring, preview/regeneration, AI writing assist, and block configuration panel (completed 2026-03-21)
- [x] **Phase 7: Credit System** - User credit balance tracking with atomic Redis-locked deductions and WeChat Pay top-up (completed 2026-03-21)
- [x] **Phase 8: PDF Export** - Two-phase PDF export with free preview and paid full export via credit deduction (completed 2026-03-21)
- [x] **Phase 9: Platform Hosting** - Subdomain deployment and publish/unpublish management
- [x] **Phase 10: Payments & VIP** - WeChat Pay callback handling, VIP subscription, and template purchase (completed 2026-03-21)

---

## Phase Details

### Phase 6: AI Generation & Editor Polish

**Goal**: Users can generate website content from an image with AI and polish blocks with a configuration panel

**Depends on**: Phase 5 (v1.0 MVP)

**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, WRT-01, WRT-02, WRT-03, EDI-01, EDI-02

**Success Criteria** (what must be TRUE):
  1. User can upload one main image and enter a one-sentence description to trigger AI generation
  2. AI pipeline runs asynchronously via RabbitMQ with WebSocket progress updates visible to user
  3. Each generated block displays a confidence score; blocks with score below 0.7 are highlighted with amber ring
  4. User sees preview of generated blocks and can accept all into editor or cancel
  5. User can regenerate individual blocks or accept all blocks into the editor
  6. Each text block shows sparkle button on hover
  7. Clicking sparkle button opens Replace/Append modal with existing block content as context
  8. Right sidebar shows block configuration panel when a block is selected
  9. Block settings (alignment, colors, visibility) persist to backend and reload correctly

**Plans**: 2 plans
- [x] 06-01-PLAN.md - AI Generation Pipeline (GEN-01~05, WRT-01~03)
- [x] 06-02-PLAN.md - Editor Polish & Block Config (EDI-01~02)

### Phase 7: Credit System

**Goal**: Users have credit balance tracked in database with atomic deduction for paid operations

**Depends on**: Phase 6

**Requirements**: CRD-01, CRD-02, CRD-03

**Success Criteria** (what must be TRUE):
  1. User account displays credit_balance field visible in database and frontend UI
  2. Credit deduction for paid operations is atomic; concurrent requests do not cause race conditions (Redis distributed lock verified)
  3. User can purchase credits via WeChat Pay top-up and balance updates immediately after payment

**Plans**: 3 plans
- [x] 07-01-PLAN.md - Credit Balance Display (CRD-01)
- [x] 07-02-PLAN.md - Atomic Credit Deduction (CRD-02)
- [x] 07-03-PLAN.md - WeChat Pay Top-up (CRD-03)

### Phase 8: PDF Export

**Goal**: Users can preview PDF free and export full PDF with credit deduction

**Depends on**: Phase 7

**Requirements**: PDF-01, PDF-02, PDF-03

**Success Criteria** (what must be TRUE):
  1. User can preview PDF free with low-resolution output via link that expires after 1 hour
  2. Full PDF export deducts 0.3 credits atomically from user balance
  3. Generated PDF is downloadable via link that expires 24 hours after generation

**Plans**: 2 plans
- [x] 08-01-PLAN.md - PDF Preview (PDF-01)
- [x] 08-02-PLAN.md - PDF Export with Credit (PDF-02, PDF-03)

### Phase 9: Platform Hosting

**Goal**: Users can publish their site to a subdomain and manage publication status

**Depends on**: Phase 6 (editor complete)

**Requirements**: HST-01, HST-02, HST-03, HST-04

**Success Criteria** (what must be TRUE):
  1. User clicks Publish and static site is deployed to their subdomain
  2. Published site is accessible at username.vibe.com in production or localhost:port in dev
  3. User can unpublish site, removing it from public access
  4. Published site is pre-rendered static HTML with no server-side rendering required

**Plans**: 1 plan
- [x] 09-01-PLAN.md - Subdomain Hosting Infrastructure (HST-01, HST-02, HST-03, HST-04)

### Phase 10: Payments & VIP

**Goal**: WeChat Pay integration completes with VIP subscription and template purchase

**Depends on**: Phase 7

**Requirements**: PAY-01, PAY-02, PAY-03

**Success Criteria** (what must be TRUE):
  1. WeChat Pay callback successfully handles payment notification and credits user account
  2. VIP subscription at 10 RMB/month grants user access to all templates
  3. Template purchases give user lifetime one-time access to that specific template

**Plans**: 1 plan
- [x] 10-01-PLAN.md - Payment Fulfillment (PAY-01, PAY-02, PAY-03)

### Phase 11: Analytics

**Goal**: Users can view visitor counts and page views for their published sites

**Depends on**: Phase 9 (platform hosting)

**Requirements**: ANAL-01, ANAL-02, ANAL-03

**Success Criteria** (what must be TRUE):
  1. User can view visitor counts for their published site
  2. User can view page views per published site
  3. Analytics data displays in user dashboard

**Plans**: 2 plans
- [x] 11-01-PLAN.md — Analytics Data Layer (ANAL-01, ANAL-02)
- [ ] 11-02-PLAN.md — Analytics Service & Dashboard (ANAL-01, ANAL-02, ANAL-03)

---

## v1.1 Progress

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 6. AI Generation & Editor Polish | 2/2 | Complete    | 2026-03-21 |
| 7. Credit System | 3/3 | Complete    | 2026-03-21 |
| 8. PDF Export | 2/2 | Complete    | 2026-03-21 |
| 9. Platform Hosting | 1/1 | Complete    | 2026-03-21 |
| 10. Payments & VIP | 1/1 | Complete    | 2026-03-21 |

## v1.2 Progress

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 11. Analytics | 1/2 | In Progress|  |

---

*Last updated: 2026-03-22 after v1.2 milestone setup*
