# Performance Architecture

## Overview

This document describes the performance optimizations implemented to handle 500 QPS on hot endpoints.

## Async Processing (PERF-05)

Heavy operations (PDF generation, AI generation) are processed asynchronously via RabbitMQ to prevent blocking the main request thread.

### PDF Generation Flow

1. Client calls `POST /api/payment/create` with PDF generation request
2. `PdfJobProducer.queuePdfGeneration()` sends message to `pdf.job.queue`
3. `PdfJobConsumer.processPdfJob()` consumes message asynchronously
4. PDF generated server-side, stored to disk
5. Client polls or receives WebSocket notification when complete

### AI Generation Flow

1. Client calls `POST /api/blog/generate` with image + description
2. `GenerationMessageProducer.sendGenerationRequest()` sends message to `blog.generate.queue`
3. `GenerationMessageConsumer.handleGenerationRequest()` consumes asynchronously
4. AI pipeline stages execute: Image Analysis -> Style Extraction -> Content Generation -> Block Assembly
5. WebSocket notifications sent via `SimpMessagingTemplate`

### Why Async?

- PDF generation can take 5-30 seconds
- AI generation can take 10-60 seconds
- Without async, these would block the HTTP request thread
- At 500 QPS, blocking would exhaust thread pool immediately

## Caching (PERF-02)

### Template Listing

Templates are cached in Redis with 24h TTL using Spring Cache abstraction.

- `GET /api/templates` -> `@Cacheable(value = "templates", key = "'all'")`
- Cache key pattern: `templates::all`, `templates::category:1`, etc.
- TTL: 86400000ms (24 hours)

### Blog Pages

Blogs are cached manually in Redis with 24h TTL.

- `GET /api/blog/share/{shareCode}` -> BlogService.getBlogByShareCode()
- Cache key pattern: `blog:share:{shareCode}`, `blog:{id}`
- TTL: 24 hours

## Connection Pool (PERF-04)

HikariCP is tuned for high concurrency:

- `maximum-pool-size: 50` - handles 50 concurrent DB connections
- `minimum-idle: 10` - maintains 10 idle connections
- `connection-timeout: 30000` - 30s timeout for acquiring connection

Sizing formula: `connections = ((core_count * 2) + effective_spindle_count)`

For MySQL with SSD: 50 connections is appropriate for 500 QPS.

## Database Indexes (PERF-03)

Indexes on frequently queried fields:

- `blogs.user_id` - INDEX `idx_user_id`
- `blogs.share_code` - INDEX `idx_share_code`

These indexes ensure fast lookups even under high load.

## Load Testing

JMeter test plans verify 500 QPS capability:

- `jmeter/blog-share-500qps.jmx` - Tests blog share endpoint
- `jmeter/templates-list-500qps.jmx` - Tests template listing endpoint

Run full test:
```bash
jmeter -n -t jmeter/blog-share-500qps.jmx -l jmeter/results.jtl -e -o jmeter/report
```

Success criteria:
- >99% success rate
- p99 latency < 500ms
- No connection pool exhaustion errors