# Project Research Summary

**Project:** Vibe Onepage - AI-Powered Single-Page Website Builder
**Domain:** Drag-and-Drop Website Builder SaaS with AI Generation
**Researched:** 2026-03-21
**Confidence:** MEDIUM (multiple verified sources for stack/features; lower confidence on pitfalls due to web search unavailability)

## Executive Summary

Vibe Onepage is a drag-and-drop website builder that generates personalized single-page websites from user-uploaded images using AI. The product targets non-technical users who want a personal blog, resume, or portfolio site without design or coding skills. Experts build这类工具 using modular block-based editors (not free-form canvas), AI pipelines that chain image analysis to style extraction to content generation, and template systems that separate structure from content.

The recommended approach prioritizes: (1) dnd-kit for React drag-and-drop (modern, accessible, performant), (2) Spring AI with sequential prompt chains for the AI pipeline (lighter than LangChain4j for linear workflows), and (3) OpenPDF for server-side PDF generation. The existing stack (Spring Boot + React + MySQL + Redis + RabbitMQ) is appropriate and should not be changed. The 500 QPS target is achievable with Redis caching, HikariCP connection pooling, and async job processing via RabbitMQ.

Key risks include AI output validation failures (bad content propagates unchecked), drag-drop state desync with the database, and MiniMax API latency blocking the UI. Mitigate by implementing async job patterns, validation gates between AI pipeline stages, and debounced auto-save with localStorage backup.

## Key Findings

### Recommended Stack

**From STACK.md**

The existing brownfield Spring Boot + React stack is correct. Key additions needed:

- **dnd-kit** for frontend drag-and-drop — modular sensors, built-in accessibility, CSS transform-only animations. Avoid react-dnd (pre-Hooks API) and GrapesJS (full framework, overkill for block reordering).
- **Spring AI** for AI integration — built-in MiniMax support, auto-configured starters, sufficient for linear image->style->content->layout pipeline. LangChain4j adds complexity without value for non-branching workflows.
- **OpenPDF + OpenHTMLToPDF** for PDF generation — open source (LGPL/MIT), HTML-to-PDF. Avoid iText (AGPL licensing) and Puppeteer (Node.js, overkill).
- **Docker + Kubernetes** for 500 QPS — horizontal scaling, Redis integration, CDN for static assets.

**Core technologies:**
- dnd-kit: Drag-and-drop UI — modern React-first library with accessibility support
- Spring AI: AI pipeline orchestration — first-class MiniMax integration, lighter than LangChain4j
- OpenPDF: Server-side PDF generation — HTML-to-PDF without commercial licensing
- Redis: Hot endpoint caching — 24h TTL for template listing and blog views
- RabbitMQ: Async job processing — PDF generation and long-running AI tasks

### Expected Features

**From FEATURES.md**

**Must have (table stakes):**
- Template Library (10 templates) — foundation for everything; categorized by use case
- Block Editor — add, remove, reorder, configure blocks with drag-and-drop
- Click-to-Edit — inline text/image editing on preview
- Image Upload — drag-drop upload with basic processing
- Platform Hosting — subdomain publishing (username.vibe.com)
- Share Links — unique shareable URL per published site
- Mobile Responsive Output — templates responsive by default
- User Auth + WeChat Pay — already exists
- VIP Subscription (10 RMB/month) — gates all templates + removes platform branding

**Should have (competitive differentiators):**
- AI Website Generation from Image — upload photo + description -> editable page; the core differentiator
- AI Writing Assist per Block — inline "AI Write" button in each text block
- Style Transfer from Image — extract color palette, mood from uploaded image
- PDF Export — offline sharing capability (~0.1-0.5 RMB per generation)

**Defer (v2+):**
- Custom Domain Binding — infrastructure cost and SSL management
- Multi-Page Websites — contradicts single-page value proposition
- User-Created Blocks — template system complexity
- Team Collaboration — extreme complexity with locking/conflict resolution
- Code Export — removes SaaS lock-in

### Architecture Approach

**From ARCHITECTURE.md**

The system follows a **Block Component Pattern** — page content is decomposed into typed blocks (Text, Image, Social, Contact) with consistent interfaces. The **AI Pipeline Pattern** chains image analysis -> style extraction -> content generation -> block assembly as sequential steps with typed outputs. **Template-Output Separation** ensures single source of truth for content rendered to preview, published site, and PDF.

**Major components:**
1. **Page Editor** — React + dnd-kit for drag-drop block manipulation and in-place editing
2. **Editor State Store (Zustand)** — centralized state with undo/redo history, optimistic updates
3. **AI Pipeline (Spring AI)** — orchestrates MiniMax calls for image analysis and content generation
4. **Static Site Generator** — transforms block data into deployable HTML/CSS
5. **PDF Export Service** — server-side rendering to PDF using OpenPDF
6. **CDN + Object Storage** — serves published sites with caching

### Critical Pitfalls

**From PITFALLS.md**

1. **AI Generation Produces Unusable Output Without Validation Gates** — Each LangChain stage compounds errors. Implement preview/approval step, confidence scoring, and block-level regeneration.
2. **Drag-and-Drop State Desync With Backend Persistence** — Use explicit position field (not array index), debounce auto-save (500ms), persist to localStorage as backup.
3. **MiniMax API Latency Blocks the Entire UI** — Never call AI synchronously. Use async job pattern with polling, allow editing while AI runs.
4. **PDF Export Produces Broken Output** — Generate server-side with proper viewport config, wait for all assets to load, preview before charging.
5. **LangChain Chain State Leakage Between Requests** — Create new chain instance per request, never share memory objects, use request-scoped DI.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Block Editor Foundation
**Rationale:** Core editor must exist before AI can output editable content. Dependencies: Template System -> Block Editor -> Click-to-Edit.
**Delivers:** Block component model, EditorState store (Zustand), basic drag-drop with dnd-kit, REST endpoints for block CRUD.
**Addresses:** Template System, Block Editor, Click-to-Edit from FEATURES.md
**Avoids:** Drag-drop state desync (explicit position field), DOM manipulation anti-patterns

