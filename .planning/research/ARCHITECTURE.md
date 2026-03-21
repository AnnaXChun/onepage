# Architecture Research: AI Generation, Editor Polish, Payments & Hosting

**Domain:** Single-page website builder SaaS with AI generation
**Researched:** 2026-03-21
**Confidence:** MEDIUM (training knowledge + partial web verification; WebSearch unavailable for full verification)

## Executive Summary

This architecture document addresses five integration challenges for completing the Vibe Onepage v1.1 milestone. Each section identifies new components needed, modified components, explicit integration points with the existing 3-layer Spring Boot architecture (Controller-Service-Repository), and the build order that respects dependencies.

The existing architecture has: RabbitMQ consumers for PDF/AI async jobs, Redis caching (24h TTL), JWT stateless auth, WeChat Pay with order state machine (PENDING->PAYING->PAID->REFUNDING->REFUNDED), WebSocket via SimpMessagingTemplate, and existing AIService with MiniMax integration.

---

## 1. AI Generation Pipeline Integration

### Existing Components

| Component | Status |
|-----------|--------|
| AIService | EXISTS - has color extraction + text generation via Spring AI |
| RabbitMQ consumers | EXISTS - configured for PDF and AI generation |
| ColorThief client-side | EXISTS - RGB extraction already implemented |
| BlogService | EXISTS - manages blog CRUD and content persistence |

### Target Architecture

```
Frontend                         Backend                          RabbitMQ                   MiniMax API
   │                                │                                 │                          │
   │ POST /api/ai/generate          │                                 │                          │
   │ {imageBase64, templateId}      │                                 │                          │
   │───────────────────────────────>│                                 │                          │
   │                                │ ┌────────────────────────────┐  │                          │
   │                                │ │ AIGenerationController     │  │                          │
   │                                │ │ validate() → publish()     │  │                          │
   │                                │ └─────────────┬──────────────┘  │                          │
   │                                │               │                 │                          │
   │                                │               ▼                 │ publish                  │
   │                                │ ┌────────────────────────────┐  │──────────────────────────>│
   │                                │ │ ai.generation.queue         │  │                          │
   │                                │ └─────────────┬──────────────┘  │                          │
   │ 202 Accepted                   │               │                 │                          │
   │ {jobId, statusUrl}             │               │ <-- ack --     │                          │
   │<──────────────────────────────│               │                 │                          │
   │                                │               │                 │                          │
   │ GET /api/ai/status/{jobId}    │               │                 │                          │
   │<─────────────────────────────>│               │                 │                          │
   │                                │ ┌────────────────────────────┐  │ consume                  │
   │                                │ │ AIGenerationConsumer       │  │<──────────────────────────│
   │                                │ │ 1. extractColors(image)   │  │                          │
   │                                │ │ 2. buildPrompt(colors,cfg)│  │                          │
   │                                │ │ 3. callMiniMax(prompt)     │  │                          │
   │                                │ │ 4. parseResponse()        │  │                          │
   │                                │ │ 5. saveBlocks(result)     │  │                          │
   │                                │ │ 6. notify WebSocket        │  │                          │
   │                                │ └─────────────┬──────────────┘  │                          │
   │                                │               │                 │                          │
   │ WebSocket /topic/ai/{userId}  │               │                 │                          │
   │<──────────────────────────────│               │                 │                          │
```

### New Components

| Component | Package | Responsibility |
|-----------|---------|----------------|
| AIGenerationController | controller/ | Receives generation request, validates, publishes job, returns jobId |
| AIGenerationMessage | dto/ | Message payload: userId, imageUrl, templateId, settings |
| AIGenerationConsumer | messaging/ | RabbitMQ listener; orchestrates full pipeline with existing AIService |
| BlockAssemblyService | service/ | Parses AI JSON response into editor block structures |
| AIGenerationJobService | service/ | Job status tracking in Redis (PENDING -> PROCESSING -> COMPLETED/FAILED) |

### Modified Components

