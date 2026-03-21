# Project Research Summary

**Project:** Vibe Onepage - Drag-and-Drop Single-Page Website Builder SaaS
**Domain:** AI-powered website builder with block editor, PDF export, WeChat Pay credits, and subdomain hosting
**Researched:** 2026-03-21
**Confidence:** MEDIUM

## Executive Summary

Vibe Onepage v1.1 is a drag-and-drop single-page website builder that uses AI to generate personalized sites from images. The existing codebase has structural foundations for all v1.1 features but requires completion of stub implementations and integration work. The core value proposition - "upload a photo, get a website in minutes" - requires finishing the AI generation pipeline (image analysis -> MiniMax -> block assembly), polishing the per-block AI writing assist, completing PDF export with credit deduction, and enabling subdomain hosting.

The recommended approach is to complete the AI pipeline first (since it is the core differentiator), then build the credit system (required for all paid features), then layer PDF preview and hosting on top. Key risks include: AI generation producing unusable output without validation gates, credit race conditions causing free PDFs, WeChat Pay v2 SDK used in a v3 API world, and no actual subdomain routing infrastructure.

## Key Findings

### Recommended Stack

**Summary from STACK.md:** The v1.0 stack is complete and validated. v1.1 requires minimal additions - primarily WebSocket for real-time AI progress, a form library for the configuration panel, and a PDF preview component.

**Core technologies:**
- **Spring Boot 3.2.0 + Java 17** - Backend framework (existing, stable)
- **React 18.2.0 + Vite 5.0.8 + TailwindCSS 3.3.6** - Frontend framework (existing, validated)
- **@stomp/stompjs 7.3.0 + sockjs-client 1.6.2** - WebSocket for AI progress (NEW: enables real-time generation status)
- **react-hook-form 7.71.2** - Configuration panel forms (NEW: lightweight form state for block settings)
- **react-pdf 3.4.1** - PDF preview before charge (NEW: in-browser preview capability)
- **Spring AI 1.0.0-M6 + MiniMax** - AI generation (existing, needs completion of parseAndAssemble stub)
- **RabbitMQ + Redis** - Async jobs and caching (existing, well-configured)
- **Flying Saucer 9.3.1** - PDF generation (existing, working but limited CSS support)

**What NOT to add:** socket.io (use STOMP instead), Redux/MobX (Zustand sufficient), react-query (not needed), Builder.io/GrapesJS (overkill), LangChain4j (Spring AI sufficient), iText 7 (AGPL license issue).

### Expected Features

**Summary from FEATURES.md:** The v1.1 milestone focuses on completing the AI generation pipeline, polishing AI writing assist, finalizing the block editor, completing PDF export, implementing WeChat Pay credit deduction, and enabling platform hosting.

**Must have (table stakes):**
- **Complete AI Generation Pipeline** - Image upload -> MiniMax -> Block assembly -> Editor display; current stub returns empty blocks with 0.0 confidence
- **AI Writing Assist Polish** - Replace/Append modes, confidence highlighting (amber ring when < 0.7), sparkle button visibility on hover
- **Block Configuration Panel** - Right sidebar for block-level settings (alignment, colors, visibility)
- **PDF Preview + Export** - Preview free, export charges 0.3 credits, 24h download links, quality validation before charging
- **WeChat Pay Credit Flow** - Order creation, callback handling, credit deduction (atomic operation)
- **Publish/Unpublish** - Static HTML generation, status management, subdomain hosting

**Should have (competitive differentiators):**
- **AI Generation from Image** - "Upload a photo, get a website" is the core magical experience
- **Per-Block AI Write Assist** - Context-aware inline AI without disrupting workflow
- **Async Generation with Progress** - Non-blocking UI during 5-30s AI calls via WebSocket
- **Confidence-Based Highlighting** - Visual indicator of AI certainty (amber ring)
- **One-Click Regeneration** - Iterate on AI output quickly

