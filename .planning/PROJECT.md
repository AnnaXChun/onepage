# Vibe Onepage

## What This Is

A drag-and-drop single-page website builder SaaS. Users select a template (Blog, Resume, Personal Intro, etc.), optionally use AI to generate a personalized site from an image + text description, then edit and publish to a hosted subdomain. Some templates are free, others paid per-use or via VIP subscription.

**Target users:** Non-technical individuals who want a personal website quickly — job seekers, freelancers, small business owners, bloggers.

## Core Value

Users can have a beautiful, personalized website live in minutes — not hours — by combining AI-assisted generation with an intuitive block-level editor.

## Requirements

### Validated

<!-- Existing capabilities confirmed working in codebase -->

- ✓ User registration and login with JWT authentication — existing
- ✓ Blog creation with unique shareable link — existing
- ✓ WeChat Pay integration with order state machine (PENDING→PAYING→PAID→REFUNDING→REFUNDED) — existing
- ✓ Redis caching for blog pages (24h TTL) and payment idempotency locks — existing
- ✓ 10 existing template directories (gallery-display, creative-card, minimal-simple, paper-fold, retro-wave, glass-morphism, ultra-minimal, neon-pulse, vintage-style, zen-minimal) — existing
- ✓ Drag-and-drop template gallery with animated cards — existing
- ✓ Image upload handling — existing

### Active

<!-- Building toward these in current milestone -->

- [ ] **Template System** — 10 fixed templates across Blog, Resume, Personal Intro categories; each template has defined block components
- [ ] **Block Editor** — Block-level drag-and-drop editor; users can add, remove, reorder, and configure text/image/social/contact blocks
- [ ] **AI Website Generation** — User uploads one main image + enters one-sentence description; AI extracts RGB style/mood from image and generates page content via MiniMax API; result is a complete editable page
- [ ] **AI Writing Assist** — Each text block has an inline "AI Write" button; clicking it generates content based on existing text in the block using SpringAI + MiniMax
- [ ] **LangChain Workflow** — Orchestrate the AI generation pipeline: image analysis → style extraction → content generation → block mapping
- [ ] **Click-to-Edit** — Users click any text/image element directly on the page to edit content in-place
- [ ] **Platform Hosting** — Publish site to `username.vibe.com` subdomain (development: localhost port first, swap domain later)
- [ ] **PDF Export** — Generate static PDF of website; paid feature (~0.1-0.5 RMB per generation)
- [ ] **VIP Subscription** — 10 RMB/month; VIP users access all templates; non-VIP users pay per template (1-10 RMB depending on template)
- [ ] **High Concurrency** — Hot endpoints (template listing, blog view) handle 500 QPS; Redis caching, database indexing, connection pooling

### Out of Scope

<!-- Explicitly excluded from v1 -->

- Custom domain binding — deferred to future
- Custom template creation by users — deferred
- User-generated block components — deferred
- Email/password-free signup (OAuth only) — not planned
- Multi-page websites — single page only
- Mobile app — web-only for now
- Real-time collaborative editing — single-user editing only

## Context

**Brownfield project** — Existing Spring Boot + React codebase with working auth, blog sharing, WeChat Pay, and Redis. The codebase is functional but many features are incomplete stubs. The AI and drag-and-drop editor components need to be built from scratch.

**Existing infrastructure:**
- Frontend: React 18 + Vite + TailwindCSS + TypeScript
- Backend: Spring Boot 3 + MyBatis-Plus + MySQL 8
- Cache/Queue: Redis + RabbitMQ
- Auth: JWT (7-day access, 30-day refresh)
- Payments: WeChat Pay (already integrated)

**AI Integration:**
- Provider: MiniMax API (via SpringAI)
- Use cases: Image style extraction, text generation, block content generation
- Workflow: LangChain for chaining image analysis → style → content → layout

**Deployment:**
- Development: localhost ports (frontend 5173, backend 8080)
- Production: Docker containers on Tencent Cloud via BT Panel; MySQL/Redis/RabbitMQ in Docker

## Constraints

- **Tech stack**: Spring Boot + React (existing — do not change)
- **AI provider**: MiniMax (specified by user)
- **Domain**: No domain yet; use localhost ports in dev, swap domain later
- **Budget**: Low-cost operation; keep infrastructure minimal
- **Timeline**: Hot endpoints must handle 500 QPS (verified with JMeter)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Block-level drag-and-drop | Simpler UX than free-layout; faster to implement; sufficient for target users | — Pending |
| MiniMax for AI | User-specified provider | — Pending |
| LangChain for workflow orchestration | Standardizes AI pipeline: image→style→content→layout | — Pending |
| Platform subdomain hosting | Avoids custom domain complexity in v1 | — Pending |
| 10 fixed templates initially | Fastest path to MVP; user can expand later | — Pending |
| VIP + per-use pricing | Balances accessibility with revenue; low price point | — Pending |
| 500 QPS hot endpoints | DAU 500, burst to 500 QPS on cacheable reads | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-21 after initialization*
