# Feature Research

**Domain:** Drag-and-Drop Website Builder SaaS (v1.1 Milestone)
**Researched:** 2026-03-21
**Confidence:** MEDIUM (existing codebase analysis + training data patterns)

## Executive Summary

This document focuses on the v1.1 milestone features: completing the AI website generation pipeline, polishing the AI writing assist, finalizing the block editor, completing PDF export, implementing WeChat Pay credit deduction, and enabling platform hosting. The existing codebase has structural foundations for all these features but requires completion of stub implementations and integration of existing components.

## Feature Landscape (v1.1 Focus)

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Existing State | What's Needed |
|---------|--------------|------------|----------------|---------------|
| AI Website Generation | "Upload photo, get website" is the core promise | HIGH | Stub: `AIGenerationService.generate()` returns empty blocks | Complete LangChain pipeline: image analysis, content gen, block assembly |
| AI Writing Assist | Inline AI help without leaving editor context | MEDIUM | Working: `AIWriteModal` with Replace/Append modes | Polish: confidence highlighting, sparkle button visibility |
| Block Editor | Core UX paradigm for editing | MEDIUM | Working: 5 block types, drag-drop, click-to-edit | Polish: configuration panel, block settings persistence |
| PDF Export | Offline sharing capability | MEDIUM | Working: preview and export endpoints, async job queue | Completion: PDF quality validation, 24h link expiration |
| WeChat Pay Credit Deduction | Payment flow for paid features | MEDIUM | Working: `WeChatPayService`, `UserCreditsService` | Completion: callback handling, proper state transitions |
| Subdomain Hosting | Live URL for published sites | MEDIUM | Working: `BlogController.publish()`, static HTML generation | Completion: DNS routing, CDN configuration |

### Differentiators (Competitive Advantage)

Features that set products apart. Not required, but valuable for conversion and retention.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI Generation from Image | "Upload a photo, get a website" is magical and viral | HIGH | MiniMax image analysis + style extraction + content generation chain |
| Per-Block AI Write Assist | Context-aware inline AI without disrupting workflow | MEDIUM | Sparkle button appears on text block hover; Replace/Append modes |
| One-Click Regeneration | Iterate on AI output quickly | LOW | Regenerate button in AIWriteModal; re-calls MiniMax |
| Confidence-Based Highlighting | Visual indicator of AI certainty | LOW | Amber ring on blocks with confidence < 0.7 |
| Async Generation with Progress | Non-blocking UI during 5-30s AI calls | MEDIUM | WebSocket progress updates via `/topic/progress/{blogId}` |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-Time Collaborative Editing | "Work together like Google Docs" | Extreme complexity; locking, conflicts, presence | Single-user editing only for v1 |
| Full Code Export (HTML/CSS/JS) | "I want to own my code" | Removes SaaS lock-in; infrastructure without recurring revenue | Hosting included; code view-only |
| Custom Domain for Free Users | "I want my site on my domain" | Infrastructure cost, SSL management, support burden | Reserve for VIP; subdomain for free |

## Feature Details

### 1. AI Website Generation Pipeline

**Current State:** `AIGenerationService.generate()` builds a prompt, calls MiniMax, but `parseAndAssemble()` returns empty blocks. `GenerationMessageConsumer` orchestrates progress via WebSocket.

**How It Should Work:**

```
[User uploads image + text description]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ 1. Color Extraction (ColorThief client-side)       │
│    - Extract dominant colors as RGB arrays         │
│    - Already exists in frontend                    │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 2. Queue Generation Job (RabbitMQ)                 │
│    - POST /api/blog/generate with image + desc     │
│    - Returns jobId immediately (non-blocking)      │
│    - GenerationMessageProducer sends message       │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 3. Async Generation (GenerationMessageConsumer)    │
│    Stage STARTING (0%) ────────────────────────────│
│    Stage GENERATING (25%) ─ AIGenerationService   │
│    - Build prompt with description + colors        │
│    - Call MiniMax chat model                       │
│    - Parse JSON response                           │
│    Stage ASSEMBLING_BLOCKS (75%) ─ BlockAssembly  │
│    - Create BlockData objects with confidence      │
│    - Persist to blog.blocks JSON field            │
│    Stage COMPLETED (100%) ─────────────────────────│
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ 4. Frontend Progress (WebSocket)                  │
│    - Subscribe to /topic/progress/{blogId}         │
│    - Show progress bar during generation           │
│    - Auto-navigate to editor on COMPLETED          │
└─────────────────────────────────────────────────────┘
```