### Phase 2: Template Rendering + Preview
**Rationale:** Publishing requires template rendering. Preview iframe must match production output.
**Delivers:** TemplateRenderer service, static HTML generation, preview iframe in editor, SEO basics.
**Addresses:** Platform Hosting, Share Links, Basic SEO
**Avoids:** Preview/publish diff (serve from same domain), template block schema mismatch

### Phase 3: AI Generation Pipeline
**Rationale:** Core differentiator. Must have editable output before AI can generate into it.
**Delivers:** Spring AI + MiniMax integration, image analysis step, style extraction, content generation, block assembly, AI Write Assist per block.
**Addresses:** AI Website Generation from Image, AI Writing Assist, Style Transfer
**Avoids:** AI output validation failures (add validation gates), MiniMax UI blocking (async jobs), prompt injection (sandboxed prompts), LangChain state leakage (request-scoped DI)

### Phase 4: Publishing + Payments + PDF
**Rationale:** MVP requires working payment flow and PDF export. RabbitMQ is already in stack.
**Delivers:** Static site upload to OSS, subdomain DNS routing, CDN cache invalidation, PDF export with OpenPDF, VIP subscription enforcement.
**Addresses:** VIP Subscription, PDF Export
**Avoids:** PDF broken output (test all templates), cache stampede (stale-while-revalidate)

### Phase 5: Polish + Performance + Scale
**Rationale:** Address technical debt and prepare for growth after core validation.
**Delivers:** Redis full-page caching tuning, block animations, more templates, load testing with cache disabled.
**Addresses:** Block Animations, More Templates
**Avoids:** Cache stampede (cache warming, probabilistic early expiration)

### Phase Ordering Rationale

- **Phase 1 before 2:** AI generates editable blocks; blocks require editor to exist
- **Phase 2 before 3:** Template rendering enables preview fidelity; AI output must render correctly
- **Phase 3 before 4:** PDF requires published website; AI must work before paid features
- **Phase 4 before 5:** Core revenue loop must work before polish
- **Grouping:** Block Editor + Template Rendering are tightly coupled (both frontend-heavy)
- **Parallel work:** AI Pipeline (backend) can proceed alongside Block Editor (frontend) once architecture is defined

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 3 (AI Pipeline):** LangChain4j vs Spring AI decision needs validation. PROJECT.md specifies LangChain, but research suggests Spring AI is sufficient. Recommend testing Spring AI first, migrating to LangChain4j only if workflow complexity requires it.
- **Phase 4 (PDF Export):** OpenPDF HTML-to-PDF CSS support is limited. Benchmark both OpenPDF and OpenHTMLToPDF with actual template output before committing.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Block Editor):** dnd-kit is well-documented, established patterns
- **Phase 2 (Template Rendering):** Template-Output Separation is standard pattern with clear documentation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | dnd-kit, Spring AI, OpenPDF all verified via GitHub/docs. LangChain4j vs Spring AI needs validation. |
| Features | MEDIUM | WebFetch from Durable, Elementor, Webflow, Relume. Some competitive data from training data supplement. |
| Architecture | MEDIUM | Derived from documented frameworks (GrapesJS, dnd-kit, LangChain) and open-source patterns. No peer-reviewed sources. |
| Pitfalls | LOW | Web search API unavailable during research. Findings from training data only. All should be verified with current sources. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **LangChain4j vs Spring AI decision:** PROJECT.md specifies LangChain, but STACK.md recommends Spring AI for linear pipelines. This is the most important architectural decision to validate early.
- **OpenPDF CSS support:** OpenPDF's HTML module has limited CSS support. Benchmark with actual templates before implementation.
- **Containerization approach:** Project mentions Docker on Tencent Cloud via BT Panel. Kubernetes may be needed for 500 QPS but introduces complexity.
- **RabbitMQ utilization:** Already in stack but unused. PDF generation is a good fit for async queue processing.
- **Pitfall validation:** All pitfalls from PITFALLS.md should be verified against current sources and tested during implementation.

## Sources

### Primary (HIGH confidence)
- dnd-kit GitHub (clauderic/dnd-kit) + dndkit.com — verified 2026, 382 releases
- Spring AI Documentation (docs.spring.io/spring-ai/reference) — official documentation
- OpenPDF GitHub (LibrePDF/OpenPDF) — official repository, v3.0.3 Jan 2025
- GrapesJS Documentation (grapesjs.com/docs) — page builder architecture patterns
- LangChain Concepts (docs.langchain.com) — AI pipeline orchestration

### Secondary (MEDIUM confidence)
- Durable AI Website Builder (durable.com/ai-website-builder) — AI generation process, pricing
- Elementor Features (elementor.com/features) — block editor architecture, AI capabilities
- Webflow Features (webflow.com/features) — CMS, hosting model, AI optimization
- Vercel Documentation (vercel.com/docs) — static site deployment patterns
- Redis Caching Documentation (redis.io/docs) — cache strategies

### Tertiary (LOW confidence - needs validation)
- High concurrency patterns — training data + general cloud documentation
- Spring AI vs LangChain4j comparison — training data + docs, requires verification
- All pitfalls — training data only, web search unavailable during research
- PDF alternatives comparison — community sources (Baeldung, InfoQ)

---
*Research completed: 2026-03-21*
*Ready for roadmap: yes*
