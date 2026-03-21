# Technology Stack — Vibe Onepage AI Website Builder

**Project:** Vibe Onepage drag-and-drop website builder with AI generation
**Researched:** 2026-03-21
**Confidence:** MEDIUM-HIGH (multiple verified sources, some gaps in 2025-specific data)

---

## Executive Recommendation

For a brownfield Spring Boot + React project adding AI generation and drag-and-drop editing:

| Layer | Recommended | Version | Rationale |
|-------|-------------|---------|-----------|
| **Frontend Drag-and-Drop** | dnd-kit | ^0.1.0 (2026) | Modular, accessible, React-first; avoids legacy react-dnd complexity |
| **AI Integration** | Spring AI | ^1.0.0 | First-class Spring Boot integration, built-in MiniMax support, lighter than LangChain4j |
| **AI Workflow Orchestration** | Spring AI Advisors + ChatClient | — | Sufficient for linear pipelines; use LangChain4j only if complex branching/looping needed |
| **PDF Generation** | OpenPDF + OpenHTMLToPDF | 3.0.3 / 1.0.0 | Open source (LGPL), HTML-to-PDF, no commercial license costs |
| **Hosting (Containers)** | Docker + Kubernetes (EKS/GKE) | — | 500 QPS target requires container orchestration, horizontal scaling, Redis integration |

---

## 1. Frontend Drag-and-Drop Library

### Recommended: dnd-kit

**Why:** dnd-kit is the modern standard for React drag-and-drop in 2025-2026. It is:
- **Modular**: Sensor system (mouse, touch, keyboard), collision detection algorithms, state management all swappable
- **Accessible**: Built-in keyboard navigation, ARIA support, focus management
- **Performant**: Uses CSS transforms only (no layout-thrashing animations)
- **React-first**: `@dnd-kit/react` is a thin, idiomatic wrapper around the framework-agnostic core
- **Active maintenance**: 382 releases, 16.8k stars, latest Feb 2026

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Core concept:**
```tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Draggable block component
function Block({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// In editor:
<DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
    {blocks.map(block => <Block key={block.id} id={block.id} />)}
  </SortableContext>
</DndContext>
```

**Alternative considered: react-dnd**
- Older API (pre-Hooks era), steeper learning curve
- No built-in collision detection strategies
- More boilerplate for equivalent functionality
- Not recommended for new projects in 2025

**Alternative considered: GrapesJS**
- Full website builder framework, not a component library
- Ships with its own storage, asset management, and plugin ecosystem
- Overkill if you just need drag-and-drop block reordering within existing React app
- Better if building a from-scratch page builder with plugin extensibility
- Not recommended for this project (existing React app with TailwindCSS)

**Alternative considered: Builder.io**
- Enterprise-focused visual development platform
- Heavy SDK dependency, opinionated about component structure
- Better for e-commerce/headless CMS use cases
- Not recommended for this project's scope

---

## 2. AI Integration — Spring AI (not LangChain4j)

### Recommended: Spring AI + MiniMax

**Why Spring AI over LangChain4j for this project:**

| Criterion | Spring AI | LangChain4j |
|-----------|-----------|-------------|
| **MiniMax support** | Built-in (`spring.ai.minimax.*`) | Requires custom model definition |
| **Spring Boot integration** | Auto-configured via starters | Manual bean wiring |
| **Complexity** | Lightweight, focused on model access | Richer ecosystem (agents, tools, memory) |
| **Project fit** | Sufficient for linear image→style→content→layout pipeline | Overkill unless complex branching/looping needed |
| **Learning curve** | Lower for Spring Boot developers | Steeper |
| **Maintenance** | Spring team + community | Active but smaller community |

**The project already specifies SpringAI + MiniMax in PROJECT.md.** The research confirms this is the correct choice. LangChain4j would add complexity without value for a linear AI pipeline.

**Spring AI MiniMax Configuration:**
```properties
spring.ai.minimax.chat.api-key=${MINIMAX_API_KEY}
spring.ai.minimax.chat.base-url=https://api.minimax.chat/v1
spring.ai.minimax.chat.options.model=abab6-chat
```

**Usage:**
```java
ChatClient chatClient = ChatClient.builder(minimaxChatModel).build();
String content = chatClient.prompt()
    .user("Analyze this image and extract RGB color palette and mood")
    .call()
    .content();
```

### AI Workflow Orchestration

For the image analysis → style extraction → content generation → block mapping pipeline:

**Recommended approach:** Spring AI ChatClient with a **sequential prompt chain** using Java `CompletableFuture` or Spring's `@Async`.

```java
// Sequential chain via CompletableFuture
CompletableFuture<String> imageAnalysis = CompletableFuture.supplyAsync(() -> analyzeImage(image));
CompletableFuture<String> styleExtraction = imageAnalysis.thenApply(this::extractStyle);
CompletableFuture<String> contentGeneration = styleExtraction.thenCompose(this::generateContent);
CompletableFuture<BlogPage> blockMapping = contentGeneration.thenCompose(this::mapToBlocks);
```

