# Phase 5: Polish & Performance - Research

**Researched:** 2026-03-21
**Domain:** Spring Boot performance optimization, Redis caching, HikariCP tuning, RabbitMQ async processing, JMeter load testing
**Confidence:** HIGH

## Summary

Phase 5 focuses on achieving 500 QPS on hot endpoints (template listing, blog view) through Redis caching, HikariCP connection pool tuning, and verifying with JMeter. The codebase already has significant infrastructure: BlogService has manual Redis caching for blogs (24h TTL), RabbitMQ is configured with queues for PDF and AI generation, and database indexes exist on hot query fields (userId, shareCode). The main gaps are: (1) template listing lacks caching and no TemplateService/Controller exists to serve it, (2) HikariCP pool is undersized at max-active=8, (3) no template listing endpoint is exposed via API.

**Primary recommendation:** Create TemplateService with @Cacheable for 24h TTL, tune HikariCP to 50 max-active connections, and verify 500 QPS with JMeter against existing blog-share endpoint which already has caching.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERF-01 | Hot endpoints handle 500 QPS | BlogService already caches by ID and shareCode. JMeter test plan needed to verify. |
| PERF-02 | Redis caching for template listing (24h TTL) | No template caching exists. Need TemplateService with @Cacheable. BlogService uses manual redisTemplate.opsForValue() pattern - can follow same approach. |
| PERF-03 | Database indexes on userId, shareCode | Already implemented in schema.sql (lines 32-33). Indexes exist on idx_user_id and idx_share_code. |
| PERF-04 | HikariCP tuned for high concurrency | Current max-active=8 is insufficient. Recommended: 50-100 for 500 QPS. |
| PERF-05 | RabbitMQ for PDF and AI async processing | Already implemented: PdfJobProducer/Consumer and GenerationMessageProducer/Consumer exist. No changes needed. |

## Current State Analysis

### What Already Exists

| Component | Status | Details |
|-----------|--------|---------|
| Blog caching | Implemented | BlogService lines 243-250 cache with 24h TTL |
| Blog share code caching | Implemented | BlogService lines 205-214 cache by shareCode |
| Database indexes | Implemented | schema.sql lines 32-33: idx_user_id, idx_share_code |
| RabbitMQ PDF async | Implemented | PdfJobProducer.java, PdfJobConsumer.java with queue "pdf.job.queue" |
| RabbitMQ AI async | Implemented | GenerationMessageProducer.java, GenerationMessageConsumer.java with queue "blog.generate.queue" |
| Redis configuration | Implemented | RedisConfig.java with Jackson2JsonRedisSerializer |

### What Needs to Be Built

| Component | Gap | Priority |
|-----------|-----|----------|
| TemplateService | No service layer for template queries | HIGH |
| Template caching | No @Cacheable on template listing | HIGH |
| HikariCP tuning | max-active=8 too low for 500 QPS | HIGH |
| TemplateController | No REST endpoint to list/cache templates | HIGH |
| JMeter test plan | No load testing verification | HIGH |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Spring Boot | 3.2.0 | Application framework | Already in use |
| Spring Data Redis | Included with Spring Boot | Redis caching abstraction | Standard for @Cacheable |
| HikariCP | Included with Spring Boot | Connection pooling | Default pool for Spring Boot |
| RabbitTemplate | spring-boot-starter-amqp | Async messaging | Already configured |
| MySQL | 8 | Database | Already in use |
| Redis | 6+ | Caching | Already configured |

### Dependencies for Load Testing

| Library | Purpose | When to Use |
|---------|---------|-------------|
| JMeter | Load testing 500 QPS | PERF-01 verification |

**No new dependencies required** - all needed libraries are already in the classpath.

## Architecture Patterns

### Recommended Project Structure

```
backend/src/main/java/com/onepage/
├── service/
│   └── TemplateService.java     # NEW: cacheable template queries
├── controller/
│   └── TemplateController.java # NEW: template listing endpoint
```

### Pattern 1: Spring Cache Abstraction with Redis

**What:** Use `@Cacheable` annotation on service methods for declarative caching.

**When to use:** Template listing, any read-heavy data that rarely changes.

**Example:**
```java
@Service
public class TemplateService {

    @Cacheable(value = "templates", key = "'list:' + #category", unless = "#result == null || #result.isEmpty()")
    public List<Template> getTemplates(Integer category) {
        // Query database
    }

    @Cacheable(value = "templates", key = "'item:' + #id")
    public Template getTemplateById(Long id) {
        // Query database
    }
}
```

**Configuration (application.yml):**
```yaml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 86400000  # 24h in milliseconds
      cache-null-values: false
```

