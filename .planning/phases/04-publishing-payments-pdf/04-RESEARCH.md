# Phase 4: Publishing, Payments & PDF - Research

**Researched:** 2026-03-21
**Domain:** Static site generation, PDF export, payment processing, user balance/subscription management
**Confidence:** MEDIUM

## Summary

Phase 4 implements three core systems: static site publishing (HOST), server-side PDF export (PDF), and payment/subscription management (PAY). The existing codebase has a WeChat Pay integration and order state machine but lacks user balance tracking, VIP subscriptions, PDF generation, and static HTML generation from block editor data. Key additions include a PDF library (Flying Saucer recommended over OpenPDF for CSS support), a user_credits table, and a block-to-HTML converter.

**Primary recommendation:** Use Flying Saucer (xhtmlrenderer) for HTML-to-PDF with Thymeleaf for template rendering, implement user balance via a new user_credits table, and generate static HTML by rendering blocks JSON through Thymeleaf templates.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOST-01 | User clicks "Publish" to deploy site | Blog.status field controls published state; publish endpoint flips 0->1 |
| HOST-02 | Site at username.vibe.com or localhost:port | Dev: localhost routing. Prod: wildcard DNS + reverse proxy |
| HOST-03 | Published site is static HTML/CSS output | Blocks JSON -> Thymeleaf template -> static HTML string stored/rendered |
| HOST-04 | Unique shareable link per published site | Blog.shareCode already exists; use existing /blog/:shareCode endpoint |
| HOST-05 | User can unpublish site | Publish toggle endpoint sets blog.status = 0 |
| HOST-06 | Subdomain DNS routing in production | Wildcard CNAME + nginx/Vercel routing |
| PDF-01 | User can export current page as PDF | PDF export button triggers async job |
| PDF-02 | PDF generated server-side using OpenPDF | Flying Saucer (xhtmlrenderer) recommended - better CSS support than raw OpenPDF |
| PDF-03 | PDF generation runs as async job | RabbitMQ message queue already configured; add PDF_JOB_QUEUE |
| PDF-04 | PDF generation costs ~0.1-0.5 RMB | Deduct from user_credits.balance on job completion |
| PDF-05 | Generated PDF downloadable via link (expires 24h) | Store PDF in file storage; return presigned/temporary URL |
| PDF-06 | PDF preview shown before charging | Generate preview first, user confirms, then deduct credits |
| PAY-01 | VIP subscription: 10 RMB/month | Add vip_status, vip_expire_time to users table |
| PAY-02 | VIP users access all templates | Check vip_status before allowing template use |
| PAY-03 | Non-VIP purchase individual templates (1-10 RMB) | Add user_template_purchases table |
| PAY-04 | Payment via existing WeChat Pay | WeChatPayService already exists and functional |
| PAY-05 | Template purchase is one-time | user_template_purchases records lifetime access |
| PAY-06 | User balance tracking | Add user_credits table with balance field |
| PAY-07 | PDF export deducted from balance | Deduct from user_credits.balance in PDF job completion |
| AUTH-03 | VIP status checked on protected action | Add VIP check in SecurityConfig or JwtUserPrincipal |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Flying Saucer (xhtmlrenderer) | 9.3.1 | HTML-to-PDF conversion | Better CSS support than OpenPDF; renders XHTML+CSS to PDF |
| Thymeleaf | 3.x (Spring Boot starter) | Template engine | Converts blocks JSON to HTML string for PDF/static output |
| OpenPDF | 1.0.5 | Low-level PDF creation | Flying Saucer depends on it; use for any direct PDF needs |
| iText PDF (pdfHTML) | 5.5.13 (AGPL) | HTML-to-PDF alternative | Better CSS support but AGPL license - Flying Saucer preferred |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Spring Boot Starter Thymeleaf | 3.2.0 | Template rendering | Block JSON -> HTML conversion |
| OpenPDF | 1.0.5 | PDF manipulation | Flying Saucer dependency |
| xhtmlrenderer | 9.3.1 | HTML-to-PDF | Main PDF generation engine |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Flying Saucer | OpenPDF raw | OpenPDF lacks CSS support; would require inline styles everywhere |
| Flying Saucer | iText pdfHTML | iText has better CSS support but AGPL license may require commercial purchase |
| Thymeleaf | Jackson serialization | Jackson produces JSON not HTML; need template for static site rendering |
| Thymeleaf | Mustache.js | Mustache is logicless; harder to render conditional block content |