**Why not LangChain4j?** The pipeline is linear (no branching, no loops, no tool-calling agents). LangChain4j's agent and memory features would be unused complexity. The project's "LangChain for chaining" decision should be revisited — Spring AI's sequential prompts achieve the same result with less overhead.

**If complex branching is needed later** (e.g., different content strategies based on detected template type), upgrade to LangChain4j at that point.

---

## 3. PDF Generation — OpenPDF + OpenHTMLToPDF

### Recommended: OpenPDF (HTML-to-PDF module) + OpenHTMLToPDF

**Why OpenPDF:**

| Library | License | HTML-to-PDF | 2025 Status | Verdict |
|---------|---------|-------------|-------------|---------|
| **OpenPDF** | LGPL + MPL | Yes (openpdf-html module) | Active, v3.0.3 Jan 2025 | **Recommended** |
| **iText 7** | AGPL (commercial license required) | Yes | Active | Too expensive for low-budget project |
| **Flying Saucer (xhtmlrenderer)** | LGPL | Yes (XHTML only) | Low activity | Legacy, XHTML strict |
| **OpenHTMLToPDF** | MIT | Yes | Active | **Strong alternative** |

**OpenPDF (recommended):**
```xml
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf</artifactId>
    <version>3.0.3</version>
</dependency>
<dependency>
    <groupId>com.github.librepdf</groupId>
    <artifactId>openpdf-html</artifactId>
    <version>3.0.3</version>
</dependency>
```

```java
// HTML to PDF
Document document = new Document(PageSize.A4);
PdfWriter writer = new PdfWriter(new FileOutputStream("output.pdf"));
HtmlTransformer htmlTransformer = new HtmlTransformer(document, writer);
htmlTransformer.transform(htmlString);
```

**OpenHTMLToPDF (alternative, better CSS support):**
```xml
<dependency>
    <groupId>com.openhtmltopdf</groupId>
    <artifactId>openhtmltopdf-core</artifactId>
    <version>1.0.10</version>
</dependency>
<dependency>
    <groupId>com.openhtmltopdf</groupId>
    <artifactId>openhtmltopdf-pdfbox</artifactId>
    <version>1.0.10</version>
</dependency>
```

**Why not Puppeteer/headless Chrome?**
- Puppeteer is Node.js, not Java — would require separate microservice
- Higher resource consumption (full Chrome instance per PDF)
- Overkill for static HTML-to-PDF conversion
- Only needed if advanced web features (WebGL, complex JS) required

**PDF Generation Flow:**
1. Render website as HTML string (from React frontend or backend template)
2. Transform HTML to PDF via OpenPDF/OpenHTMLToPDF
3. Store in OSS/S3, serve via signed URL
4. Return PDF URL to user (paid feature as specified)

---

## 4. High-Concurrency Hosting Architecture

### Target: 500 QPS on hot endpoints (template listing, blog view)

### Recommended Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containers** | Docker + Kubernetes (EKS/GKE/ACK) | Horizontal scaling, auto-scaling |
| **CDN** | Cloudflare or Aliyun CDN | Static asset caching, DDoS protection |
| **Load Balancer** | Cloud provider LB (ALB/CLB) | Traffic distribution |
| **Backend** | Spring Boot (existing) + HikariCP | Connection pooling, async processing |
| **Cache** | Redis (existing) | Hot data caching, payment idempotency |
| **Database** | MySQL 8 (existing) + read replicas | Horizontal read scaling |
| **Object Storage** | Aliyun OSS / AWS S3 | Static file storage (PDFs, images) |
| **Message Queue** | RabbitMQ (existing, unused) | Async job processing (PDF generation) |

### Scaling Strategy by Load Level

| QPS | Strategy |
|-----|----------|
| **< 50** | Single container, no scaling needed |
| **50-500** | Enable HPA (Horizontal Pod Autoscaler), Redis caching for hot endpoints |
| **500+** | Read replicas for MySQL, CDN for static assets, connection pooling tuning |
| **1000+** | Database sharding, multi-region deployment, advanced caching (Redis Cluster) |

### Key Optimizations for 500 QPS Target

**1. Caching (already in place):**
- Template listing: Redis cache with 24h TTL
- Blog view: Redis cache with 24h TTL (invalidated on update)
- Use `@Cacheable` annotations + Spring Cache abstraction

