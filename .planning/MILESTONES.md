# Milestones

## v1.8 Editor Fixes & Drafts (Shipped: 2026-03-23)

**Phases completed:** 1 phase, 3 plans
**Git tag:** v1.8

**Key accomplishments:**

1. **Draft status infrastructure** — STATUS_DRAFT/PUBLISHED constants, createBlog() sets draft by default, GET /blog/drafts endpoint
2. **Editor loads saved blocks** — Fixed EditorPage to load blog's saved blocks from backend when editing existing blog
3. **Done button awaits save** — handleDone now async and awaits saveBlocksToBackend before navigation
4. **My Drafts section** — Added draft display on Profile page with resume editing navigation

---

## v1.6 UI Polish (Shipped: 2026-03-22)

**Phases completed:** 2 phases, 2 plans, 2 tasks

**Key accomplishments:**

- Editor UX improved with selection-state drag handles, smooth ease-out-quart transitions, refined white theme config panel, and analytics charts using blue-black palette

---

## v1.5 Enhanced Analytics (Shipped: 2026-03-22)

**Phases completed:** 4 phases, 5 plans, 0 tasks

**Key accomplishments:**

- Executed:
- 1. [Rule 3 - Blocking] Fixed pre-existing RefererParserTest JUnit 4/5 compatibility
- ChartCard.tsx

---

## v1.4 Email & Notifications (Shipped: 2026-03-22)

**Phases completed:** 6 phases, 11 plans, 34 tasks

**Key accomplishments:**

- Complete AI generation pipeline end-to-end: parse MiniMax JSON with confidence scoring, persist blocks via STOMP WebSocket progress, preview/reject/regenerate flow
- Block configuration panel with alignment, colors, and visibility settings that persist to backend
- User credit balance visible in header with backend API integration and database table
- WeChat Pay credit top-up flow: POST /credit/topup creates order with QR code, processCreditTopupCallback adds credits on payment
- Credit deduction atomicity, ownership validation, and scheduled cleanup for PDF export
- PdfJob entity with Redis-backed 1h expiring preview URLs and ownership validation
- Phase:
- WeChat Pay callback triggers FulfillmentService after payment, routing to VIP activation, credits top-up, or template purchase based on order type

---

## v1.3 SEO Tools (Shipped: 2026-03-22)

**Phases completed:** 6 phases, 11 plans, 34 tasks

**Key accomplishments:**

- Complete AI generation pipeline end-to-end: parse MiniMax JSON with confidence scoring, persist blocks via STOMP WebSocket progress, preview/reject/regenerate flow
- Block configuration panel with alignment, colors, and visibility settings that persist to backend
- User credit balance visible in header with backend API integration and database table
- WeChat Pay credit top-up flow: POST /credit/topup creates order with QR code, processCreditTopupCallback adds credits on payment
- Credit deduction atomicity, ownership validation, and scheduled cleanup for PDF export
- PdfJob entity with Redis-backed 1h expiring preview URLs and ownership validation
- Phase:
- WeChat Pay callback triggers FulfillmentService after payment, routing to VIP activation, credits top-up, or template purchase based on order type

---

## v1.2 Analytics (Shipped: 2026-03-22)

**Phases completed:** 6 phases, 11 plans, 34 tasks

**Key accomplishments:**

- Complete AI generation pipeline end-to-end: parse MiniMax JSON with confidence scoring, persist blocks via STOMP WebSocket progress, preview/reject/regenerate flow
- Block configuration panel with alignment, colors, and visibility settings that persist to backend
- User credit balance visible in header with backend API integration and database table
- WeChat Pay credit top-up flow: POST /credit/topup creates order with QR code, processCreditTopupCallback adds credits on payment
- Credit deduction atomicity, ownership validation, and scheduled cleanup for PDF export
- PdfJob entity with Redis-backed 1h expiring preview URLs and ownership validation
- Phase:
- WeChat Pay callback triggers FulfillmentService after payment, routing to VIP activation, credits top-up, or template purchase based on order type

---

## 1.2 Analytics (Shipped: 2026-03-22)

**Phases completed:** 6 phases, 11 plans, 34 tasks

**Key accomplishments:**

- Complete AI generation pipeline end-to-end: parse MiniMax JSON with confidence scoring, persist blocks via STOMP WebSocket progress, preview/reject/regenerate flow
- Block configuration panel with alignment, colors, and visibility settings that persist to backend
- User credit balance visible in header with backend API integration and database table
- WeChat Pay credit top-up flow: POST /credit/topup creates order with QR code, processCreditTopupCallback adds credits on payment
- Credit deduction atomicity, ownership validation, and scheduled cleanup for PDF export
- PdfJob entity with Redis-backed 1h expiring preview URLs and ownership validation
- Phase:
- WeChat Pay callback triggers FulfillmentService after payment, routing to VIP activation, credits top-up, or template purchase based on order type

---

## v1.0 MVP (Shipped: 2026-03-21)

**Phases completed:** 5 phases, 13 plans executed via GSD workflow
**Git tag:** v1.0

**Key accomplishments:**

1. **Block Editor Core** — Drag-and-drop editor with dnd-kit, 5 typed block components (Text, Image, Social Links, Contact, Divider), Zustand store with undo/redo via temporal middleware, click-to-edit inline editing, block library palette, auto-save to backend (500ms debounce)
2. **AI Generation Pipeline** — RGB color extraction with ColorThief, Spring AI OpenAI-compatible client for MiniMax, async AI generation via RabbitMQ with WebSocket progress updates, AI Write Assist with inline text generation and low-confidence block highlighting
3. **Publishing & PDF Export** — Static HTML generation via Thymeleaf, async HTML-to-PDF export with Flying Saucer, RabbitMQ job queue, user credit balance management
4. **VIP & Payments** — VIP subscription and credits purchase PaymentController endpoints, VipService, TemplatePurchaseService, user balance tracking
5. **Performance Infrastructure** — HikariCP tuned for 50 connections, Redis caching with 24h TTL on templates and blogs, JMeter load testing infrastructure for 500 QPS verification, RabbitMQ async job processing verified

---

## v1.0 MVP (Shipped: 2026-03-21)

**Phases completed:** 5 phases, 13 plans
**Git tag:** v1.0

**Key accomplishments:**

- Established foundational block editor infrastructure with 5 typed block components, Zustand store with undo/redo via temporal middleware, and BlockRenderer switch mapping BlockType to React components.
- Interactive editor canvas with dnd-kit drag-and-drop reordering, click-to-edit text/images, and block library palette.
- Editor toolbar with undo/redo, block configuration panel, auto-save hook, and main Editor orchestrator combining all components.
- Client-side RGB color extraction with ColorThief + Spring AI OpenAI-compatible client for MiniMax text generation with validation gates.
- Async AI generation via RabbitMQ with WebSocket progress updates and GenerationModal UI.
- AI Write Assist with inline text generation, Replace/Append modes, and low-confidence block highlighting.
- Static HTML generation from blocks JSON using Thymeleaf TemplateEngine for site publishing.
- Async HTML-to-PDF export with Flying Saucer, RabbitMQ job queue, and user credit balance management.
- VIP subscription and credits purchase PaymentController endpoints with frontend VipBanner and BalanceDisplay components.
- HikariCP tuned for 50 connections, TemplateService with Redis caching (24h TTL), TemplateController for template listing endpoints.
- JMeter load testing infrastructure for verifying 500 QPS performance on blog-share and template-listing endpoints.
- RabbitMQ async job processing verified for PDF and AI generation with documented performance architecture.

---
