# Architecture Research: Time-Series Analytics & Referral Source Tracking

**Domain:** Website analytics for single-page website builder
**Researched:** 2026-03-22
**Confidence:** MEDIUM (based on established patterns + existing codebase analysis; WebSearch unavailable for verification)

## Executive Summary

This document addresses how to integrate time-series page view charts and referral source tracking into the existing v1.2 analytics infrastructure (Spring Boot + MySQL + Redis). The existing `AnalyticsService` already captures `referer` in `page_views` but does not parse or categorize it. The `blog_daily_stats` table aggregates only total `page_views` and `unique_visitors`, not breakdowns by source.

**Two primary changes needed:**

1. **Referral Source Categorization** - Parse the raw `referer` URL into categories (DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, DIRECT) at insert time and store in `page_views.referer_source`

2. **Time-Series Aggregation** - The existing `dailyStats[]` in `AnalyticsDTO` already provides daily data points; the frontend needs to render this as a line chart. No schema changes required if the existing aggregation is sufficient.

**New Components:**
- `RefererSource` enum with categorization logic
- Scheduled aggregation job to populate `blog_daily_stats` with source breakdowns
- Frontend chart component (recharts library recommended)

**Modified Components:**
- `PageView` entity (add `refererSource` field)
- `AnalyticsService.recordPageView()` (parse referer)
- `AnalyticsDTO` (add `refererSources[]` breakdown)
- `AnalyticsService.getBlogStats()` (include source breakdown)

---

## 1. Integration with Existing Architecture

### Current Data Flow

```
SiteController.servePublishedSite()
    │
    ▼
AnalyticsService.recordPageView() [@Async]
    │
    ├──► Save PageView to page_views table (referer stored as raw URL)
    │
    └──► Add fingerprint to Redis Set (real-time visitor counting)
```

### Target Data Flow (v1.5)

```
SiteController.servePublishedSite()
    │
    ▼
AnalyticsService.recordPageView() [@Async]
    │
    ├──► Parse referer URL -> categorize (DIRECT, GOOGLE, BING, SOCIAL, OTHER)
    │
    ├──► Save PageView to page_views table (referer + refererSource)
    │
    └──► Add fingerprint to Redis Set (real-time visitor counting)
           │
           ▼
    ┌──────────────────────────────────────────┐
    │ Scheduled Aggregation Job (daily at 00:05)│
    │                                           │
    │ Query page_views for yesterday            │
    │ Group by blog_id, referer_source         │
    │ Upsert into blog_daily_stats_source      │
    └──────────────────────────────────────────┘
           │
           ▼
    AnalyticsService.getBlogStats()
    │
    ├──► Return dailyStats[] from blog_daily_stats (existing)
    │
    └──► Return refererSources[] from blog_daily_stats_source (NEW)
```

---

## 2. Component Analysis

### 2.1 New Components

| Component | Package | Responsibility | Approach |
|-----------|---------|----------------|----------|
| `RefererSource` | model/ | Enum for SOURCE_DIRECT, SOURCE_SEARCH_ENGINE, SOURCE_SOCIAL, SOURCE_REFERRAL, SOURCE_OTHER | Simple enum with categorization method |
| `BlogDailySourceStats` | model/ | Entity for daily source breakdown | New table or JSON column in blog_daily_stats |
| `RefererParser` | util/ | Parse referer URL to extract domain and category | Standalone utility class with regex patterns |
| `AnalyticsAggregationJob` | job/ | Scheduled job to aggregate daily stats by source | @Scheduled method using @Async tasks |

### 2.2 Modified Components

| Component | Current State | Change Required |
|-----------|---------------|-----------------|
| `PageView` entity | Has `referer` (VARCHAR) | Add `refererSource` (enum stored as VARCHAR/TINYINT) |
| `BlogDailyStats` entity | Has pageViews, uniqueVisitors | Option A: Add JSON column for source breakdown. Option B: Create new `BlogDailySourceStats` table |
| `AnalyticsService` | recordPageView() parses nothing | Add `parseReferer()` call, categorize and store source |
| `AnalyticsService` | getBlogStats() returns dailyStats | Add source breakdown query and aggregation |
| `AnalyticsDTO` | Has dailyStats[] | Add `refererSources[]` with category counts |
| `SiteController` | Already calls recordPageView() | No change needed - signature unchanged |

### 2.3 Database Schema Changes

**Option A: Add JSON column (simpler)**

```sql
ALTER TABLE `blog_daily_stats` ADD COLUMN `source_breakdown` JSON DEFAULT NULL COMMENT '{"direct":10,"google":5,"bing":2,"social":3,"other":1}';
```