| Component | Change |
|-----------|--------|
| AIService | ADD: `generateBlocks(prompt)` method returning structured block JSON |
| BlogService | ADD: `applyGeneratedBlocks(blogId, blocks)` - persists AI output to existing blocks |
| WebSocketConfig | ADD: `/topic/ai/{userId}` destination for real-time job progress notifications |
| RabbitMQConfig | ADD: `ai.generation.queue` queue declaration |

### Block Schema (AI Output Contract)

```json
{
  "blocks": [
    { "type": "HERO", "content": { "title": "...", "subtitle": "...", "imageUrl": "..." } },
    { "type": "TEXT", "content": { "body": "..." } },
    { "type": "IMAGE", "content": { "url": "...", "caption": "..." } },
    { "type": "SOCIAL_LINKS", "content": { "links": [...] } },
    { "type": "CONTACT", "content": { "email": "...", "phone": "..." } }
  ],
  "style": {
    "primaryColor": "#6366F1",
    "fontFamily": "Plus Jakarta Sans",
    "layout": "centered"
  }
}
```

### Integration Points Summary

| From | To | Protocol/Message |
|------|----|-----------------|
| AIGenerationController | ai.generation.queue | RabbitMQ Message |
| AIGenerationConsumer | MiniMax API | REST via Spring AI (existing AIService) |
| AIGenerationConsumer | BlogService | Direct method call (same JVM) |
| AIGenerationConsumer | WebSocket | STOMP to /topic/ai/{userId} |
| Frontend | Backend REST | Polling or WebSocket subscription |

---

## 2. Block Assembly After AI Generation

### Design Decision: Structured JSON Blocks, Not Raw HTML

AI generation MUST output structured block data (JSON), not rendered HTML. The editor owns rendering. This keeps AI generation template-agnostic and allows users to edit after generation.

**Anti-pattern:** Having AI directly generate HTML. This removes user editability, couples AI to template styling, and requires re-generation for every edit.

### Block Type Definitions

| Block Type | Content Fields | Config Fields |
|------------|---------------|---------------|
| HERO | title, subtitle, backgroundImage | layout (centered/split/overlay) |
| TEXT | body (markdown) | fontSize, alignment, textColor |
| IMAGE | url, caption, alt | aspectRatio, shadow, borderRadius |
| SOCIAL_LINKS | links[{platform, url, icon}] | style (icon-only/labeled), arrangement |
| CONTACT | email, phone, address, formId | showForm, privacyText |
| DIVIDER | - | style (line/gradient/spacer), thickness |

### BlockAssemblyService Interface

```java
public class BlockAssemblyService {
    // Parse AI JSON response into typed Block objects
    public List<Block> parseAIResponse(AIGenerationResult result);

    // Validate required fields per block type
    public ValidationResult validate(List<Block> blocks);

    // Apply defaults based on selected template
    public List<Block> applyTemplateDefaults(List<Block> blocks, String templateId);

    // Persist to blog - calls BlogService
    public void applyToBlog(Long blogId, List<Block> blocks);
}
```

### Editor State Integration

After AI generation completes via WebSocket notification:

1. Frontend receives block JSON on `/topic/ai/{userId}`
2. Zustand store receives `SET_BLOCKS` action (replaces current blocks)
3. Editor re-renders with new block structure
4. User can immediately edit, reorder, or delete AI-generated blocks
5. Auto-save (500ms debounce, existing) persists user edits

### Integration Points

| Boundary | Communication | Notes |
|----------|---------------|-------|
| AIGenerationConsumer -> BlockAssemblyService | Direct method call | Same JVM, no network |
| BlockAssemblyService -> BlogService | Direct method call | Persists to DB |
| BlockAssemblyService -> Frontend | WebSocket STOMP | Job completion notification |
| Frontend editor -> BlogService | REST API | Auto-save on edits |

---

## 3. PDF Preview-Before-Charge Flow

### Architectural Pattern: Two-Phase Generation

```
Phase 1: Preview (Free/Low-Cost)
├── User clicks "Export PDF"
├── Backend generates low-res preview (300px max, compressed images)
├── PDF stored with 1-hour expiration (Redis or OSS)
├── User sees preview in browser
└── User decides: "Download Free Preview" or "Full PDF (1 Credit)"

Phase 2: Full Export (Charged)
├── User confirms purchase
├── Credit deducted from balance (atomic operation)
├── Backend generates full-resolution PDF
├── PDF stored with 24-hour expiration
├── Download URL returned
└── If generation fails: credit refunded automatically
```

