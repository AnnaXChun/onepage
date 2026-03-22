# Phase 14: Notification Emails and PDF Delivery - Research

**Researched:** 2026-03-22
**Domain:** Transactional email triggering from RabbitMQ consumers, PDF attachment to emails, time-limited download links
**Confidence:** HIGH (existing infrastructure well-understood)

## Summary

Phase 13 established email infrastructure (SendGrid SMTP, Thymeleaf templates, EmailService). Phase 14 builds on this to send notification emails when AI generation completes (EML-03), when a published site receives its first visitor (EML-04), and to deliver PDFs via email with 24-hour download links (EML-05, EML-06).

**Primary recommendation:** Modify existing `GenerationMessageConsumer` to inject `EmailService` and send completion email. Create a new `FirstVisitorNotificationService` to detect first visitor via Redis. For PDF email delivery, add `addAttachment()` method to `EmailService` using existing `PdfGenerationService.storeForDownload()`.

## Standard Stack

### Core (Already Established from Phase 13)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Spring Boot Starter Mail | 3.2.x | Email sending via SendGrid SMTP | Built-in JavaMail support |
| SendGrid SMTP | - | Transactional email delivery | Per Phase 13 decision D-09 |
| Thymeleaf | 3.x | Email template rendering | Reused from publishing (D-10) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JavaMail MimeMessageHelper | - | Add PDF attachments to email | EML-05, EML-06 |
| RedisTemplate | - | Track first visitor flag per blog | EML-04 |
| RabbitMQ @RabbitListener | - | Trigger emails on async events | EML-03 |

### No New Dependencies Required

All required libraries already exist in the project:
- Spring Mail (`spring-boot-starter-mail`) - already configured
- SendGrid SMTP - already configured in application.yml
- Thymeleaf - already configured for templates
- RabbitMQ - already configured for async jobs
- Flying Saucer (`xhtmlrenderer`) - already in use for PDF generation

## Architecture Patterns

### Pattern 1: Email Triggering from RabbitMQ Consumer

**What:** Inject `EmailService` into existing RabbitMQ consumers and call it after successful job completion.

**When to use:** EML-03 (AI generation completion), EML-04 (first visitor)

**Example for GenerationMessageConsumer:**
```java
// After sendProgress(blogId, "COMPLETED", 100, result);
private void sendCompletionEmail(Long blogId, GenerationResult result) {
    Blog blog = blogService.getBlogById(blogId);
    if (blog == null) return;

    User user = userMapper.selectById(blog.getUserId());
    if (user == null || user.getEmail() == null || !user.getEmailVerified()) return;

    emailService.sendGenerationCompleteEmail(
        user.getEmail(),
        user.getUsername(),
        blog.getTitle(),
        blog.getShareCode()
    );
}
```

**Integration point:** GenerationMessageConsumer.java already sends WebSocket progress updates. Add email trigger after `sendProgress(blogId, "COMPLETED", 100, result)`.

### Pattern 2: First Visitor Detection via Redis

**What:** Use a Redis key to track whether first visitor notification has been sent for a blog.

**When to use:** EML-04

**Implementation:**
```java
private static final String FIRST_VISITOR_SENT_KEY = "notification:first_visitor:";

@Async
public void recordPageView(Long blogId, String clientIp, String userAgent, String referer) {
    // ... existing code ...

    // Check if this is first visitor and notification not yet sent
    String notificationKey = FIRST_VISITOR_SENT_KEY + blogId;
    Boolean alreadyNotified = redisTemplate.hasKey(notificationKey);

    if (!alreadyNotified) {
        // Mark as notified
        redisTemplate.opsForValue().set(notificationKey, true, 7, TimeUnit.DAYS);

        // Send first visitor email
        sendFirstVisitorEmail(blogId);
    }
}
```

**Key insight:** Redis `hasKey` is atomic, preventing race conditions where two visitors could both trigger the notification.

### Pattern 3: PDF Email Delivery with Attachment

**What:** Use MimeMessageHelper.addAttachment() to attach PDF byte array to email.

**When to use:** EML-05, EML-06