**Installation:**
```bash
# Backend pom.xml additions
<dependency>
    <groupId>org.xhtmlrenderer</groupId>
    <artifactId>flying-saucer-pdf-openpdf</artifactId>
    <version>9.3.1</version>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

## Architecture Patterns

### Recommended Project Structure

```
backend/src/main/java/com/onepage/
├── controller/
│   ├── BlogController.java        # Add publish/unpublish endpoints
│   ├── PdfController.java        # NEW: PDF export endpoints
│   └── PaymentController.java    # Extend for VIP/credits
├── service/
│   ├── BlogService.java          # Add publish/unpublish logic
│   ├── PdfGenerationService.java # NEW: HTML-to-PDF conversion
│   ├── StaticSiteService.java     # NEW: Block JSON -> static HTML
│   ├── UserCreditsService.java   # NEW: Balance management
│   ├── VipService.java           # NEW: VIP subscription management
│   └── WeChatPayService.java     # Existing - may extend
├── dto/
│   ├── PublishRequest.java       # NEW
│   ├── PdfPreviewResponse.java   # NEW
│   └── CreditsDTO.java           # NEW
├── model/
│   ├── User.java                 # Add vip_status, vip_expire_time
│   ├── Blog.java                 # Already has status field (0=draft, 1=published)
│   ├── Order.java                # Existing
│   └── UserCredits.java          # NEW: balance tracking
├── mapper/
│   ├── UserCreditsMapper.java    # NEW
│   └── UserMapper.java           # Extend for VIP fields
├── messaging/
│   ├── PdfJobProducer.java       # NEW: Queue PDF generation jobs
│   └── PdfJobConsumer.java       # NEW: Process PDF jobs
└── template/
    └── static-site/              # NEW: Thymeleaf templates for HTML generation
        ├── blog-template.html
        └── blocks/
            ├── text-block.html
            ├── image-block.html
            └── ...

frontend/src/
├── pages/
│   ├── Editor/
│   │   └── Editor.tsx            # Add publish button
│   └── Dashboard/
│       └── Dashboard.jsx          # NEW: User's published sites, VIP management
├── components/
│   ├── PublishModal/
│   │   └── PublishModal.jsx      # NEW: Publish confirmation UI
│   ├── VipBanner/
│   │   └── VipBanner.jsx         # NEW: VIP status indicator
│   ├── BalanceDisplay/
│   │   └── BalanceDisplay.jsx    # NEW: Show credits balance
│   └── PdfExport/
│       └── PdfExportButton.jsx   # NEW: PDF export with preview
```

### Pattern 1: Static Site Generation from Blocks

**What:** Convert block editor JSON to static HTML for publishing and PDF

**When to use:** HOST-03 (publishing) and PDF-02 (PDF generation both use same HTML generation)

**Example:**
```java
@Service
@RequiredArgsConstructor
public class StaticSiteService {
    private final TemplateEngine templateEngine;

    public String generateStaticHtml(Blog blog, List<Block> blocks) {
        // Convert blocks JSON to renderable context
        Map<String, Object> context = new HashMap<>();
        context.put("title", blog.getTitle());
        context.put("blocks", blocks);
        context.put("coverImage", blog.getCoverImage());
        context.put("templateId", blog.getTemplateId());

        // Render via Thymeleaf
        Context ctx = new Context();
        ctx.setVariables(context);
        return templateEngine.process("blog-template", ctx);
    }
}
```

### Pattern 2: Async PDF Generation via RabbitMQ

**What:** PDF generation is expensive; run as async job via message queue

**When to use:** PDF-03 (async generation)

**Example:**
```java
// Producer
@Service
@RequiredArgsConstructor
public class PdfJobProducer {
    private final RabbitTemplate rabbitTemplate;