**Option B: Separate table (more flexible, recommended for scale)**

```sql
CREATE TABLE IF NOT EXISTS `blog_daily_source_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blog_id` BIGINT NOT NULL,
    `stat_date` DATE NOT NULL,
    `source` VARCHAR(20) NOT NULL COMMENT 'DIRECT,SEARCH_ENGINE,SOCIAL,REFERRAL,OTHER',
    `page_views` INT DEFAULT 0,
    `unique_visitors` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_blog_date_source` (`blog_id`, `stat_date`, `source`),
    INDEX `idx_blog_id` (`blog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Recommendation:** Option B (separate table) for these reasons:
- Enables per-source trend analysis over time
- Easier to query "what social sources drive traffic?"
- Schema evolution is cleaner
- `blog_daily_stats` remains simple for basic queries

---

## 3. Referer Categorization Logic

### 3.1 Source Categories

| Category | Description | Example Referers |
|----------|-------------|------------------|
| DIRECT | No referer header or direct URL entry | (none), `https://site.com/blog/abc` |
| SEARCH_ENGINE | Google, Bing, Baidu, Yahoo, Yandex | `https://www.google.com/`, `https://www.bing.com/search?q=...` |
| SOCIAL | Social media platforms | `https://twitter.com/...`, `https://www.facebook.com/...`, `https://www.linkedin.com/...`, `https://weibo.com/...` |
| REFERRAL | Other external websites | `https://referrer-site.com/page` |
| OTHER | Unknown or empty | Everything else |

### 3.2 RefererParser Implementation

```java
package com.onepage.util;

import lombok.extern.slf4j.Slf4j;

import java.util.Set;
import java.util.regex.Pattern;

@Slf4j
public class RefererParser {

    private static final Set<String> SEARCH_ENGINE_DOMAINS = Set.of(
        "google.com", "www.google.com", "google.co.uk", "google.cn",
        "bing.com", "www.bing.com",
        "baidu.com", "www.baidu.com",
        "yahoo.com", "www.yahoo.com",
        "yandex.com", "www.yandex.com",
        "sogou.com", "www.sogou.com",
        "so.com", "www.so.com"
    );

    private static final Set<String> SOCIAL_DOMAINS = Set.of(
        "twitter.com", "www.twitter.com", "x.com",
        "facebook.com", "www.facebook.com",
        "instagram.com", "www.instagram.com",
        "linkedin.com", "www.linkedin.com",
        "weibo.com", "www.weibo.com",
        "reddit.com", "www.reddit.com",
        "pinterest.com", "www.pinterest.com",
        "douban.com", "www.douban.com",
        "zhihu.com", "www.zhihu.com"
    );

    private static final Pattern DIRECT_TLD_PATTERN = Pattern.compile(
        ".*\\.(com|org|net|io|co|ai|app|dev)(/|$)"
    );

    public enum Source {
        DIRECT,
        SEARCH_ENGINE,
        SOCIAL,
        REFERRAL,
        OTHER
    }

    public static Source categorize(String referer) {
        if (referer == null || referer.isEmpty()) {
            return Source.DIRECT;
        }

        try {
            String domain = extractDomain(referer);
            if (domain == null) {
                return Source.OTHER;
            }

            String lowerDomain = domain.toLowerCase();

            // Check search engines
            if (SEARCH_ENGINE_DOMAINS.stream().anyMatch(d -> lowerDomain.equals(d) || lowerDomain.endsWith("." + d))) {
                return Source.SEARCH_ENGINE;
            }

            // Check social media
            if (SOCIAL_DOMAINS.stream().anyMatch(d -> lowerDomain.equals(d) || lowerDomain.endsWith("." + d))) {
                return Source.SOCIAL;
            }

            // Check if it's a bare domain (likely direct)
            if (DIRECT_TLD_PATTERN.matcher(domain).matches() && !domain.contains("/")) {
                return Source.DIRECT;
            }

            // Otherwise it's a referral
            return Source.REFERRAL;

        } catch (Exception e) {
            log.warn("Failed to parse referer: {}", referer, e);
            return Source.OTHER;
        }
    }

    private static String extractDomain(String url) {
        // Simple extraction: get host from URL
        // Handles: https://www.example.com/path, http://example.co.uk/page?q=1
        if (url.startsWith("//")) {
            url = "https:" + url;
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "https://" + url;
        }
        try {
            java.net.URL parsed = new java.net.URL(url);
            return parsed.getHost();
        } catch (Exception e) {
            return null;
        }
    }
}
```

### 3.3 Integration in AnalyticsService.recordPageView()

```java
@Async
public void recordPageView(Long blogId, String clientIp, String userAgent, String referer) {
    try {
        String fingerprint = generateFingerprint(clientIp, userAgent);
        LocalDateTime now = LocalDateTime.now();

        // Parse referer to categorize
        RefererParser.Source source = RefererParser.categorize(referer);

        // Save raw page view with source
        PageView pageView = new PageView();
        pageView.setBlogId(blogId);
        pageView.setVisitorFingerprint(fingerprint);
        pageView.setVisitedAt(now);
        pageView.setUserAgent(truncate(userAgent, 500));
        pageView.setReferer(truncate(referer, 500));
        pageView.setRefererSource(source.name()); // NEW: store source category
        pageViewMapper.insert(pageView);

        // ... rest unchanged

    } catch (Exception e) {
        log.error("Failed to record page view for blogId={}", blogId, e);
    }
}
```

---

## 4. Daily Aggregation Job

### 4.1 Design

Run as a `@Scheduled` method at low-traffic time (e.g., 00:05 daily). Query `page_views` for previous day, group by `blog_id` and `referer_source`, upsert into `blog_daily_source_stats`.

**Why scheduled, not on-write?**
- Referer source is relatively static once recorded
- Avoids per-request overhead
- Enables batch optimization
- Simpler rollback on failure

### 4.2 Implementation

```java
package com.onepage.job;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsAggregationJob {

    private final PageViewMapper pageViewMapper;
    private final BlogDailySourceStatsMapper sourceStatsMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String AGGREGATION_LOCK_KEY = "job:analytics_aggregation:lock";

    /**
     * Runs daily at 00:05 to aggregate previous day's page views by source.
     * Uses distributed lock to prevent concurrent execution in clustered部署.
     */
    @Scheduled(cron = "0 5 0 * * ?")
    public void aggregateDailySourceStats() {
        // Acquire distributed lock (5 minute TTL)
        Boolean acquired = redisTemplate.opsForValue()
            .setIfAbsent(AGGREGATION_LOCK_KEY, "locked", 5, TimeUnit.MINUTES);

        if (!Boolean.TRUE.equals(acquired)) {
            log.info("Analytics aggregation job already running on another instance");
            return;
        }

        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            log.info("Starting daily source stats aggregation for date: {}", yesterday);

            // Query page_views grouped by blog_id and referer_source
            List<DailySourceAggregate> aggregates = pageViewMapper
                .aggregateBySource(yesterday);

            // Upsert each aggregate
            for (DailySourceAggregate agg : aggregates) {
                upsertSourceStats(agg);
            }

            log.info("Completed aggregation for {} blog/source combinations", aggregates.size());

        } catch (Exception e) {
            log.error("Failed to run analytics aggregation job", e);
        } finally {
            redisTemplate.delete(AGGREGATION_LOCK_KEY);
        }
    }

    private void upsertSourceStats(DailySourceAggregate agg) {
        // Check if record exists
        BlogDailySourceStats existing = sourceStatsMapper
            .selectOne(new LambdaQueryWrapper<BlogDailySourceStats>()
                .eq(BlogDailySourceStats::getBlogId, agg.getBlogId())
                .eq(BlogDailySourceStats::getStatDate, agg.getStatDate())
                .eq(BlogDailySourceStats::getSource, agg.getSource()));

        if (existing != null) {
            // Update existing
            existing.setPageViews(agg.getPageViews());
            existing.setUniqueVisitors(agg.getUniqueVisitors());
            sourceStatsMapper.updateById(existing);
        } else {
            // Insert new
            BlogDailySourceStats stats = new BlogDailySourceStats();
            stats.setBlogId(agg.getBlogId());
            stats.setStatDate(agg.getStatDate());
            stats.setSource(agg.getSource());
            stats.setPageViews(agg.getPageViews());
            stats.setUniqueVisitors(agg.getUniqueVisitors());
            sourceStatsMapper.insert(stats);
        }
    }
}
```

### 4.3 Mapper Query

```java
@Mapper
public interface PageViewMapper extends BaseMapper<PageView> {

    @Select("""
        SELECT
            blog_id,
            DATE(visited_at) as stat_date,
            referer_source as source,
            COUNT(*) as page_views,
            COUNT(DISTINCT visitor_fingerprint) as unique_visitors
        FROM page_views
        WHERE DATE(visited_at) = #{date}
        GROUP BY blog_id, DATE(visited_at), referer_source
        """)
    List<DailySourceAggregate> aggregateBySource(@Param("date") LocalDate date);
}
```

---

## 5. API Changes

### 5.1 Updated AnalyticsDTO

```java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDTO {

    private Long blogId;
    private String blogTitle;
    private Integer totalPageViews;
    private Integer totalUniqueVisitors;
    private List<DailyStat> dailyStats;
    private List<RefererSourceStat> refererSources;  // NEW

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyStat {
        private String date;
        private Integer pageViews;
        private Integer uniqueVisitors;
    }

    // NEW
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefererSourceStat {
        private String source;          // DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER
        private String displayName;     // "Direct", "Search Engines", "Social Media", "Referrals", "Other"
        private Integer pageViews;
        private Integer percentage;     // 0-100
    }
}
```

### 5.2 Updated getBlogStats()

```java
public AnalyticsDTO getBlogStats(Long blogId, String period) {
    Blog blog = blogService.getById(blogId);
    if (blog == null) {
        return new AnalyticsDTO(blogId, "Unknown", 0, 0, List.of(), List.of());
    }

    int days = parsePeriod(period);
    LocalDate startDate = LocalDate.now().minusDays(days);

    // Get daily stats (existing)
    List<BlogDailyStats> dailyStats = blogDailyStatsMapper
        .selectList(new LambdaQueryWrapper<BlogDailyStats>()
            .eq(BlogDailyStats::getBlogId, blogId)
            .ge(BlogDailyStats::getStatDate, startDate)
            .orderByAsc(BlogDailyStats::getStatDate));

    // Get source breakdown (NEW)
    List<BlogDailySourceStats> sourceStats = sourceStatsMapper
        .selectList(new LambdaQueryWrapper<BlogDailySourceStats>()
            .eq(BlogDailySourceStats::getBlogId, blogId)
            .ge(BlogDailySourceStats::getStatDate, startDate));

    // Aggregate source stats across period
    Map<String, Integer> sourcePageViews = sourceStats.stream()
        .collect(Collectors.groupingBy(
            BlogDailySourceStats::getSource,
            Collectors.summingInt(BlogDailySourceStats::getPageViews)));

    int totalFromSources = sourcePageViews.values().stream().mapToInt(Integer::intValue).sum();

    List<AnalyticsDTO.RefererSourceStat> refererSources = sourcePageViews.entrySet().stream()
        .map(entry -> {
            int views = entry.getValue();
            int percentage = totalFromSources > 0 ? (views * 100) / totalFromSources : 0;
            return new AnalyticsDTO.RefererSourceStat(
                entry.getKey(),
                getDisplayName(entry.getKey()),
                views,
                percentage
            );
        })
        .sorted((a, b) -> b.getPageViews().compareTo(a.getPageViews()))
        .collect(Collectors.toList());

    // ... rest unchanged
}
```

---

## 6. Frontend Changes

### 6.1 Chart Library

**Recommendation:** `recharts` (most popular React charting library)

```bash
npm install recharts
```

**Why recharts:**
- Most popular React charting library (weekly downloads ~5M)
- Composable: LineChart, PieChart, etc.
- Built-in TypeScript types
- Small bundle size (~45KB gzipped)
- Works with existing TailwindCSS styling

**Alternatives considered:**
- `chart.js` + `react-chartjs-2` - More global usage but less React-native
- `visx` - Lower level, more control but more code
- `nivo` - Built on D3, more opinionated

### 6.2 Updated Dashboard Component

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// In AnalyticsDashboard.tsx
// Replace hardcoded table with line chart for dailyStats

<div className="bg-surface rounded-2xl p-6 mb-8">
  <h2 className="text-lg font-semibold mb-4">Page Views Over Time</h2>
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="date"
          stroke="var(--color-text-secondary)"
          fontSize={12}
          tickFormatter={(value) => formatDate(value)}
        />
        <YAxis stroke="var(--color-text-secondary)" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px'
          }}
        />
        <Line
          type="monotone"
          dataKey="pageViews"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</div>
