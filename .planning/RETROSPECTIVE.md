# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-21
**Phases:** 5 | **Plans:** 13 | **Sessions:** 2

### What Was Built
- Block editor with drag-and-drop (dnd-kit), 5 typed block components, Zustand temporal undo/redo, click-to-edit inline editing
- AI pipeline: ColorThief RGB extraction + MiniMax text generation via Spring AI, async generation via RabbitMQ + WebSocket progress, AI Write Assist with Replace/Append
- Publishing system: static HTML generation via Thymeleaf, async HTML-to-PDF via Flying Saucer, user credit balance management
- VIP/payments: VipService, TemplatePurchaseService, PaymentController endpoints, VipBanner + BalanceDisplay frontend components
- Performance infrastructure: Redis 24h TTL caching, HikariCP 50-connection pool, RabbitMQ async consumers, JMeter test plans for 500 QPS

### What Worked
- GSD wave-based execution for independent plans (Phase 2 had 3 plans executed as 3 waves in parallel)
- Pre-existing Phase 1 templates allowed immediate Phase 2 start without planning overhead
- Phase 5 research found PERF-03 and PERF-05 already implemented, reducing scope appropriately
- Spring AI OpenAI-compatible client worked cleanly for MiniMax integration

### What Was Inefficient
- Phase numbering inconsistency: Phase 1 had no GSD plan (treated as "existing"), creating 1-indexing confusion
- Duplicate entries in MILESTONES.md from multiple complete-milestone invocations
- Requirements traceability table not kept in sync during execution (TPL-01~05 remained "Pending" despite Phase 1 being pre-existing)
- Context overflow at end of extended session required compaction and resume

### Patterns Established
- Block component model: typed blocks (Text/Image/SocialLinks/Contact/Divider) with consistent interfaces
- AI pipeline pattern: sequential stages with validation gates (Image Analysis → Style Extraction → Content Generation → Block Assembly)
- Async job pattern: RabbitMQ producers → queue → consumers with WebSocket progress notifications
- Performance verification: JMeter test plans + Redis caching + HikariCP tuning as standard stack

### Key Lessons
1. Pre-existing capabilities should be marked as "existing" in ROADMAP.md Phase 0, not as Phase 1 with no plan — avoids confusion in traceability
2. Requirements traceability table needs updating after each phase execution, not just at milestone end
3. GSD tools (milestone complete) create archives but don't update parent files — manual follow-up steps needed for ROADMAP reorganization and PROJECT evolution

### Cost Observations
- Model mix: Unknown (session used mixed model family)
- Sessions: 2 (initial + resume after context compaction)
- Notable: v1.0 was primarily completing an already-in-progress project — most "building" was actually integration and verification of existing stubs

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 2 | 5 | First GSD-workflowed milestone; brownfield integration |

### Cumulative Quality

This is the first milestone — no trends yet.

### Top Lessons (Verified Across Milestones)

1. (First milestone — no cross-validation yet)