**2. Database:**
```properties
# application.yml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

**3. Async Processing for PDF:**
```java
@Async
public CompletableFuture<String> generatePdfAsync(BlogPage page) {
    // PDF generation is I/O-bound — run in separate thread pool
    return CompletableFuture.supplyAsync(() -> pdfService.generate(page));
}
```

**4. Connection Pooling:**
- Use HikariCP (default in Spring Boot 2+) — proven, high-performance
- MySQL max_connections should be: `(num_cores * 2) + effective_spindle_count`
- With containerized MySQL and SSD: 100-200 max_connections is typical

**5. CDN for Static Assets:**
- Blog pages should be served via CDN when possible
- Use `Cache-Control: public, max-age=86400` for published blogs
- Invalidate CDN cache on blog update

### Hosting Platform Recommendation

**For low-budget, Tencent Cloud user:**
| Component | Recommended | Why |
|-----------|-------------|-----|
| **Container Platform** | Tencent Cloud EKS (Elastic Kubernetes) or TKE | Native Tencent Cloud integration, BT Panel mentioned in project |
| **Alternative** | Aliyun ACK | Good K8s offering if staying in China |
| **Cost-effective option** | Docker Compose + cloud VMs | Sufficient for < 500 QPS, simpler than K8s |
| **Managed option** | Render / Railway / Fly.io | Faster startup, less ops, but less control |

**Recommended for this project:**
Given the 500 QPS requirement, low budget, and existing Docker setup:
1. **Short term:** Docker Compose on cloud VMs with Redis + MySQL in Docker
2. **Medium term:** Migrate to Kubernetes (EKS/ACK) when DAU grows
3. **CDN:** Use Aliyun CDN (if in China) or Cloudflare for static assets

---

## 5. What NOT to Use and Why

| Avoid | Reason |
|-------|--------|
| **react-dnd** | Pre-Hooks API, steeper learning curve, less accessible than dnd-kit |
| **GrapesJS** | Full framework, not a component — overkill for block reordering in existing React app |
| **Builder.io** | Enterprise-focused, heavy SDK, over-engineered for this project's scope |
| **LangChain4j** | Richer than needed for linear pipeline; Spring AI is sufficient and better integrated |
| **iText 7** | AGPL license requires commercial license for proprietary use — too expensive |
| **Puppeteer for PDF** | Node.js only, high resource usage, overkill for static HTML conversion |
| **Glassmorphism/everywhere** | Generic AI aesthetic — violates project design direction |
| **Elastic Beanstalk** | Higher cost than EKS/ACK, less flexibility, vendor lock-in |
| **Session-based auth** | Already using JWT — correct choice for stateless API scaling |

---

## 6. Version Compatibility Matrix

| Technology | Version | Notes |
|------------|---------|-------|
| React | 18.x | Existing, do not upgrade to 19 yet (Vite 5.x compatibility) |
| Vite | 5.x | Compatible with React 18 |
| TailwindCSS | 3.x | Existing, 4.x is new but 3.x is stable |
| dnd-kit | ^0.1.0 | Check npm for latest (382 releases) |
| Spring Boot | 3.x | Existing, do not upgrade |
| Spring AI | 1.x | Use latest 1.x (check Maven Central) |
| MySQL | 8.x | Existing |
| Redis | 7.x | Existing |
| OpenPDF | 3.0.3 | Latest stable as of Jan 2025 |
| OpenHTMLToPDF | 1.0.10 | Latest stable |

---

## 7. Installation Summary

```bash
# Frontend (already exists, just adding dnd-kit)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# Backend — add to pom.xml or build.gradle
# Spring AI (if not already present)
implementation 'org.springframework.ai:spring-ai-spring-boot-starter'

# OpenPDF for PDF generation
implementation 'com.github.librepdf:openpdf:3.0.3'
implementation 'com.github.librepdf:openpdf-html:3.0.3'

# Or OpenHTMLToPDF (alternative)
implementation 'com.openhtmltopdf:openhtmltopdf-pdfbox:1.0.10'
```

---

## Sources

| Technology | Source | Confidence |
|------------|--------|------------|
| dnd-kit | GitHub (clauderic/dnd-kit) + dndkit.com | HIGH — Verified 2026, 382 releases |
| Spring AI MiniMax | docs.spring.io/spring-ai/reference | HIGH — Official documentation |
| GrapesJS | grapesjs.com/docs | HIGH — Official documentation |
| Builder.io | github.com/BuilderIO/builder | MEDIUM — GitHub page |
| OpenPDF | github.com/LibrePDF/OpenPDF | HIGH — Official repository |
| PDF alternatives | Training data (Baeldung, InfoQ) | MEDIUM — Community sources |
| High concurrency | Training data + cloud documentation | MEDIUM — General best practices |
| Spring AI vs LangChain4j | Training data + docs | MEDIUM — Requires verification |

---

## Open Questions / Gaps

1. **LangChain4j vs Spring AI for workflow**: The PROJECT.md specifies LangChain, but research suggests Spring AI is sufficient for linear pipelines. Recommend testing Spring AI first, migrating to LangChain4j only if workflow complexity requires it.

2. **OpenPDF HTML-to-PDF CSS support**: OpenPDF's HTML module has limited CSS support compared to OpenHTMLToPDF. Recommend benchmarking both with actual template output.

3. **Containerization approach**: Project mentions Docker on Tencent Cloud via BT Panel. If scaling to 500 QPS, Kubernetes may be needed. Recommend evaluating Docker Compose sufficiency first before introducing K8s complexity.

4. **PDF generation async queue**: RabbitMQ is already in stack but unused. PDF generation (I/O-bound, ~0.1-0.5 RMB each) is a good fit for async queue processing.