**Implementation in EmailService:**
```java
/**
 * Send PDF to user email with 24-hour download link.
 * EML-05, EML-06
 */
public void sendPdfEmail(String to, String username, String siteName,
                        byte[] pdfBytes, String downloadToken, int linkExpiryHours) {
    try {
        String downloadUrl = baseUrl + "/pdf/download/" + downloadToken + "?email=" + to;

        Context context = new Context();
        context.setVariable("username", username);
        context.setVariable("siteName", siteName);
        context.setVariable("downloadUrl", downloadUrl);
        context.setVariable("linkExpiryHours", linkExpiryHours);

        String htmlContent = templateEngine.process("email/pdf-delivery", context);

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromAddress);
        helper.setTo(to);
        helper.setSubject("Your PDF Export - " + siteName);
        helper.setText(htmlContent, true);

        // Attach PDF
        helper.addAttachment(siteName + ".pdf", new ByteArrayResource(pdfBytes));

        mailSender.send(message);
        log.info("PDF email sent to: {}", to);
    } catch (Exception e) {
        log.error("Failed to send PDF email to {}: {}", to, e.getMessage());
        throw e;
    }
}
```

### Anti-Patterns to Avoid

- **Do not send email synchronously in RabbitMQ consumer:** Use @Async or fire-and-forget pattern. Blocking in consumer affects queue throughput.
- **Do not regenerate PDF for email attachment:** Reuse existing PDF bytes from PdfJobConsumer or PdfGenerationService.
- **Do not use hasKey() without atomic set:** Race condition between check and set. Use Redis SETNX or check-and-set atomically.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email sending | Custom SMTP implementation | Spring Mail JavaMailSender | Handles connection pooling, retries, threading |
| PDF generation | New PDF library | Flying Saucer ITextRenderer | Already in use from Phase 8 |
| Download link expiry | Custom token logic | UUID + Redis expiration | UUID already used for verification tokens |
| First visitor detection | Database query per page view | Redis key per blogId | High-frequency operation, Redis is appropriate |

**Key insight:** All required infrastructure exists. Implementation is primarily integration and orchestration.

## Common Pitfalls

### Pitfall 1: Email Not Sent After Generation Completion
**What goes wrong:** Generation completes but user never receives email.
**Why it happens:** Email sending fails silently (caught exception, logged, not rethrown). User has no email or email not verified.
**How to avoid:**
- Add logging when email is sent successfully
- Verify user has valid email before attempting send
- Check emailVerified flag (user must verify email per EML-01)

### Pitfall 2: First Visitor Email Sent Multiple Times
**What goes wrong:** Multiple visitors arrive before Redis SET completes.
**Why it happens:** Non-atomic check-then-set race condition.
**How to avoid:** Use `redisTemplate.opsForSet().add()` with unique visitor fingerprint, then check set size after add. Or use `setIfAbsent()` (SETNX) pattern.

### Pitfall 3: PDF Attachment Memory Issues
**What goes wrong:** Large PDF files cause OutOfMemoryError when loaded into byte array for email.
**Why it happens:** PDFs can be 10+ MB; loading into memory for attachment.
**How to avoid:** Limit PDF size before email (e.g., 20MB max). Existing PDF generation produces reasonable sizes. Consider streaming for very large files.

### Pitfall 4: Download Link Expires Before User Clicks
**What goes wrong:** User receives email but link has already expired (24h from generation).
**Why it happens:** PDF generation and email delivery may have significant time gap.
**How to avoid:** Separate link expiry from PDF file expiry. Link should be valid for 24h from email send, not from PDF generation. Store token with its own expiration.

## Code Examples

### EML-03: Generation Completion Email (in GenerationMessageConsumer)

Source: Based on existing GenerationMessageConsumer pattern + EmailService pattern

```java
// After successful generation in handleGenerationMessage()
private void notifyUserOfCompletion(Long blogId) {
    Blog blog = blogService.getBlogById(blogId);
    if (blog == null) return;

    User user = userMapper.selectById(blog.getUserId());
    if (user == null || user.getEmail() == null || !user.getEmailVerified()) {
        log.info("Skipping completion email for blogId={}: no verified email", blogId);
        return;
    }

    emailService.sendGenerationCompleteEmail(
        user.getEmail(),
        user.getUsername(),
        blog.getTitle(),
        blog.getShareCode()
    );
    log.info("Generation completion email sent for blogId={}", blogId);
}
```

### EML-04: First Visitor Email (in AnalyticsService)

Source: Based on existing AnalyticsService.recordPageView() pattern

```java
@Async
public void recordPageView(Long blogId, String clientIp, String userAgent, String referer) {
    // ... existing recording code ...

    // First visitor notification
    String key = "notification:first_visitor_sent:" + blogId;
    Boolean alreadySent = redisTemplate.hasKey(key);

    if (!alreadySent) {
        // Atomically check and set
        Boolean wasSet = redisTemplate.opsForValue().setIfAbsent(key, true, 7, TimeUnit.DAYS);
        if (wasSet != null && wasSet) {
            sendFirstVisitorEmail(blogId);
        }
    }
}
```