**Required Completions:**
- `AIGenerationService.parseAndAssemble()`: Parse MiniMax JSON response into structured blocks with confidence scores
- `BlockAssemblyService.assembleBlocks()`: Save assembled blocks to blog, update blog.blocks field
- Frontend: Subscribe to WebSocket progress, show progress UI, handle final state

### 2. AI Writing Assist

**Current State:** `AIWriteModal.tsx` with Replace/Append mode selection. `aiWrite()` calls `/api/ai/write`. `TextBlock.tsx` shows sparkle button on hover with group-hover opacity.

**How It Works:**

```
[User clicks sparkle button on text block]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ AIWriteModal Opens                                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Current Text Preview (read-only)                │ │
│ │ Mode Selection: [Replace] [Append]               │ │
│ │ [Generate] button ──calls──> POST /api/ai/write  │ │
│ └─────────────────────────────────────────────────┘ │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ Backend: AIWriteService.write()                     │
│ - Replace mode: Generate new text based on context  │
│ - Append mode: Generate continuation of existing   │
│ - Returns: String content                          │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ Frontend: Apply Preview                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Generated Preview (highlighted)                 │ │
│ │ [Regenerate] [Apply] [Cancel]                   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Polish Needed:**
- Confidence highlighting: `isLowConfidence = confidence < 0.7` in TextBlock shows amber ring
- Currently confidence is passed but block assembly doesn't populate it
- Sparkle button visibility: Uses `group-hover:opacity-100` - ensure block container has `group` class

### 3. PDF Preview Flow

**Current State:** `PdfController` has `/api/pdf/preview/{blogId}` (free) and `/api/pdf/export/{blogId}` (paid). `PdfJobConsumer` generates PDF, stores it, then deducts credits for non-preview jobs.

**How It Works:**

```
[User clicks "Preview PDF" (free)]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ POST /api/pdf/preview/{blogId}                     │
│ - Verifies blog ownership                           │
│ - Queues job with isPreview=true                   │
│ - Returns jobId immediately                        │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
[User polls GET /api/pdf/status/{jobId}]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ PdfJobConsumer.processPdfJob()                     │
│ - isPreview=true: generatePdfPreview()              │
│ - storeForDownload() with 24h expiration           │
│ - NO credit deduction for preview                   │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
[User clicks "Export PDF" (0.3 credits)]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ POST /api/pdf/export/{blogId}                      │
│ - Check hasEnoughCredits() - throw if insufficient │
│ - Queue job with isPreview=false                  │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ PdfJobConsumer on completion:                      │
│ - generatePdf() - storeForDownload()               │
│ - deductCredits(userId, PDF_COST)                  │
│ - Log transaction                                  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
[User downloads GET /api/pdf/download/{jobId}]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ PdfGenerationService.getStoredPdf()                │
│ - Returns stored PDF bytes                         │
│ - Returns null if expired/missing                  │
└─────────────────────────────────────────────────────┘
```

**Required Completions:**
- PDF quality validation: Ensure fonts, images render correctly
- Expiration enforcement: Redis TTL or explicit cleanup job

### 4. WeChat Pay Credit Deduction Flow

**Current State:** `WeChatPayService.createPrepayOrder()` creates unified order. `UserCreditsService.deductCredits()` subtracts from balance. Payment callback handling is implied but not fully visible.

**How It Works:**

```
[User initiates payment (VIP or template purchase)]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ PaymentService.createOrder()                       │
│ - Create order record with PENDING status          │
│ - Call WeChatPayService.createPrepayOrder()        │
│ - Return qrcodeUrl for QR display                 │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ WeChat Pay QR Code Display                         │
│ - User scans with WeChat app                       │
│ - WeChat processes payment                          │
│ - WeChat sends callback to /api/payment/callback   │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ PaymentCallback handling:                          │
│ - verifyCallback() - validate signature            │
│ - Update order status: PAYING -> PAID             │
│ - addCredits(userId, amount) for purchase         │
│ - For template purchase: deduct credits           │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
[Order complete]
```

**Credit Deduction Pattern (for paid features):**
```java
// In PdfJobConsumer (example of deduction pattern)
if (!message.isPreview()) {
    BigDecimal pdfCost = userCreditsService.getPdfCost();
    if (!userCreditsService.hasEnoughCredits(message.getUserId(), pdfCost)) {
        throw BusinessException.insufficientCredits();
    }
    userCreditsService.deductCredits(message.getUserId(), pdfCost);
}
```

### 5. Subdomain Hosting

**Current State:** `BlogController.publish()` generates static HTML from blocks, sets status=1 (published), stores in `htmlContent`. `getBlogHtml()` serves HTML for shareCode.

**How It Works:**

```
[User clicks Publish]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ POST /api/blog/publish/{id}                        │
│ - BlogService.publish(blogId, userId)              │
│ - Generate static HTML from blocks + template      │
│ - Set blog.status = 1, blog.publishTime = now     │
│ - Invalidate Redis cache                           │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
[Visitor accesses username.vibe.com/shareCode]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ GET /api/blog/share/{shareCode}                    │
│ - Return blog data with blocks                     │
│ - OR: GET /api/blog/html/{shareCode}              │
│ - Return pre-generated htmlContent                 │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
[Browser renders published page]
```

**Required Completions:**
- DNS routing: subdomain.vibe.com -> server
- CDN configuration: Cache-Control headers, asset optimization
- SSL certificate: HTTPS for subdomains

## Feature Dependencies

```
[Image Upload]
    └──feeds──> [AI Generation Pipeline]
                       └──produces──> [Editable Blocks]
                                          └──edited by──> [AI Writing Assist]

