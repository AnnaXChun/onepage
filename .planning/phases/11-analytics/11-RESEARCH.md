# Phase 11: Analytics - Research

**Researched:** 2026-03-22
**Domain:** Website analytics tracking and dashboard display
**Confidence:** HIGH

## Summary

Phase 11 implements visitor tracking and page view analytics for published sites. The approach is a **custom implementation** using MySQL for storage (since it's already in use), with tracking integrated into the existing SiteController, and a new analytics dashboard in the frontend.

**Primary recommendation:** Create a `page_views` table to track each page visit with blog_id, timestamp, and visitor fingerprint. Add tracking logic to SiteController when serving published sites. Create an AnalyticsService to aggregate data by blog, and an AnalyticsController with endpoints for retrieving visitor counts and page views. Display analytics in a new dashboard page or integrate into the user's blog list.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANAL-01 | User can view visitor counts for published site | Database schema design, SiteController modification |
| ANAL-02 | User can view page views per published site | AnalyticsService aggregation logic, API endpoints |
| ANAL-03 | Analytics data displays in user dashboard | Frontend dashboard page, API integration |

## User Constraints (from CONTEXT.md)

### Locked Decisions
None - all decisions are in Claude's discretion for this phase.

### Claude's Discretion
- Analytics implementation approach (custom vs third-party)
- Dashboard UI design and layout
- Metric granularity (daily/weekly/monthly views)

### Deferred Ideas (OUT OF SCOPE)
- Real-time analytics (latency not critical for this phase)
- Geographic/demographic breakdown (future enhancement)
- Custom events tracking (only page views for v1.2)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| MySQL 8 | 8.x | Analytics data storage | Already in use; simple aggregation queries sufficient |
| Redis | 6.x | Caching aggregated analytics | Already in use; cache daily/weekly aggregates |

### No New Dependencies Required
This phase uses existing infrastructure only - no new npm packages or Maven dependencies needed.

**Rationale:** Third-party analytics (Plausible, Umami, Matomo) require additional infrastructure:
- **Umami**: Requires PostgreSQL (not in use)
- **Plausible**: Requires ClickHouse or PostgreSQL (not in use)
- **Matomo**: Requires PHP (not in use)

A custom implementation is the lowest-cost approach that meets requirements.

## Architecture Patterns

### Recommended Project Structure

```
backend/src/main/java/com/onepage/
├── model/
│   └── PageView.java          # Analytics entity
├── mapper/
│   └── PageViewMapper.java     # MyBatis-Plus mapper
├── service/
│   └── AnalyticsService.java    # Analytics business logic
├── controller/
│   └── AnalyticsController.java # REST API endpoints
└── dto/
    └── AnalyticsDTO.java       # Response data transfer object

frontend/src/
├── pages/
│   └── Analytics/
│       └── AnalyticsDashboard.tsx  # New dashboard page
├── services/
│   └── analyticsApi.ts         # API client functions
└── components/
    └── common/
        └── StatCard.tsx        # Reusable metric display
```

### Pattern 1: Event Tracking on Page Serve

**What:** Record a page view each time a published blog is served via SiteController.

**When to use:** When a visitor accesses a user's published site via subdomain.

**Implementation approach:**
```java
// In SiteController.servePublishedSite() - after retrieving blog
public void servePublishedSite(@PathVariable String username, HttpServletResponse response) {
    try {
        Blog blog = siteService.getPublishedBlogByUsername(username);
        // NEW: Record page view asynchronously (non-blocking)
        analyticsService.recordPageView(blog.getId(), request);
        // ... rest of existing code
    }
}
```

**Key insight:** Tracking happens at the read/serve point, not on every page load in the browser. This avoids:
- CORS issues with external tracking services
- Browser ad blockers interfering with tracking scripts
- Extra JavaScript payload for users

### Pattern 2: Daily Aggregation with Redis Cache

**What:** Pre-aggregate daily page view counts and cache in Redis.

**When to use:** When reading analytics data for dashboard display.

**Why:** Aggregating raw page view counts on every dashboard load is expensive. Daily/hourly aggregates in Redis provide O(1) reads.

**Implementation:**
- On page view record: Increment Redis counter `analytics:pageviews:{blogId}:{date}`
- On dashboard load: Sum cached values + today's raw count from DB
- Background job: Periodically flush Redis counters to MySQL aggregates

### Pattern 3: Visitor Deduplication via Fingerprint

**What:** Track unique visitors using IP + User-Agent hash.

**When to use:** For unique visitor counts (vs page views).

**Implementation:**
- Store `visitor_fingerprint` (SHA-256 of IP + User-Agent) in page_views table
- Count DISTINCT fingerprints per blog per time period for unique visitors
- Store daily unique visitor count in aggregated table for fast queries

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time aggregation | Raw SQL GROUP BY on every dashboard load | Redis sorted sets with daily keys | Raw queries don't scale with high traffic |
| Third-party tracking script | Browser-based tracking with external service | Server-side tracking in SiteController | Avoids ad blockers, CORS, privacy concerns |
| Full analytics platform | Matomo/Plausible/Umami | Custom MySQL-based solution | These require PostgreSQL/PHP/ClickHouse we don't have |

**Key insight:** For simple visitor counts and page views, a properly indexed MySQL table with Redis caching is sufficient. Full analytics platforms add complexity that doesn't benefit this use case.

## Common Pitfalls

### Pitfall 1: Tracking Every Page Load as New Visit
**What goes wrong:** Refreshing a page increments count artificially; bots/crawlers inflate numbers.

**Why it happens:** Naive implementation records every GET request.

**How to avoid:**
- Use fingerprint-based unique visitor tracking, not request count
- Implement basic bot filtering (known bot user agents)
- Consider session-based tracking (same visitor within 30 min = 1 visit)

**Warning signs:** Dashboard shows impossibly high page views for new sites.

### Pitfall 2: Slow Dashboard Due to Full Table Scans
**What goes wrong:** Dashboard takes 10+ seconds to load for blogs with 100k+ views.

**Why it happens:** Aggregating millions of raw page_view rows without indexes.

**How to avoid:**
- Create indexed aggregated table: `blog_daily_stats (blog_id, date, page_views, unique_visitors)`
- Update aggregates via background job, not on every insert
- Use Redis for hot/cached aggregates

**Warning signs:** Query times increase as site traffic grows.

### Pitfall 3: Forgetting to Track on Subdomain Access
**What goes wrong:** Only tracking direct /blog/share/{code} access, not subdomain visits.

**Why it happens:** SiteController serves via /host/{username}, not /blog/share/{code}.

**How to avoid:** Ensure tracking is in SiteController.servePublishedSite(), not just BlogController.

**Warning signs:** Analytics shows zero views for published sites despite known traffic.

## Code Examples

### Database Schema for Analytics

```sql
-- Page views raw data (partitioned by month in production)
CREATE TABLE IF NOT EXISTS `page_views` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blog_id` BIGINT NOT NULL,
    `visitor_fingerprint` VARCHAR(64) NOT NULL COMMENT 'SHA-256 hash of IP + User-Agent',
    `visited_at` DATETIME NOT NULL,
    `referer` VARCHAR(500),
    `user_agent` VARCHAR(500),
    `country` VARCHAR(50),
    `city` VARCHAR(100),
    `device_type` VARCHAR(20) COMMENT 'desktop,mobile,tablet',
    PRIMARY KEY (`id`),
    INDEX `idx_blog_visited` (`blog_id`, `visited_at`),
    INDEX `idx_visitor_fingerprint` (`visitor_fingerprint`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Daily aggregation table (populated by background job)
CREATE TABLE IF NOT EXISTS `blog_daily_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blog_id` BIGINT NOT NULL,
    `stat_date` DATE NOT NULL,
    `page_views` INT DEFAULT 0,
    `unique_visitors` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_blog_date` (`blog_id`, `stat_date`),
    INDEX `idx_blog_id` (`blog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### AnalyticsService Pattern

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final PageViewMapper pageViewMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String PAGEVIEW_REDIS_KEY = "analytics:pv:";
    private static final String VISITOR_REDIS_KEY = "analytics:uv:";

    /**
     * Record a page view - called from SiteController.
     * Non-blocking via async execution.
     */
    @Async
    public void recordPageView(Long blogId, HttpServletRequest request) {
        String fingerprint = generateFingerprint(request);
        LocalDateTime now = LocalDateTime.now();

        // Save raw view
        PageView pageView = new PageView();
        pageView.setBlogId(blogId);
        pageView.setVisitorFingerprint(fingerprint);
        pageView.setVisitedAt(now);
        pageView.setUserAgent(truncate(request.getHeader("User-Agent"), 500));
        pageView.setReferer(truncate(request.getHeader("Referer"), 500));
        pageViewMapper.insert(pageView);

        // Increment Redis counters (for real-time display)
        String dateKey = now.toLocalDate().toString();
        redisTemplate.opsForSet().add(PAGEVIEW_REDIS_KEY + blogId + ":" + dateKey, fingerprint);
    }

    /**
     * Get page view stats for a blog.
     */
    public AnalyticsDTO getBlogStats(Long blogId, String period) {
        // period: "7d", "30d", "90d"
        LocalDate startDate = LocalDate.now().minusDays(parsePeriod(period));

        // Get from daily stats table
        List<BlogDailyStats> dailyStats = blogDailyStatsMapper
            .selectList(Wrappers.<BlogDailyStats>lambdaQuery()
                .eq(BlogDailyStats::getBlogId, blogId)
                .ge(BlogDailyStats::getStatDate, startDate)
                .orderByAsc(BlogDailyStats::getStatDate));

        // Sum page views and unique visitors
        int totalPageViews = dailyStats.stream().mapToInt(BlogDailyStats::getPageViews).sum();
        int totalUniqueVisitors = dailyStats.stream().mapToInt(BlogDailyStats::getUniqueVisitors).sum();

        return new AnalyticsDTO(totalPageViews, totalUniqueVisitors, dailyStats);
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No analytics | Custom MySQL tracking | Phase 11 | Users can see traffic for first time |
| External scripts (GA) | Server-side tracking | Phase 11 | Privacy-friendly, no browser overhead |

**Deprecated/outdated:**
- Google Analytics Universal (2013-2023): Replaced by GA4; too heavy for simple page view needs
- Localytics/Flurry: Acquired and deprecated
- Simple hit counters: Don't scale, easily faked

## Open Questions

1. **Should we track page views for unpublished/draft blogs?**
   - What we know: SiteController only serves published blogs (status=1)
   - What's unclear: Do users want to preview analytics before publishing?
   - Recommendation: No - only track published sites. Draft previews shouldn't count.

2. **How to handle authenticated vs anonymous visitors?**
   - What we know: SiteController serves public content without auth
   - What's unclear: Should logged-in users be tracked differently?
   - Recommendation: No distinction for v1.2 - anonymous tracking only.

3. **Data retention policy?**
   - What we know: MySQL storage is finite
   - What's unclear: How long to keep raw page view data?
   - Recommendation: Keep raw data 90 days, aggregate to daily stats indefinitely, purge raw data older than 90 days via scheduled job.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 (existing in project) |
| Config file | None — standard Spring Boot test |
| Quick run command | `./mvnw test -Dtest=AnalyticsServiceTest -x` |
| Full suite command | `./mvnw test -x` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANAL-01 | Visitor counts display correctly | unit | `AnalyticsServiceTest.getBlogStats_returnsVisitorCount` | NO |
| ANAL-02 | Page views aggregate correctly | unit | `AnalyticsServiceTest.getBlogStats_returnsPageViews` | NO |
| ANAL-03 | Dashboard displays data | integration | `AnalyticsControllerTest.getStats_returnsCorrectData` | NO |

### Sampling Rate
- **Per task commit:** Run affected unit tests only
- **Per wave merge:** Full suite (`./mvnw test -x`)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/test/java/com/onepage/service/AnalyticsServiceTest.java` — unit tests for ANAL-01, ANAL-02
- [ ] `backend/src/test/java/com/onepage/controller/AnalyticsControllerTest.java` — integration tests for ANAL-03
- [ ] `backend/src/main/java/com/onepage/mapper/PageViewMapper.java` — MyBatis-Plus mapper (new file)
- [ ] `backend/src/main/java/com/onepage/model/PageView.java` — entity (new file)

## Sources

### Primary (HIGH confidence)
- Project existing code patterns (SiteController, BlogService, BlogController)
- MySQL 8 documentation — indexing strategies for time-series data
- Redis documentation — sorted sets for real-time aggregation

### Secondary (MEDIUM confidence)
- WebFetch: Umami Analytics environment variables — confirmed PostgreSQL requirement
- WebFetch: Plausible Analytics self-hosting — confirmed ClickHouse/PostgreSQL requirement

### Tertiary (LOW confidence)
- General analytics implementation patterns from training data — validated against project constraints

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — using existing MySQL/Redis, no new dependencies
- Architecture: HIGH — follows existing project patterns (Controller-Service-Mapper)
- Pitfalls: MEDIUM — based on common analytics implementation mistakes

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days — analytics patterns are stable)