### New Components

| Component | Package | Responsibility |
|-----------|---------|----------------|
| PdfPreviewController | controller/ | GET preview, POST full generation request |
| PdfPreviewService | service/ | Low-res preview generation |
| CreditDeductionService | service/ | Atomic credit deduction with rollback on failure |
| PdfGenerationTask | messaging/ | RabbitMQ task for full PDF generation (extends existing) |

### Modified Components

| Component | Change |
|-----------|--------|
| OrderService | ADD: CREDIT_DEDUCTION order type; deduct/rollback methods |
| PaymentController | MODIFY: Credit top-up flow via WeChat Pay (Phase 3) |
| PdfGenerationTask | ADD: Preview generation variant; failure handling with credit refund |

### Credit Deduction Flow

```
User Balance Check (Redis cache)
        │
        ▼
┌───────────────────────┐     Insufficient      ┌────────────────────┐
│ Credit >= cost (1)?   │──────────────────────>│ Prompt WeChat Pay  │
└────────┬──────────────┘                       │ Top-up first       │
         │ Sufficient                           └────────────────────┘
         ▼
┌───────────────────────┐
│ Atomic deduct         │
│ (Redis lock + UPDATE  │
│  WHERE balance >= amt)│
└────────┬──────────────┘
         │
         ▼
┌───────────────────────┐
│ Enqueue PDF job       │
│ (RabbitMQ)            │
└────────┬──────────────┘
         │
    ┌────┴────┐
    │ Success │               ┌────────────────────┐
    │         │               │ Refund credit      │
    │         │               │ (ROLLBACK)         │
    │         │               └────────────────────┘
    ▼         ▼
┌─────────┐ ┌──────────────┐
│ Store   │ │ Return       │
│ 24h URL │ │ download URL │
└─────────┘ └──────────────┘
```

### State Machine: Credit Deduction

```
DEDUCTION_PENDING -> DEDUCTION_COMPLETED -> PDF_GENERATING -> PDF_COMPLETED
       │                   │                   │
       ▼                   ▼                   ▼
DEDUCTION_FAILED <--- ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ -> PDF_FAILED (refund triggered)
```

### API Endpoints

```
GET  /api/pdf/preview/{blogId}
Response: { previewUrl: "...", expiresAt: "..." }  // 1-hour link

POST /api/pdf/generate
Body: { blogId, quality: "full" }
Response: { orderNo: "...", status: "PENDING" }

GET  /api/pdf/status/{orderNo}
Response: { status: "COMPLETED", downloadUrl: "...", expiresAt: "..." }
```

### Integration Points

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend -> PdfPreviewController | REST | Get preview URL |
| CreditDeductionService -> Redis | Direct | Distributed lock + balance check |
| CreditDeductionService -> UserMapper | JDBC | Atomic UPDATE |
| PdfPreviewController -> OSS/S3 | SDK | Upload preview PDF |
| PdfGenerationTask -> CreditDeductionService | Callback | Refund on failure |

---

## 4. WeChat Pay Credit Deduction Integration

### Key Distinction: Payment Gateway vs. Credit System

WeChat Pay is a **payment gateway** - it processes real-time payments. It does NOT natively support "credit deduction" or "wallet" workflows. The credit/balance system is a **platform-layer wallet** that uses WeChat Pay only for top-ups.

### Architecture: Platform Wallet + WeChat Pay Gateway

```
┌──────────────────────────────────────────────────────────────┐
│                    User Balance (Platform Wallet)              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  credit_balance: 50 credits                           │   │
│  │  - Earned from purchases (template purchases)         │   │
│  │  - Purchased via WeChat Pay top-up                   │   │
│  │  - Admin grants                                      │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┴────────────────────┐
         │                                         │
         ▼                                         ▼
┌─────────────────────────┐             ┌─────────────────────────┐
│   Credit Deduction      │             │   WeChat Pay Top-up     │
│   (Platform Logic)       │             │   (Real Payment)         │
│                          │             │                         │
│ Deduct from wallet       │             │ JSAPI payment flow      │
│ on PDF export /         │             │ to add credits          │
│ template purchase        │             │                         │
└─────────────────────────┘             └─────────────────────────┘
```