### EML-05/06: PDF Email Delivery

Source: Based on existing EmailService + PdfGenerationService patterns

```java
// New method in EmailService
public void sendPdfDeliveryEmail(String to, String username, String siteName,
                                 byte[] pdfBytes, String downloadToken) {
    String downloadUrl = baseUrl + "/pdf/download-email/" + downloadToken;

    Context context = new Context();
    context.setVariable("username", username);
    context.setVariable("siteName", siteName);
    context.setVariable("downloadUrl", downloadUrl);

    String htmlContent = templateEngine.process("email/pdf-delivery", context);

    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
    helper.setFrom(fromAddress);
    helper.setTo(to);
    helper.setSubject("Your PDF Export - " + siteName);
    helper.setText(htmlContent, true);
    helper.addAttachment(siteName + ".pdf", new ByteArrayResource(pdfBytes));

    mailSender.send(message);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No email notifications | RabbitMQ-triggered emails | Phase 14 | Users get real-time updates |
| PDF only via web download | PDF delivered via email | Phase 14 | Better UX, offline access |
| Manual visitor tracking | Redis-based first visitor detection | Phase 14 | Instant onboarding email |

**Deprecated/outdated:**
- None relevant to this phase.

## Open Questions

1. **EML-04 Scope**: "First visitor" - should this be:
   - First visitor ever (once per blog lifetime)?
   - First visitor after some time threshold?
   - First visitor for newly published blogs only?
   - **Recommendation**: Once per blog lifetime (Redis key persists 7 days, email only sent once per blog)

2. **PDF Size Limit**: Should there be a maximum PDF size for email attachment?
   - **Recommendation**: 20MB limit; larger PDFs rejected with user-friendly error

3. **Download Token Storage**: Should the PDF download token from email have its own expiration?
   - **Current**: PDF file expires in 24h from PdfGenerationService
   - **EML-06 says**: "download link valid for 24 hours"
   - **Recommendation**: Token stored in Redis with 24h TTL, separate from PDF file expiration

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 (existing) |
| Config file | None - standard Spring Boot test |
| Quick run command | `mvn test -Dtest=EmailServiceTest` |
| Full suite command | `mvn test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|---------------|
| EML-03 | Email sent after AI generation completes | Unit | `GenerationMessageConsumerTest.testCompletionEmailSent` | No |
| EML-04 | Email sent when first visitor arrives | Unit | `AnalyticsServiceTest.testFirstVisitorEmail` | No |
| EML-05 | PDF attached to email on request | Unit | `EmailServiceTest.testPdfAttachment` | No |
| EML-06 | Download link valid 24h, includes site name | Unit | `EmailServiceTest.testPdfEmailContent` | No |

### Wave 0 Gaps
- [ ] `backend/src/test/java/com/onepage/service/EmailServiceTest.java` - email sending + attachment tests
- [ ] `backend/src/test/java/com/onepage/messaging/GenerationMessageConsumerTest.java` - completion email tests
- [ ] `backend/src/test/java/com/onepage/service/AnalyticsServiceTest.java` - first visitor email tests
- [ ] `backend/src/test/java/com/onepage/controller/PdfControllerTest.java` - PDF email request endpoint tests

*(If no gaps: "None - existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- `backend/src/main/java/com/onepage/service/EmailService.java` - existing email infrastructure
- `backend/src/main/java/com/onepage/messaging/GenerationMessageConsumer.java` - RabbitMQ consumer pattern
- `backend/src/main/java/com/onepage/service/PdfGenerationService.java` - PDF storage with 24h expiry
- `backend/src/main/java/com/onepage/service/AnalyticsService.java` - visitor tracking with Redis
- `backend/src/main/java/com/onepage/model/User.java` - emailVerified field exists
- `backend/src/main/resources/application.yml` - SendGrid SMTP configuration
- `backend/src/main/resources/templates/email/email-verification.html` - Thymeleaf template pattern

### Secondary (MEDIUM confidence)
- Spring Mail documentation on MimeMessageHelper.addAttachment() - standard JavaMail API
- Thymeleaf email templating - standard pattern from email-verification.html template

### Tertiary (LOW confidence)
- First visitor detection patterns - common Redis pattern, not verified against specific source

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all infrastructure already exists from Phases 8, 11, 13
- Architecture: HIGH - integration patterns well understood from existing code
- Pitfalls: MEDIUM - identified from common patterns, not verified against project-specific issues

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days for stable domain)