    public String queuePdfGeneration(Long userId, Long blogId) {
        String jobId = UUID.randomUUID().toString();
        PdfJobMessage message = new PdfJobMessage(jobId, userId, blogId);
        rabbitTemplate.convertAndSend("pdf.job.queue", message);
        return jobId;
    }
}

// Consumer
@Component
@RequiredArgsConstructor
public class PdfJobConsumer {
    private final PdfGenerationService pdfService;
    private final UserCreditsService creditsService;

    @RabbitListener(queues = "pdf.job.queue")
    public void processPdfJob(PdfJobMessage message) {
        // Generate PDF
        String pdfUrl = pdfService.generatePdf(message.getBlogId());

        // Deduct credits
        creditsService.deductCredits(message.getUserId(), PDF_COST);

        // Store URL for download (expires 24h)
        pdfService.storeForDownload(message.getJobId(), pdfUrl);
    }
}
```

### Pattern 3: User Balance with Credits

**What:** Track user credits for PDF exports and template purchases

**When to use:** PAY-06, PAY-07

**Example:**
```java
@Service
@RequiredArgsConstructor
public class UserCreditsService {
    private final UserCreditsMapper creditsMapper;

    public void addCredits(Long userId, BigDecimal amount) {
        UserCredits credits = getOrCreate(userId);
        credits.setBalance(credits.getBalance().add(amount));
        creditsMapper.updateById(credits);
    }

    public void deductCredits(Long userId, BigDecimal amount) {
        UserCredits credits = getOrCreate(userId);
        if (credits.getBalance().compareTo(amount) < 0) {
            throw BusinessException.insufficientCredits();
        }
        credits.setBalance(credits.getBalance().subtract(amount));
        creditsMapper.updateById(credits);
    }

    public BigDecimal getBalance(Long userId) {
        return getOrCreate(userId).getBalance();
    }
}
```

### Pattern 4: VIP Subscription Check

**What:** Protect template access based on VIP status or purchased templates

**When to use:** AUTH-03, PAY-02, PAY-03

**Example:**
```java
@Service
@RequiredArgsConstructor
public class VipService {
    private final UserMapper userMapper;
    private final UserTemplatePurchaseMapper purchaseMapper;