### Credit Top-Up Flow (WeChat Pay)

```
User selects credit package (e.g., 10 credits for 10 RMB)
        │
        ▼
Backend: Create Order (type: CREDIT_TOP_UP, amount: 10 RMB)
        │
        ▼
Backend: Call WeChat Pay JSAPI to get payment parameters
        │
        ▼
Frontend: Call wx.chooseWXPay(paymentParams)
        │
   ┌────┴────┐
   │ Success  │
   │          │
   ▼          ▼
WeChat Pay               WeChat Pay
Callback                 Callback
(PaymentController)      (async notification)
        │                        │
        ▼                        ▼
Add credits to           Verify signature
user wallet              Add credits to
(atomic operation)       user wallet
        │                        │
        ▼                        ▼
Return success           Idempotent check
to frontend              (prevents duplicate credits)
```

### New Components

| Component | Package | Responsibility |
|-----------|---------|----------------|
| WalletService | service/ | Get balance, add/deduct credits atomically |
| CreditDeductionService | service/ | Deduct with idempotency key, rollback support |
| CreditTopUpController | controller/ | Create top-up order, handle WeChat Pay callback |

### Modified Components

| Component | Change |
|-----------|--------|
| UserService | ADD: `getBalance()`, `addCredits()`, `deductCredits()` methods |
| OrderService | ADD: CREDIT_TOP_UP order type; modify callback to credit user on top-up |
| WeChatPayService | ADD: `createCreditTopUpOrder()` method |
| PaymentController | MODIFY: `callback` method - credit user account on CREDIT_TOP_UP success |
| UserMapper | ADD: `updateBalance(Long userId, Integer delta)` - atomic increment |

### Atomic Credit Operations (Critical)

Credit operations must be idempotent to prevent double-deduction or double-credit:

```java
@Service
public class CreditDeductionService {
    @Autowired private UserMapper userMapper;
    @Autowired private RedisTemplate<String, String> redis;

    private static final String DEDUCT_LOCK_PREFIX = "credit:lock:";
    private static final String DEDUCT_IDEM_PREFIX = "credit:deduct:";

    @Transactional
    public boolean deductCredits(Long userId, Integer amount, String idempotencyKey) {
        // 1. Idempotency check (prevent double-deduction from retries)
        if (Boolean.TRUE.equals(redis.hasKey(DEDUCT_IDEM_PREFIX + idempotencyKey))) {
            return false; // Already processed
        }

        // 2. Distributed lock
        String lockKey = DEDUCT_LOCK_PREFIX + userId;
        Boolean acquired = redis.opsForValue().setIfAbsent(lockKey, "1", 10, TimeUnit.SECONDS);
        if (!Boolean.TRUE.equals(acquired)) {
            throw BusinessException.concurrentOperation();
        }

        try {
            // 3. Atomic deduction with balance check
            int updated = userMapper.deductBalance(userId, amount);
            if (updated == 0) {
                throw BusinessException.insufficientCredits();
            }

            // 4. Record idempotency key (24h TTL)
            redis.opsForValue().set(DEDUCT_IDEM_PREFIX + idempotencyKey, "1", 24, TimeUnit.HOURS);
            return true;
        } finally {
            redis.delete(lockKey);
        }
    }
}
```

### Integration Points

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend -> CreditTopUpController | REST | Create top-up order |
| CreditTopUpController -> WeChatPayService | Method call | Get payment params |
| WeChat Pay -> PaymentController | WeChat Pay callback POST | Async payment notification |
| PaymentController -> WalletService | Method call | Credit user wallet |
| CreditDeductionService -> UserMapper | JDBC | Atomic balance update |

---

## 5. Subdomain Routing for Static Site Hosting

### Architecture Pattern: Wildcard DNS + Dynamic Resolution