**Defer (v2+):**
- Real-Time Collaborative Editing - Extreme complexity; single-user only for v1
- Full Code Export - Removes SaaS lock-in; hosting included instead
- Custom Domain for Free Users - Infrastructure cost; reserve for VIP
- Block Animations - Entrance animations, hover effects
- More Templates - Expand based on usage data after launch

### Architecture Approach

**Summary from ARCHITECTURE.md:** The existing 3-layer Spring Boot architecture (Controller-Service-Repository) with RabbitMQ async consumers, Redis caching, JWT auth, and WebSocket via SimpMessagingTemplate is sound. Key integration challenges are completing the AI generation pipeline and credit system.

**Major components:**
1. **AIGenerationController + AIGenerationConsumer** - Receives generation requests, queues async job, orchestrates pipeline via RabbitMQ, notifies frontend via WebSocket
2. **BlockAssemblyService** - Parses AI JSON response into structured block data (NOT raw HTML - preserves editability)
3. **CreditDeductionService + WalletService** - Atomic credit operations with idempotency keys and distributed locks (Redis)
4. **PdfPreviewController + PdfPreviewService** - Two-phase PDF: free low-res preview, then full export with credit deduction
5. **SubdomainFilter + SiteController** - Wildcard DNS routing to serve published blogs via subdomains

**Key patterns:**
- Always use async RabbitMQ-based pipeline for AI calls (5-30s latency, 500 QPS requirement)
- AI outputs structured block JSON, NOT rendered HTML (preserves user editability)
- Credit deduction uses idempotency keys + distributed locks (prevents race conditions)
- Two-phase PDF: preview before charge with automatic refund on failure

### Critical Pitfalls

**Top 5 from PITFALLS.md:**

1. **AI Generation Produces Unusable Output** - AIGenerationService.parseAndAssemble() is a stub returning empty blocks. Without validation gates, users get garbage output. Prevention: confidence scoring, preview/approval step before commit.

2. **PDF Credits Deducted After Generation - No Rollback** - PdfJobConsumer deducts credits AFTER PDF is generated and stored. If deduction fails, user gets free PDF. Prevention: deduct BEFORE generation, or use transaction spanning both.

3. **WeChat Pay v2 SDK in v3 API World** - wxpay-sdk 0.0.3 uses v2 protocol (MD5 signatures), but WeChat Pay API v3 requires RSA certificates and HMAC-SHA256. Payments will silently fail in production. Prevention: migrate to v3 native SDK.

4. **Race Condition in Credit Balance Check vs Deduction** - Two concurrent PDF requests both pass balance check before either deduction. User gets 2 PDFs for 0.6 credits when they only had 0.5. Prevention: Redis distributed lock per user during check-and-deduct.

5. **Static Site Hosting Has No Actual Subdomain Routing** - BlogService.publish() saves HTML to DB but no DNS, Nginx, or CDN configuration exists. Prevention: implement SubdomainFilter + wildcard DNS + OSS storage.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Block Schema Contract + AI Generation Pipeline
**Rationale:** AI generation is the core differentiator and depends on agreeing on block JSON schema first.
**Delivers:** Block schema contract, AI generation pipeline with WebSocket progress, block assembly service
**Addresses:** AI Website Generation completion, AI Writing Assist polish, Block Editor polish
**Avoids:** AI generates HTML (wrong), Synchronous AI calls (UI freeze), MiniMax API latency blocking UI

### Phase 2: Credit System Infrastructure
**Rationale:** All paid features (PDF export, template purchases, VIP) depend on atomic credit operations. Build this before payments.
**Delivers:** User credit_balance field, atomic WalletService, CreditDeductionService with idempotency + distributed lock, Redis caching
**Addresses:** WeChat Pay Credit Deduction flow
**Avoids:** Race condition in credit balance, double-deduction from retries

