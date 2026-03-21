# Milestones

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
