# Vibe Onepage

## What This Is

A drag-and-drop single-page website builder SaaS. Users select a template (Blog, Resume, Personal Intro, etc.), optionally use AI to generate a personalized site from an image + text description, then edit and publish to a hosted subdomain. Some templates are free, others paid per-use or via VIP subscription.

**Target users:** Non-technical individuals who want a personal website quickly — job seekers, freelancers, small business owners, bloggers.

## Core Value

Users can have a beautiful, personalized website live in minutes — not hours — by combining AI-assisted generation with an intuitive block-level editor.

## Current Milestone: v1.1

**Goal:** Complete the core user value loop — AI generation, editor polish, and payments/hosting integration to make the product shippable.

**Target features:**
- Complete AI Website Generation pipeline (image upload → AI style extraction → full page generation)
- AI Writing Assist polish (sparkle button per text block, Replace/Append modes, confidence highlighting)
- Block Editor polish (configuration panel, block settings persistence)
- PDF Export completion (preview before charge, 24h expiring download links)
- VIP & Payments completion (WeChat Pay flow, credit deduction)
- Platform Hosting completion (subdomain DNS routing, publish/unpublish)

## Requirements

### Validated

<!-- v1.0 shipped — these requirements are complete and tested -->

- ✓ User registration and login with JWT authentication — existing (pre-v1.0)
- ✓ Blog creation with unique shareable link — existing (pre-v1.0)
- ✓ WeChat Pay integration with order state machine (PENDING→PAYING→PAID→REFUNDING→REFUNDED) — existing (pre-v1.0)
- ✓ 10 existing template directories — existing (pre-v1.0)
- ✓ Drag-and-drop template gallery with animated cards — v1.0 (Phase 1)
- ✓ Image upload handling — existing (pre-v1.0)
- ✓ Block-level drag-and-drop editor with 5 block types (Text, Image, Social Links, Contact, Divider) — v1.0 (Phase 2)
- ✓ Click-to-edit inline text and image editing — v1.0 (Phase 2)
- ✓ Undo/redo via Zustand temporal middleware — v1.0 (Phase 2)
- ✓ Auto-save to backend (500ms debounce) with localStorage backup — v1.0 (Phase 2)
- ✓ Static HTML site publishing via Thymeleaf — v1.0 (Phase 4)
- ✓ Unique shareable link per published site — v1.0 (Phase 4)
- ✓ Async HTML-to-PDF export with Flying Saucer — v1.0 (Phase 4)
- ✓ User credit balance management — v1.0 (Phase 4)
- ✓ VIP subscription and template purchase via PaymentController — v1.0 (Phase 4)
- ✓ Redis caching for template listing (24h TTL) and blog pages — v1.0 (Phase 5)
- ✓ HikariCP connection pool tuned for 500 QPS (50 max connections) — v1.0 (Phase 5)
- ✓ RabbitMQ async job processing for PDF and AI generation — v1.0 (Phase 5)
- ✓ RGB color extraction + MiniMax AI text generation via Spring AI — v1.0 (Phase 3)
- ✓ AI Write Assist with Replace/Append modes and low-confidence highlighting — v1.0 (Phase 3)

### Active

<!-- Next milestone priorities -->

- [ ] **AI Website Generation** — Full pipeline: user uploads image → AI extracts style → generates complete editable page via MiniMax API
- [ ] **AI Writing Assist** — Inline sparkle button on each text block; Replace/Append modes; low-confidence highlighting (Partially done in v1.0 Phase 3)
- [ ] **Block Editor Polish** — Block configuration panel (right sidebar), block-level settings persistence
- [ ] **PDF Export Full** — Preview before charge, 24h expiring download links
- [ ] **VIP & Payments Full** — WeChat Pay integration completion, credit deduction flow
- [ ] **Platform Hosting** — Subdomain DNS routing, publish/unpublish flow

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

**v1.0 shipped:** 2026-03-21. Full-stack SaaS with React + Spring Boot, AI generation, WeChat Pay, PDF export, Redis caching, RabbitMQ async processing.

**Tech stack:**
- Frontend: React 18 + Vite + TailwindCSS + TypeScript
- Backend: Spring Boot 3 + MyBatis-Plus + MySQL 8
- Cache/Queue: Redis + RabbitMQ
- Auth: JWT (7-day access, 30-day refresh)
- Payments: WeChat Pay
- AI: MiniMax via Spring AI OpenAI-compatible client

**Deployment:**
- Development: localhost ports (frontend 5173, backend 8080)
- Production: Docker containers on Tencent Cloud via BT Panel

**AI Integration:**
- Provider: MiniMax API
- Use cases: RGB color extraction, text generation, block content generation
- Workflow: ColorThief client-side extraction → Spring AI generation → block assembly

## Constraints

- **Tech stack**: Spring Boot + React (existing — do not change)
- **AI provider**: MiniMax (specified by user)
- **Domain**: No domain yet; use localhost ports in dev, swap domain later
- **Budget**: Low-cost operation; keep infrastructure minimal
- **Timeline**: Hot endpoints must handle 500 QPS (verified with JMeter)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Block-level drag-and-drop | Simpler UX than free-layout; faster to implement | ✓ Validated — editor shipped in v1.0 |
| MiniMax for AI | User-specified provider | ✓ Working — color extraction + text gen |
| dnd-kit for drag-and-drop | Standard React DnD library, well-supported | ✓ Working — sortable blocks |
| Zustand with temporal middleware | Lightweight state + built-in undo/redo | ✓ Working — undo/redo confirmed |
| Flying Saucer for PDF | Java HTML-to-PDF, good CSS support | ✓ Shipped — async PDF generation |
| Redis caching 24h TTL | Cache template listing and blog pages | ✓ Validated — reduces DB load |
| HikariCP 50 connections | Appropriate for MySQL SSD at 500 QPS | ✓ Configured — ready for load test |
| RabbitMQ async processing | PDF/AI are slow (5-60s); must not block | ✓ Verified — consumers active |
| JMeter for load testing | Industry standard, scripted testing | ✓ Test plans created |

## Evolution

*Last updated: 2026-03-21 after v1.1 milestone started*