### Phase 3: PDF Preview-Before-Charge
**Rationale:** Depends on credit system; implements two-phase pattern to prevent broken PDFs being charged.
**Delivers:** PdfPreviewService (low-res preview), preview endpoint with 1h expiring URL, full export with credit deduction, auto-refund on failure
**Addresses:** PDF Export completion
**Avoids:** Credits deducted after generation (no rollback), PDF quality no validation, PDF 24h expiration cleanup never runs

### Phase 4: Subdomain Routing & Publishing
**Rationale:** Final publish step; depends on complete blogs (AI + editor done).
**Delivers:** SubdomainFilter, SiteController, BlogService.publish() with OSS upload, wildcard DNS configuration
**Addresses:** Subdomain Hosting completion
**Avoids:** No actual subdomain routing, published blogs not accessible via subdomain

### Phase 5: VIP & Payments Completion
**Rationale:** WeChat Pay v2->v3 migration and final integration.
**Delivers:** WeChat Pay v3 API integration, certificate authentication, proper signature validation
**Avoids:** WeChat Pay signature validation bypass when not configured, v2 SDK in v3 world

### Phase Ordering Rationale

- **Block schema first** because both AI pipeline (backend) and editor (frontend) must agree on contract
- **AI pipeline second** because it is the core differentiator and provides user value early for testing
- **Credit system third** because all paid features depend on atomic operations; build infrastructure before building on top
- **PDF preview fourth** because it uses credit system and completes the export feature
- **Subdomain hosting fifth** because it depends on complete blogs from AI + editor
- **VIP/Payments last** because WeChat Pay v3 migration is a known complex integration

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (AI Pipeline):** MiniMax API response format needs verification; confidence scoring threshold needs user testing
- **Phase 2 (Credit System):** Redis lock implementation details; idempotency key TTL decision
- **Phase 5 (VIP/Payments):** WeChat Pay v3 API migration path; certificate management in production

Phases with standard patterns (skip research-phase):
- **Phase 3 (PDF Preview):** Flying Saucer + RabbitMQ consumer is well-documented pattern
- **Phase 4 (Subdomain Routing):** Wildcard DNS + Spring Filter is established pattern

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | v1.0 stack validated; v1.1 additions from official documentation |
| Features | MEDIUM | Codebase analysis + training data patterns; WebSearch unavailable |
| Architecture | MEDIUM | Well-established patterns from training data; WebSearch unavailable |
| Pitfalls | MEDIUM | Code analysis verified; some external sources unverifiable due to WebSearch errors |

**Overall confidence:** MEDIUM

### Gaps to Address

- **MiniMax API exact response format:** parseAndAssemble() needs to handle actual MiniMax JSON; verify with API docs
- **WeChat Pay v3 migration path:** Current wxpay-sdk v2 will fail; need concrete migration plan with code examples
- **Confidence threshold validation:** Amber ring at < 0.7 needs user testing to verify if this is the right threshold
- **PDF quality validation:** Flying Saucer CSS limitations need testing with real blog content

## Sources

### Primary (HIGH confidence)
- Spring Framework WebSocket documentation (docs.spring.io) - STOMP patterns, WebSocketMessageBrokerConfigurer
- @stomp/stompjs npm registry (verified 7.3.0) - TypeScript types, compatibility
- react-hook-form npm registry (verified 7.71.2) - Form validation patterns
- react-pdf npm registry (verified 3.4.1) - PDF worker configuration

### Secondary (MEDIUM confidence)
- Existing codebase analysis (AIService.java, AIGenerationService.java, PdfJobConsumer.java, WeChatPayService.java) - Stub implementations identified
- WeChat Pay API v3 documentation via WebFetch - Signature validation patterns
- Spring AI documentation - Streaming, retry patterns
- Block editor architecture patterns (grapesjs.com, contentful.com) - CMS patterns

### Tertiary (LOW confidence)
- Credit system patterns from Stripe billing docs - Wallet patterns need verification
- Subdomain routing from Netlify docs - Specific implementation needs validation
- LangChain pipeline patterns - Not directly applicable (Spring AI sufficient)

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