    public boolean hasAccessToTemplate(Long userId, String templateId) {
        // Check VIP status
        User user = userMapper.selectById(userId);
        if (user != null && Boolean.TRUE.equals(user.getVipStatus())
                && user.getVipExpireTime().isAfter(LocalDateTime.now())) {
            return true;
        }

        // Check individual template purchase
        return purchaseMapper.exists(
            LambdaQueryWrapper<UserTemplatePurchase>()
                .eq(UserTemplatePurchase::getUserId, userId)
                .eq(UserTemplatePurchase::getTemplateId, templateId)
        );
    }
}
```

### Anti-Patterns to Avoid

- **Generating PDF directly in controller:** PDF generation is CPU-intensive and can block threads. Always use async queue (RabbitMQ).
- **Storing PDF as BLOB in database:** PDF files can be large. Store in file storage (local disk/S3) and return URL.
- **Checking VIP status on every request without caching:** VIP status changes rarely. Cache in Redis with short TTL.
- **Using OpenPDF without Flying Saucer for styled content:** OpenPDF renders text only; no CSS support. All styling would need manual PDF commands.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTML-to-PDF conversion | Build custom PDF layout engine | Flying Saucer | CSS support, automatic page breaks, headers/footers |
| Template rendering | Build string concatenation | Thymeleaf | Security (auto-escaping), includes, conditional logic |
| Balance dedup on concurrent PDF requests | Build custom locking | Redis atomic operations (decrBy) | Prevent double-deduction race conditions |
| VIP expiration checks | Build custom scheduler | Database query with WHERE clause | Simpler, no scheduler needed |

**Key insight:** PDF generation and HTML rendering are solved problems. Flying Saucer + Thymeleaf handles 95% of use cases with far less code than custom solutions.

## Common Pitfalls

### Pitfall 1: PDF CSS Rendering Inconsistencies
**What goes wrong:** PDF looks different from web preview; fonts missing, colors wrong, layout breaks.
**Why it happens:** Flying Saucer uses limited CSS 2.1 support; external fonts need embedding.
**How to avoid:** Use web-safe fonts or embed fonts in PDF; inline critical CSS; test with Flying Saucer's Preview dialog before production.
**Warning signs:** PDF renders but styling looks broken.

### Pitfall 2: Double-Deduction of Credits
**What goes wrong:** User clicks PDF export twice, gets charged twice.
**Why it happens:** Race condition between credit check and deduction without atomic operation.
**How to avoid:** Use Redis DECRBY atomically or SELECT FOR UPDATE in transaction.
**Warning signs:** User reports double charge.

### Pitfall 3: Blog Status Not Distinguishing Published/Draft
**What goes wrong:** Published blogs show in editor as drafts; user can't tell what's live.
**Why it happens:** Blog.status field used inconsistently or not updated on publish.
**How to avoid:** Clear state machine: 0=draft, 1=published, 2=unpublished; update on each action.
**Warning signs:** User confusion about what's actually published.

### Pitfall 4: Subdomain Routing Not Configured in Dev
**What goes wrong:** Publish works locally but subdomain routing fails in production.
**Why it happens:** DNS/wildcard CNAME not set up; reverse proxy not configured.
**How to avoid:** Document wildcard DNS requirement; provide nginx/vercel config example.
**Warning signs:** 404 on username.vibe.com in production.

### Pitfall 5: PDF Preview Consumes Credits
**What goes wrong:** Preview generation deducts credits even if user doesn't confirm.
**Why it happens:** No distinction between preview generation and final generation.
**How to avoid:** Generate preview free; only deduct on explicit user confirmation.
**Warning signs:** User complaints about mysterious credit deductions.

## Code Examples

### Blog Publish/Unpublish (HOST-01, HOST-05)

```java
// In BlogService.java
public Blog publish(Long blogId, Long userId) {
    Blog blog = getBlogById(blogId);
    if (!blog.getUserId().equals(userId)) {
        throw BusinessException.forbidden();
    }
    blog.setStatus(1); // published
    blog.setPublishTime(LocalDateTime.now());
    this.updateById(blog);
    return blog;
}

public Blog unpublish(Long blogId, Long userId) {
    Blog blog = getBlogById(blogId);
    if (!blog.getUserId().equals(userId)) {
        throw BusinessException.forbidden();
    }
    blog.setStatus(2); // unpublished
    this.updateById(blog);
    return blog;
}
```

### VIP Check for Protected Actions (AUTH-03)

```java
// In BlogService or a new AccessControlService
public void validateTemplateAccess(Long userId, String templateId) {
    // Check if template is free
    Template template = templateService.getById(templateId);
    if (template.getPrice().compareTo(BigDecimal.ZERO) == 0) {
        return; // Free template, allow
    }

    // Check VIP or purchase
    if (!vipService.hasAccessToTemplate(userId, templateId)) {
        throw BusinessException.vipRequired();
    }
}
```

### PDF Generation with Flying Saucer

```java
@Service
@RequiredArgsConstructor
public class PdfGenerationService {
    private final StaticSiteService staticSiteService;