**Source:** Spring Boot documentation - Caching section

### Pattern 2: HikariCP High-Concurrency Tuning

**What:** Tune connection pool for 500 QPS target.

**Current settings (application.yml line 27-31):**
```yaml
lettuce:
  pool:
    max-active: 8      # TOO LOW
    max-idle: 8
    min-idle: 0
    max-wait: -1ms
```

**Recommended for 500 QPS:**
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      pool-name: OnepageHikariCP
```

**Sizing formula:** `connections = ((core_count * 2) + effective_spindle_count)` for optimal throughput.

**For MySQL with good SSD:** Start with 50, tune based on JMeter results.

**Source:** HikariCP documentation - About Pool Sizing

### Pattern 3: Manual Redis Caching (Already in BlogService)

**What:** Use `RedisTemplate` directly for explicit cache control.

**Already implemented in BlogService (lines 243-250):**
```java
private void cacheBlog(Blog blog) {
    redisTemplate.opsForValue().set(
        BLOG_CACHE_PREFIX + blog.getId(),
        blog,
        CACHE_EXPIRE_HOURS,
        TimeUnit.HOURS
    );
}
```

**Cache invalidation pattern (BlogService line 168):**
```java
redisTemplate.delete(BLOG_CACHE_PREFIX + id);
```

**Use when:** Need fine-grained cache control, conditional caching (unless), or complex invalidation logic.

### Pattern 4: RabbitMQ Async Processing (Already Implemented)

**What:** PDF and AI generation run asynchronously via message queues.

**PDF Flow:**
1. `PdfJobProducer.queuePdfGeneration()` sends message to `pdf.job.queue`
2. `PdfJobConsumer.processPdfJob()` consumes and processes
3. PDF stored to disk, URL returned to client

**AI Generation Flow:**
1. `GenerationMessageProducer` sends message to `blog.generate.queue`
2. `GenerationMessageConsumer.handleGenerationRequest()` processes
3. WebSocket notifications sent via `SimpMessagingTemplate`

**Already implemented - no changes needed for PERF-05.**

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| Template caching | Custom cache implementation | Spring Cache `@Cacheable` | Simpler, declarative, cache eviction automatic |
| Connection pooling | Custom connection management | HikariCP | Battle-tested, Spring Boot default |
| Async PDF generation | ThreadPoolExecutor | RabbitMQ | Already configured, handles retries, distributed |

**Key insight:** The codebase already has excellent foundations. Focus on tuning and wiring existing components.

## Common Pitfalls

### Pitfall 1: HikariCP Undersized Pool

**What goes wrong:** Requests queue waiting for database connections, latency spikes.

**Why it happens:** max-active=8 can only handle ~8 concurrent DB operations. At 500 QPS, requests will block.

**How to avoid:** Increase maximum-pool-size to 50+. Monitor with `HikariPool` metrics.

**Warning signs:** `Timeout waiting for connection from pool`, `Connection pool exhausted`

### Pitfall 2: Cache Stampede

**What goes wrong:** After cache expires, many simultaneous requests all hit the database.

**Why it happens:** Popular template listing has thousands of users; cache TTL=24h means mass expiration at midnight.

**How to avoid:** Use `spring.cache.redis.time-to-live: 86400000` with random jitter, or implement cache-aside with distributed lock.

**Example with jitter:**
```java
@Cacheable(value = "templates", key = "'list:' + #category)
public List<Template> getTemplates(Integer category) {
    // Add small random delay to prevent stampede
    Thread.sleep((long) (Math.random() * 100));
    return templateMapper.selectList(...);
}
```

### Pitfall 3: Missing Index on share_code Query

**What goes wrong:** Blog share view (`/blog/share/{shareCode}`) uses full table scan.

**Why it happens:** The share_code column has an index, but queries filtering by share_code need to ensure index is used.

**How to avoid:** Already implemented in schema.sql. Verify with `EXPLAIN` on queries.

### Pitfall 4: Redis Serialization Mismatch

**What goes wrong:** Cached objects don't deserialize correctly.

**Why it happens:** `LaissezFaireSubTypeValidator` in RedisConfig allows any type, but model changes break compatibility.

**How to avoid:** Use versioned cache keys: `blog:v2:{id}`

## Code Examples

### Adding Template Caching to TemplateService

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class TemplateService extends ServiceImpl<TemplateMapper, Template> {

    private static final String TEMPLATE_CACHE_PREFIX = "template:";

    /**
     * Get all templates with caching (24h TTL).
     * PERF-02
     */
    @Cacheable(value = "templates", key = "'all'")
    public List<Template> getAllTemplates() {
        log.info("Fetching templates from database (cache miss)");
        return this.lambdaQuery()
            .eq(Template::getStatus, 1)  // Only active templates
            .orderByDesc(Template::getCreateTime)
            .list();
    }

    /**
     * Get templates by category with caching.
     */
    @Cacheable(value = "templates", key = "'category:' + #category")
    public List<Template> getTemplatesByCategory(Integer category) {
        return this.lambdaQuery()
            .eq(Template::getStatus, 1)
            .eq(Template::getCategory, category)
            .orderByDesc(Template::getCreateTime)
            .list();
    }

    /**
     * Get template by ID with caching.
     */
    @Cacheable(value = "templates", key = "'id:' + #id")
    public Template getTemplateById(Long id) {
        return this.getById(id);
    }

    /**
     * Evict all template cache (when admin updates templates).
     */
    @CacheEvict(value = "templates", allEntries = true)
    public void evictAllCache() {
        log.info("Evicting all template cache");
    }
}
```

### HikariCP Configuration in application.yml

```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:onepage}?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      pool-name: OnepageHikariCP
      # MySQL-specific optimizations
      connection-test-query: SELECT 1
      validation-timeout: 5000
```

### JMeter Test Plan Configuration

For verifying 500 QPS on hot endpoints:

**Thread Group:**
- Number of threads: 100
- Ramp-up period: 10s
- Loop count: Forever
- Duration: 5 minutes

**HTTP Request - Blog Share:**
- Path: `/api/blog/share/{shareCode}`
- Method: GET

**Throughput Shaping Timer:**
- RPS: 500 (5 requests per thread per second to achieve 500 QPS total)

**Summary Report:**
- Log/View Results Tree disabled for performance
- Aggregate Report enabled

## Open Questions

1. **Template data source**
   - What we know: Templates table exists with 3 default templates inserted
   - What's unclear: Are templates static (from DB) or loaded from external source?
   - Recommendation: Use Database with Spring Cache for 24h TTL

2. **JMeter infrastructure**
   - What we know: Need to verify 500 QPS
   - What's unclear: Is JMeter installed in CI/CD pipeline?
   - Recommendation: Add JMeter as project dependency for repeatable testing

3. **Current QPS baseline**
   - What we know: Target is 500 QPS
   - What's unclear: What is the current baseline QPS?
   - Recommendation: Run JMeter baseline test before optimization

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | JMeter 5.6+ |
| Config file | `jmeter/load-test.jmx` |
| Quick run command | `jmeter -n -t jmeter/load-test.jmx -l results.jtl` |
| Full suite command | `jmeter -n -t jmeter/load-test.jmx -f -l results.jtl -e -o report` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| PERF-01 | 500 QPS on hot endpoints | load | `jmeter -n -t jmeter/blog-share-500qps.jmx` | No |
| PERF-02 | Template cache 24h TTL | unit | Verify cache key in Redis after call | No |
| PERF-03 | Indexes on userId, shareCode | manual | `SHOW INDEX FROM blogs` | Yes (schema.sql) |
| PERF-04 | HikariCP pool size 50+ | config | Check application.yml | Yes (needs update) |
| PERF-05 | RabbitMQ async processing | unit | Message sent to queue, consumer processes | Yes (PdfJobConsumer) |

### Sampling Rate
- **Per task commit:** Quick smoke test (100 requests)
- **Per wave merge:** Full 5-minute load test at 500 QPS
- **Phase gate:** JMeter summary shows >99% success rate at 500 QPS

### Wave 0 Gaps
- [ ] `jmeter/blog-share-500qps.jmx` - JMeter test plan for 500 QPS
- [ ] `jmeter/templates-500qps.jmx` - JMeter test plan for template listing
- [ ] Framework install: `brew install jmeter` (macOS) or download from apache.org

## Sources

### Primary (HIGH confidence)
- Spring Boot 3.2 Documentation - Caching: https://docs.spring.io/spring-boot/docs/3.2.x/reference/html/io.html#io.caching
- HikariCP Documentation - About Pool Sizing: https://github.com/brettwooldridge/HikariCP
- Existing codebase: BlogService.java, RedisConfig.java, RabbitMQConfig.java, schema.sql

### Secondary (MEDIUM confidence)
- MySQL 8 Performance Best Practices (general knowledge)
- Redis Caching Patterns (general knowledge)

### Tertiary (LOW confidence)
- JMeter 2025 specific versions (marked for validation)

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - All needed libraries already in classpath
- Architecture: HIGH - Clear patterns from existing codebase
- Pitfalls: HIGH - Known issues with HikariCP undersizing

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days for stable technology)