```
DNS Query                              Server Processing
(blog23.onepage.com)                        │
    │                                        │
    ▼                                        ▼
┌─────────────────────┐         ┌─────────────────────────────┐
│ *.onepage.com      │         │ Host Header: blog23.onepage  │
│ A record: 1.2.3.4  │         └─────────────┬───────────────┘
└─────────────────────┘                       │
    │                                        ▼
    │                              ┌─────────────────────┐
    │                              │ SubdomainFilter     │
    │                              │ (Spring Filter)     │
    │                              └─────────┬───────────┘
    │                                        │
    ▼                                        ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Extract subdomain: "blog23"                             │
│  2. Lookup blog by subdomain in DB                         │
│  3. Blog not found -> return 404                           │
│  4. Blog found -> load content from Redis cache / DB       │
│  5. Render via Thymeleaf or serve pre-built static HTML    │
└─────────────────────────────────────────────────────────────┘
```

### Two Hosting Modes

| Mode | How It Works | Performance | Use Case |
|------|--------------|-------------|----------|
| **Dynamic (Default)** | Every request renders HTML from DB/cache | Slower, always fresh | Real-time edits visible immediately |
| **Static (Published)** | Pre-rendered HTML served from OSS/S3 | Faster, offload from app | Published sites, high traffic |

### New Components

| Component | Package | Responsibility |
|-----------|---------|----------------|
| SubdomainFilter | filter/ | Extract subdomain from Host header, forward to SiteController |
| SiteController | controller/ | Route subdomain to blog, render page |
| SiteResolverService | service/ | Map subdomain -> blog, handle 404 |
| PublishService | service/ | Render blog to static HTML, upload to OSS |
| StaticSiteService | service/ | Serve pre-built HTML from OSS |

### Modified Components

| Component | Change |
|-----------|--------|
| BlogService | ADD: `publish(blogId, subdomain)`, `unpublish(blogId)`, `getPublishedSite(subdomain)` |
| CorsConfig | ADD: Allow subdomain origins (*.onepage.com) |
| Application.yml | ADD: OSS/S3 storage configuration |
| Blog model | ADD: `subdomain` field, `status` (DRAFT/PUBLISHED) |

### Publish Flow

```
User clicks "Publish"
        │
        ▼
┌───────────────────────────┐
│ Validate: blog has       │
│ required blocks          │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│ Generate static HTML     │
│ using Thymeleaf           │
│ (reuse existing pattern) │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│ Upload to OSS/S3          │
│ Path: /sites/{userId}/{blogId}.html │
└───────────┬───────────────┘
            │
            ▼
┌───────────────────────────┐
│ Update blog:             │
│ status = PUBLISHED       │
│ subdomain = {uniqueId}   │
└───────────┬───────────────┘
            │
            ▼
Return: "https://{uniqueId}.onepage.com"
```

### Subdomain Resolution Filter

```java
@Component
public class SubdomainFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain) throws ServletException, IOException {
        String host = request.getHeader("Host");
        String subdomain = extractSubdomain(host); // "blog23" from "blog23.onepage.com"

        // Skip non-subdomain requests (main site, www, API)
        if (subdomain == null || subdomain.equals("www") || subdomain.equals("api")) {
            chain.doFilter(request, response);
            return;
        }

        // Forward subdomain requests to site controller
        request.setAttribute("subdomain", subdomain);
        request.getRequestDispatcher("/site/" + subdomain).forward(request, response);
    }

    private String extractSubdomain(String host) {
        if (host == null) return null;
        // "blog23.onepage.com" -> "blog23"
        // "blog23.onepage.com:8080" -> "blog23"
        String[] parts = host.split("\\.");
        if (parts.length >= 3) {
            return parts[0];
        }
        return null;
    }
}

@Controller
public class SiteController {
    @Autowired private SiteResolverService siteResolver;

    @GetMapping("/site/{subdomain}")
    public String serveSite(@PathVariable String subdomain, Model model) {
        BlogSite site = siteResolver.resolve(subdomain);
        if (site == null) {
            return "error/404"; // Branded 404 page
        }
        model.addAttribute("content", site.getContent());
        return "site-template"; // Thymeleaf template
    }
}
```

### DNS Configuration Required (Production)