    public byte[] generatePdf(Long blogId) {
        Blog blog = blogService.getBlogById(blogId);
        List<Block> blocks = parseBlocks(blog.getBlocks());

        // Generate HTML
        String html = staticSiteService.generateStaticHtml(blog, blocks);

        // Render to PDF
        ITextRenderer renderer = new ITextRenderer();
        renderer.setDocumentFromString(html);
        renderer.layout();

        ByteArrayOutputStream os = new ByteArrayOutputStream();
        renderer.createPDF(os);
        renderer.finishPDF();

        return os.toByteArray();
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|-----------------|--------------|--------|
| OpenPDF raw | Flying Saucer with embedded CSS | Now | Better styled PDFs matching web preview |
| Synchronous PDF generation | RabbitMQ async jobs | Now | Non-blocking UI; handle high load |
| Session-based auth for VIP | JWT-embedded VIP claim + DB verification | Now | Faster VIP checks; can cache in JWT |
| Manual credit tracking | user_credits table with atomic operations | Now | Prevent double-spend; accurate balance |

**Deprecated/outdated:**
- iText 4.x (AGPL): Replaced by OpenPDF (LGPL) or Flying Saucer
- Session storage for user balance: Redis/DB required for distributed systems

## Open Questions

1. **PDF CSS Support Limitations**
   - What we know: Flying Saucer supports CSS 2.1 with limited CSS 3
   - What's unclear: Complex layouts (grid, flexbox) may not render correctly
   - Recommendation: Start with simple layouts; test thoroughly; fallback to image-based PDF for complex cases

2. **File Storage for PDFs**
   - What we know: Need temporary storage with 24h expiration
   - What's unclear: Local disk vs S3 vs OSS cost/availability tradeoffs
   - Recommendation: Use local disk initially with cleanup job; migrate to cloud storage when scale requires

3. **VIP Subscription Billing Cycle**
   - What we know: 10 RMB/month specified in PAY-01
   - What's unclear: How to handle mid-month upgrades/downgrades; proration
   - Recommendation: Implement full-month billing initially; add proration in v2

4. **Template Access for VIP**
   - What we know: VIP should access all templates
   - What's unclear: Should VIP access templates purchased by non-VIP users?
   - Recommendation: VIP grants access to all templates current+future; no retro-active access to past non-VIP purchases

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 + Mockito |
| Config file | backend/src/test/resources/ |
| Quick run command | `mvn test -Dtest=*PdfGenerationService*` |
| Full suite command | `mvn test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|---------------|
| HOST-01 | Publish blog | Unit | `mvn test -Dtest=BlogServiceTest#testPublish` | No |
| HOST-05 | Unpublish blog | Unit | `mvn test -Dtest=BlogServiceTest#testUnpublish` | No |
| PDF-02 | Generate PDF from HTML | Unit | `mvn test -Dtest=PdfGenerationServiceTest#testGeneratePdf` | No |
| PDF-04 | Deduct credits on PDF completion | Unit | `mvn test -Dtest=UserCreditsServiceTest#testDeductOnPdfJob` | No |
| PAY-06 | User balance tracking | Unit | `mvn test -Dtest=UserCreditsServiceTest#testAddAndDeduct` | No |
| PAY-02 | VIP accesses all templates | Unit | `mvn test -Dtest=VipServiceTest#testVipAccessAll` | No |
| AUTH-03 | VIP check on protected action | Integration | `mvn test -Dtest=BlogControllerTest#testVipRequired` | No |

### Sampling Rate
- **Per task commit:** Unit tests for core service methods
- **Per wave merge:** Full test suite
- **Phase gate:** All tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/test/java/com/onepage/service/BlogServiceTest.java` - covers HOST-01, HOST-05
- [ ] `backend/src/test/java/com/onepage/service/PdfGenerationServiceTest.java` - covers PDF-02
- [ ] `backend/src/test/java/com/onepage/service/UserCreditsServiceTest.java` - covers PAY-06, PDF-04
- [ ] `backend/src/test/java/com/onepage/service/VipServiceTest.java` - covers PAY-02, AUTH-03
- [ ] `backend/src/test/java/com/onepage/controller/BlogControllerTest.java` - integration tests
- [ ] Framework install: JUnit 5 already in pom.xml (spring-boot-starter-test)

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- Flying Saucer GitHub: https://github.com/flyingsaucerproject/flyingsaucer
- Thymeleaf Spring Boot: https://www.thymeleaf.org/documentation.html
- Spring Boot AMQP (RabbitMQ): https://docs.spring.io/spring-boot/docs/current/reference/html/messaging.html

### Secondary (MEDIUM confidence)
- WeChat Pay SDK (wxpay-sdk 0.0.3) - existing in pom.xml, documented in codebase
- Existing BlogService, OrderService, PaymentService - analyzed in codebase

### Tertiary (LOW confidence)
- OpenPDF HTML-to-PDF CSS limitations - general knowledge, not formally verified

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Flying Saucer + Thymeleaf is solid choice; version numbers need verification against Maven Central
- Architecture: MEDIUM - Pattern recommendations based on existing codebase conventions; async PDF is standard but implementation details TBD
- Pitfalls: MEDIUM - Common patterns identified; specific warnings may not apply exactly

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days - library versions may change)