```

### 6.3 Referral Source Display

```typescript
// Pie chart for referral sources
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const SOURCE_COLORS = {
  DIRECT: '#6366F1',          // Primary purple
  SEARCH_ENGINE: '#10B981',   // Green
  SOCIAL: '#F59E0B',          // Amber
  REFERRAL: '#3B82F6',        // Blue
  OTHER: '#6B7280'            // Gray
};

<div className="bg-surface rounded-2xl p-6">
  <h2 className="text-lg font-semibold mb-4">Traffic Sources</h2>
  <div className="h-64 flex items-center">
    <ResponsiveContainer width="50%" height="100%">
      <PieChart>
        <Pie
          data={refererSources}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          dataKey="pageViews"
          nameKey="source"
        >
          {refererSources.map((entry, index) => (
            <Cell key={entry.source} fill={SOURCE_COLORS[entry.source]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
    <div className="w-1/2 space-y-2">
      {refererSources.map((source) => (
        <div key={source.source} className="flex items-center justify-between">
          <span className="text-sm">{source.displayName}</span>
          <span className="text-sm font-mono">
            {source.pageViews.toLocaleString()} ({source.percentage}%)
          </span>
        </div>
      ))}
    </div>
  </div>
</div>
```

---

## 7. Build Order

### Phase A: Backend Data Layer (Foundational)

1. **Add `referer_source` column to `page_views` table**
   - Modify schema.sql

2. **Update `PageView` entity**
   - Add `refererSource` field

3. **Create `RefererParser` utility**
   - Implement source categorization logic

4. **Update `AnalyticsService.recordPageView()`**
   - Call `RefererParser.categorize()` and store result

5. **Create `BlogDailySourceStats` entity and mapper**
   - New table: `blog_daily_source_stats`

6. **Create `AnalyticsAggregationJob`**
   - Scheduled job to aggregate daily source stats

**Dependencies:** Phase 11-01 (existing PageView, BlogDailyStats entities/mappers)

### Phase B: Backend API Layer

7. **Create `RefererSourceStat` DTO class**
   - Add to `AnalyticsDTO`

8. **Update `AnalyticsService.getBlogStats()`**
   - Query and aggregate source stats
   - Return `refererSources[]` in response

9. **Update `AnalyticsController`**
   - No changes needed - response structure handled by DTO

**Dependencies:** Phase A complete

### Phase C: Frontend UI Layer

10. **Install `recharts`**
    - `npm install recharts`

11. **Update `AnalyticsData` interface in api.ts**
    - Add `refererSources[]` type

12. **Update `AnalyticsDashboard.tsx`**
    - Add line chart component for dailyStats
    - Add pie/bar chart for refererSources
    - Maintain existing StatCard and table components

**Dependencies:** Phase B complete

---

## 8. Scaling Considerations

| Scale | Analytics Approach |
|-------|------------------|
| 0-1K daily views/blog | Raw query from page_views acceptable |
| 1K-100K daily views/blog | Use blog_daily_stats aggregation (current design) |
| 100K+ daily views/blog | Consider partitioning page_views by month, Redis sorted sets for real-time |

### Redis for Real-Time Source Counts

For high-traffic blogs, add Redis counters by source:

```java
// In recordPageView()
String sourceKey = String.format("analytics:source:%s:%s:%s",
    blogId, now.toLocalDate(), source.name());
redisTemplate.opsForHyperLogLog().add(sourceKey, fingerprint);
```

Then aggregation job can use Redis for real-time data + DB for historical.

---

## 9. Anti-Patterns to Avoid

### 1. Per-Request Aggregation

**What:** Query and aggregate page_views on every getBlogStats() call.

**Why bad:** Will be slow with large data sets; blocks user request.

**Instead:** Pre-aggregate daily via scheduled job; serve from aggregated tables.

### 2. Storing Raw Referer URLs in Daily Stats

**What:** Store full referer URL string in daily aggregation.

**Why bad:** High cardinality; explode storage; impossible to query meaningfully.

**Instead:** Categorize at insert time; store category enum only.

### 3. Blocking Frontend Charts

**What:** Render chart components synchronously on data load.

**Why bad:** UI freeze if data large; poor UX.

**Instead:** Show skeleton loading state; use responsive chart containers; lazy-load historical data.

---

## 10. Sources

### Primary (HIGH confidence)
- Existing project patterns (AnalyticsService, SiteController, BlogService)
- MyBatis-Plus documentation (BaseMapper, LambdaQueryWrapper)
- Recharts official documentation (recharts.org)

### Secondary (MEDIUM confidence)
- Spring @Scheduled documentation (cron expressions)
- Standard referer categorization patterns from analytics industry
- Redis HyperLogLog for approximate unique counting

### Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Integration Points | HIGH | Based on existing codebase analysis |
| Referer Categorization | MEDIUM | Established patterns, not web-verified |
| Chart Library Choice | MEDIUM | recharts is standard choice; alternatives exist |
| Aggregation Job Design | HIGH | Standard scheduled batch pattern |

**Overall confidence:** MEDIUM

---

*Architecture research for: Vibe Onepage v1.5 Enhanced Analytics - Time-Series Charts and Referral Source Tracking*
*Researched: 2026-03-22*