```
Type    Name    Value
─────────────────────────────────
A       *       1.2.3.4        (wildcard - catches all subdomains)
A       @       1.2.3.4        (bare domain)
CNAME   www     your-app.com   (optional www redirect)
```

### Integration Points

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Browser -> SubdomainFilter | HTTP (Host header) | Wildcard DNS must point to server |
| SubdomainFilter -> SiteController | Forward/Dispatcher | No network hop |
| SiteController -> SiteResolverService | Method call | Subdomain -> blog lookup |
| SiteResolverService -> Redis | Cache read | Blog content cache |
| SiteResolverService -> BlogMapper | JDBC | Cache miss -> DB |
| PublishService -> OSS/S3 | SDK upload | Static HTML storage |

---

## Cross-Cutting Integration Matrix

### All New Components by Feature

| Feature | New Components | Modified Components |
|---------|---------------|---------------------|
| AI Pipeline | AIGenerationController, AIGenerationMessage, AIGenerationConsumer, BlockAssemblyService, AIGenerationJobService | AIService, BlogService, WebSocketConfig, RabbitMQConfig |
| Block Assembly | BlockAssemblyService | BlogService (shared block schema with frontend) |
| PDF Preview | PdfPreviewController, PdfPreviewService, CreditDeductionService | OrderService, PaymentController, PdfGenerationTask |
| Credit System | WalletService, CreditDeductionService, CreditTopUpController | UserService, OrderService, WeChatPayService, PaymentController, UserMapper |
| Subdomain Routing | SubdomainFilter, SiteController, SiteResolverService, PublishService, StaticSiteService | BlogService, CorsConfig, Blog model |

### Component Dependency Graph

```
RabbitMQ
    │
    ├──> AIGenerationConsumer ──────> BlockAssemblyService ──> BlogService ──> MySQL
    │         │                                                    │
    │         │                                                    ▼
    │         └──────────────────────────────────────────────────> Redis Cache
    │
    └──> PdfGenerationTask ──────────> CreditDeductionService ──> UserMapper ──> MySQL
                   │                        │
                   │                        ▼
                   │                   WeChat Pay (top-up)
                   │
                   ▼
              OSS/S3 Storage ◄── PublishService
                   │
                   ▼
            SubdomainFilter ◄── DNS (*.onepage.com)
                   │
                   ▼
            SiteController ──> SiteResolverService
```

---

## Build Order (ARCH-02)

### Phase 1: Block Schema Contract (Foundation - DO FIRST)

**Rationale:** Frontend editor and backend AI pipeline must agree on block JSON schema before any implementation.

1. Define `Block` interface in frontend (TypeScript)
2. Define `Block` model in backend (Java)
3. Define `AIGenerationResult` response schema (JSON contract)
4. Create `BlockAssemblyService` with parsing/validation logic
5. Test schema agreement between frontend and backend

**Dependencies:** None (pure contract)

### Phase 2: AI Generation Pipeline

**Rationale:** Depends on block schema from Phase 1; provides value early for user testing.

1. AIGenerationController + Redis job tracking (PENDING/PROCESSING/COMPLETED/FAILED)
2. RabbitMQ message definition (AIGenerationMessage)
3. AIGenerationConsumer integrating existing AIService
4. WebSocket notification to frontend (/topic/ai/{userId})
5. Frontend WebSocket subscription + block rendering from AI result

**Dependencies:** Phase 1 (block schema)

### Phase 3: Credit System (Prerequisite - DO BEFORE PDF/Payments)

**Rationale:** PDF preview-before-charge and all paid features depend on credits; must be solid before building on top.

1. User model: add `credit_balance` field
2. UserMapper: atomic `updateBalance(Long userId, Integer delta)`
3. Redis: credit balance cache with 1h TTL
4. WalletService: getBalance(), addCredits() methods
5. CreditDeductionService: deductCredits() with idempotency key and distributed lock
6. WeChat Pay CREDIT_TOP_UP flow: create order -> JSAPI -> callback -> credit user

**Dependencies:** None (core wallet infrastructure)

### Phase 4: PDF Preview-Before-Charge

**Rationale:** Depends on credit system from Phase 3; builds on existing PDF generation.

