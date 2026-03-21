# Phase 04: Publishing, Payments & PDF - Validation

**Phase:** 04-publishing-payments-pdf
**Created:** 2026-03-21
**Status:** Planning

## Verification Matrix

| Plan | Requirement | Behavior | Test Command | Files |
|------|-------------|----------|--------------|-------|
| 04-01 | HOST-01 | Publish blog sets status=1 | `grep -E "blog.setStatus\(1\)" backend/src/main/java/com/onepage/service/BlogService.java` | BlogService.java |
| 04-01 | HOST-03 | Static HTML generated | `grep -E "generateStaticHtml" backend/src/main/java/com/onepage/service/StaticSiteService.java` | StaticSiteService.java |
| 04-01 | HOST-04 | Shareable link via shareCode | `grep -E "shareCode" backend/src/main/java/com/onepage/controller/BlogController.java` | BlogController.java |
| 04-01 | HOST-05 | Unpublish sets status=2 | `grep -E "blog.setStatus\(2\)" backend/src/main/java/com/onepage/service/BlogService.java` | BlogService.java |
| 04-01 | HOST-06 | DNS routing (infra only) | N/A - infrastructure configuration | N/A |
| 04-02 | PDF-01 | PDF export request | `grep -E "requestPreview\|requestExport" backend/src/main/java/com/onepage/controller/PdfController.java` | PdfController.java |
| 04-02 | PDF-02 | HTML-to-PDF via Flying Saucer | `grep -E "ITextRenderer" backend/src/main/java/com/onepage/service/PdfGenerationService.java` | PdfGenerationService.java |
| 04-02 | PDF-03 | Async via RabbitMQ | `grep -E "RabbitListener\|pdf.job.queue" backend/src/main/java/com/onepage/messaging/PdfJobConsumer.java` | PdfJobConsumer.java |
| 04-02 | PDF-04 | Credits deducted | `grep -E "deductCredits" backend/src/main/java/com/onepage/messaging/PdfJobConsumer.java` | PdfJobConsumer.java |
| 04-02 | PDF-05 | 24h expiration | `grep -E "PDF_EXPIRE_HOURS" backend/src/main/java/com/onepage/service/PdfGenerationService.java` | PdfGenerationService.java |
| 04-02 | PDF-06 | Preview before charge | `grep -E "isPreview" backend/src/main/java/com/onepage/messaging/PdfJobConsumer.java` | PdfJobConsumer.java |
| 04-03 | PAY-01 | VIP subscription | `grep -E "activateVip" backend/src/main/java/com/onepage/service/VipService.java` | VipService.java |
| 04-03 | PAY-02 | VIP access all templates | `grep -E "isVipActive" backend/src/main/java/com/onepage/service/VipService.java` | VipService.java |
| 04-03 | PAY-03 | Individual template purchase | `grep -E "purchaseTemplate" backend/src/main/java/com/onepage/service/TemplatePurchaseService.java` | TemplatePurchaseService.java |
| 04-03 | PAY-04 | WeChat Pay integration | `grep -E "WeChatPayService" backend/src/main/java/com/onepage/service/OrderService.java` | OrderService.java |
| 04-03 | PAY-05 | One-time purchase | `grep -E "hasPurchasedTemplate" backend/src/main/java/com/onepage/service/TemplatePurchaseService.java` | TemplatePurchaseService.java |
| 04-03 | PAY-06 | Balance tracking | `grep -E "getBalance\|deductCredits" backend/src/main/java/com/onepage/service/UserCreditsService.java` | UserCreditsService.java |
| 04-03 | PAY-07 | PDF deduct from balance | `grep -E "deductCredits.*pdfCost" backend/src/main/java/com/onepage/messaging/PdfJobConsumer.java` | PdfJobConsumer.java |
| 04-03 | AUTH-03 | VIP check on protected action | `grep -E "hasAccessToTemplate" backend/src/main/java/com/onepage/service/VipService.java` | VipService.java |

## Build Verification

```bash
# Compile check
cd backend && mvn compile -q

# Run specific tests
mvn test -Dtest=*VipService*
mvn test -Dtest=*PdfGeneration*
mvn test -Dtest=*BlogService*
```

## Manual Verification Steps

### Plan 04-01 (Static Publishing)
1. Create a blog with blocks
2. Call POST /api/blog/publish/{id}
3. Verify blog.status = 1 and blog.htmlContent is populated
4. Call GET /api/blog/html/{shareCode} and verify HTML returned
5. Call POST /api/blog/unpublish/{id}
6. Verify blog.status = 2

### Plan 04-02 (PDF Export)
1. Create/publish a blog
2. Call GET /api/pdf/preview/{blogId}
3. Verify jobId returned
4. Poll GET /api/pdf/status/{jobId} until ready
5. Call GET /api/pdf/download/{jobId}
6. Verify PDF bytes returned
7. Check credits balance before and after POST /api/pdf/export/{blogId}

### Plan 04-03 (Payments/VIP)
1. Call GET /api/payment/vip/status - verify non-VIP response
2. Call POST /api/payment/vip/subscribe - verify order created
3. Simulate payment callback (mark order PAID)
4. Call GET /api/payment/vip/status - verify VIP active
5. Call GET /api/payment/credits/packages - verify packages returned