[Block Editor]
    └──produces──> [Published HTML]
                       └──exported as──> [PDF]

[Payment]
    └──purchases──> [Credits]
                       └──deducted for──> [PDF Export], [Template Purchase]

[Publish]
    └──creates──> [Public URL]
                       └──accesses via──> [Subdomain Hosting]
```

## MVP Definition (v1.1)

### Launch With (v1.1)

Minimum viable product for v1.1 milestone completion.

- [ ] **Complete AI Generation Pipeline** - Image upload -> MiniMax -> Block assembly -> Editor display
- [ ] **AI Writing Assist Polish** - Replace/Append modes, confidence highlighting, sparkle button
- [ ] **Block Configuration Panel** - Right sidebar for block-level settings
- [ ] **PDF Preview + Export** - Preview free, export charges 0.3 credits, 24h download links
- [ ] **WeChat Pay Credit Flow** - Order creation, callback handling, credit deduction
- [ ] **Publish/Unpublish** - Static HTML generation, status management

### Add After v1.1

Features to add after v1.1 is validated.

- [ ] **Block Animations** - Entrance animations, hover effects
- [ ] **More Templates** - Expand catalog based on usage data
- [ ] **Custom Domain (VIP)** - Own domain for premium users

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Dependencies |
|---------|------------|---------------------|----------|--------------|
| AI Generation Pipeline Completion | HIGH | HIGH | P1 | Image upload exists |
| AI Writing Assist Polish | MEDIUM | MEDIUM | P1 | Basic modal exists |
| Block Configuration Panel | MEDIUM | MEDIUM | P1 | Block editor exists |
| PDF Export Completion | MEDIUM | MEDIUM | P1 | Preview endpoint exists |
| WeChat Pay Credit Deduction | HIGH | MEDIUM | P1 | WeChatPayService exists |
| Subdomain Hosting | HIGH | MEDIUM | P1 | Publish endpoint exists |

## Competitor Feature Analysis

| Feature | Wix ADI | Squarespace AI | Elementor AI | Durable | Our v1.1 |
|---------|---------|---------------|-------------|---------|----------|
| AI Generation from Image | Yes | Limited | Yes | Yes (30s) | Full pipeline |
| AI Writing Assist | Per-section | Limited | Yes | Yes | Per-block inline |
| Replace/Append Modes | No | No | No | No | Yes |
| Confidence Highlighting | No | No | No | No | Yes (amber ring) |
| PDF Export | Premium | No | Via plugin | No | Yes (paid) |
| Subdomain Hosting | Yes | Yes | Self-hosted | Yes | Yes |
| Credit-based Payments | No | No | No | No | Yes (WeChat Pay) |

## Sources

- Existing codebase analysis: `AIService.java`, `AIGenerationService.java`, `BlockAssemblyService.java`, `GenerationMessageConsumer.java`, `AIWriteController.java`, `AIWriteModal.tsx`, `TextBlock.tsx`, `PdfController.java`, `PdfJobConsumer.java`, `WeChatPayService.java`, `UserCreditsService.java`, `BlogController.java`, `BlogService.java`
- Training data patterns for SaaS payment flows and AI generation UX

---

*Feature research for: Drag-and-Drop Website Builder SaaS v1.1 Milestone*
*Researched: 2026-03-21*