1. PdfPreviewService: low-res preview generation (reuse existing PDF logic)
2. PdfPreviewController: GET preview endpoint with 1h expiring URL
3. Full PDF generation with credit deduction (CreditDeductionService)
4. Refund logic: if PDF generation fails after deduction, rollback credit
5. Frontend: preview UI, confirmation button, credit deduction UX

**Dependencies:** Phase 3 (credit system), existing PdfGenerationTask

### Phase 5: Subdomain Routing & Publishing

**Rationale:** Depends on blog being complete (AI + editor polish done); is the final publish step.

1. SubdomainFilter + SiteController for serving published sites
2. Blog model: add `subdomain`, `status` (DRAFT/PUBLISHED) fields
3. PublishService: static HTML render + OSS upload
4. UnpublishService: remove from OSS, reset status
5. DNS configuration documentation (wildcard A record)
6. Frontend: publish/unpublish button, subdomain display

**Dependencies:** Phase 2 (AI pipeline for complete blogs), Phase 1 (block editor)

### Phase Dependency Graph

```
Phase 1 (Block Schema)
    │
    ▼
Phase 2 (AI Pipeline) ──────────────────────────┐
    │                                          │
    │                                          ▼
    │                              Phase 5 (Subdomain Routing)
    │                                  (needs complete blogs)
    │
    ▼
Phase 3 (Credit System)
    │
    ▼
Phase 4 (PDF Preview)
    │
    ▼
Phase 5 (Subdomain Routing)
```

---

## Anti-Patterns

### 1. AI Generates HTML, Not Blocks

**What:** Have AI directly output rendered HTML instead of structured block data.

**Why wrong:** Users lose editability; template coupling increases; every edit requires re-generation.

**Instead:** AI outputs block JSON; editor renders blocks; user edits blocks.

### 2. Synchronous AI Calls in HTTP Request

**What:** Call AI provider synchronously in HTTP request thread.

**Why wrong:** AI calls take 5-30s; will timeout at 500 QPS; exhausts thread pool.

**Instead:** Always use async RabbitMQ-based pipeline with job status tracking.

### 3. Credit Deduction Without Idempotency

**What:** Deduct credits without idempotency keys.

**Why wrong:** Network retries or double-clicks cause double deduction; users lose credits.

**Instead:** Every deduction request includes idempotency key stored in Redis with 24h TTL.

### 4. Wildcard DNS Without Branded 404

**What:** Configure wildcard DNS but return slow/generic 404 for unknown subdomains.

**Why wrong:** Poor UX; unnecessary load on app servers.

**Instead:** Subdomain resolution returns branded 404 page; cache at CDN edge if possible.

### 5. PDF Generation Without Preview

**What:** Generate full PDF immediately on request and charge.

**Why wrong:** Users may cancel without downloading; wastes credits and generates unnecessary PDFs.

**Instead:** Two-phase: free low-res preview first, then full PDF with credit deduction on explicit confirmation.

---

## Sources

**Note:** WebSearch was unavailable during research (400 errors on all queries). The following reflects training knowledge and partial verification via WebFetch.

| Topic | Source | Confidence |
|-------|--------|------------|
| Spring AI + RabbitMQ | spring.io/projects/spring-ai, spring.io/projects/spring-amqp | MEDIUM - Official docs, pattern well-established |
| WeChat Pay v3 API | pay.weixin.qq.com/doc/v3/merchant/4012062524 | MEDIUM - Official docs, partial verification |
| Credit/Wallet systems | stripe.com/docs/billing (redirected to docs.stripe.com) | MEDIUM - Training knowledge |
| Block editor architecture | grapesjs.com/docs, contentful.com/developers/docs | MEDIUM - Well-established CMS patterns |
| Subdomain routing | docs.netlify.com (routing overview) | MEDIUM - Training knowledge |
| LangChain pipeline | docs.langchain.com | MEDIUM - Well-established AI patterns |

**Overall confidence:** MEDIUM - Well-established architectural patterns from training data; WebSearch unavailable to verify current 2025-2026 best practices.

---

*Architecture research for: Vibe Onepage v1.1 milestone - AI generation, editor polish, payments, and hosting*
*Researched: 2026-03-21*
