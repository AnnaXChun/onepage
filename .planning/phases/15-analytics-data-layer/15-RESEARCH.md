# Phase 15: Analytics Data Layer - Research

**Researched:** 2026-03-22
**Domain:** Website analytics referral source categorization and storage
**Confidence:** HIGH

## Summary

Phase 15 implements the data foundation for enhanced analytics (v1.5). The existing `AnalyticsService.recordPageView()` already captures the raw `referer` header but does not categorize it. Phase 15 adds a `RefererParser` utility to classify referer URLs into standard categories (Direct, Search Engine, Social, Referral, Other), modifies the `PageView` entity to store the categorized source, and creates the `BlogDailySourceStats` entity and mapper for daily source aggregation.

This phase does NOT expose any new API endpoints or modify the frontend. It purely establishes the data layer that Phase 16 (API Layer) will consume.

**Primary recommendation:** Use the enum-based `RefererParser` approach already designed in STATE.md decisions (D02), add `referer_source` column to `page_views` table, and create `blog_daily_source_stats` table for pre-aggregation.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **15-01-D02**: ReferralParser enum-based categorization (Direct, Search Engine, Social, Referral, Other)
- **15-01-D03**: Pre-aggregation via scheduled job (AnalyticsAggregationJob) to avoid per-page-view dashboard queries
- **15-01-D04**: UTC storage for timestamps, conversion at display time for timezone handling
- **15-01-D05**: Data downsampling for large datasets (>30 points) to prevent chart rendering issues

### Claude's Discretion
- Exact domain lists for search engines and social platforms (can extend as needed)
- Table vs JSON column approach for `blog_daily_source_stats`

### Deferred Ideas (OUT OF SCOPE)
- UTM parameter parsing (Phase 2 complexity)
- Traffic spike alerts (EmailService exists but not in scope)
- Geographic breakdown (requires IP geolocation)
- Device/browser breakdown (requires UA parsing library)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANLT-01 | User can view page view trends over time displayed as a line chart with 7/30/90 day range selection | RefererParser + BlogDailySourceStats enable source tracking that feeds into time-series API (Phase 16) |
| ANLT-02 | User can see referral sources grouped and counted (Google, Bing, direct, social) | RefererParser categorizes sources; BlogDailySourceStats stores daily counts per source for API response (Phase 16) |

## Standard Stack

### Core (No New Dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Java 17 | 17 | Backend language | Project default |
| Spring Boot 3.2.0 | 3.2.0 | Application framework | Existing stack |
| MyBatis-Plus 3.5.5 | 3.5.5 | Database ORM | Existing stack |

### No New Backend Dependencies
This phase uses only existing infrastructure:
- No new Maven dependencies
- No new npm dependencies
- RefererParser is a simple enum-based utility class

### Frontend (Phase 17 Only)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts | ^3.8.0 | Line chart for page view trends | Phase 17 only |

## Architecture Patterns

### Recommended Project Structure
```
backend/src/main/java/com/onepage/
├── util/
│   └── RefererParser.java          # NEW: Source categorization enum
├── model/
│   ├── PageView.java               # MODIFIED: Add refererSource field
│   └── BlogDailySourceStats.java   # NEW: Daily source aggregation entity
├── mapper/
│   └── BlogDailySourceStatsMapper.java  # NEW: Source stats mapper
└── service/
    └── AnalyticsService.java       # MODIFIED: Store categorized source
```

### Pattern 1: Enum-Based RefererParser

**What:** A Java enum with a static `categorize()` method that parses referer URLs into Source categories.

**When to use:** When you need to classify referer headers into standard analytics categories.

**Source:** Based on existing STATE.md decision 15-01-D02

```java
// Location: com.onepage.util.RefererParser
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
        "zhihu.com", "www.zhihu.com",
        "douyin.com", "www.douyin.com",
        "xiaohongshu.com", "www.xiaohongshu.com"
    );

    public enum Source {
        DIRECT("Direct"),
        SEARCH_ENGINE("Search Engine"),
        SOCIAL("Social"),
        REFERRAL("Referral"),
        OTHER("Other");

        private final String displayName;

        Source(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
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
            if (SEARCH_ENGINE_DOMAINS.stream().anyMatch(d ->
                    lowerDomain.equals(d) || lowerDomain.endsWith("." + d))) {
                return Source.SEARCH_ENGINE;
            }

            // Check social media
            if (SOCIAL_DOMAINS.stream().anyMatch(d ->
                    lowerDomain.equals(d) || lowerDomain.endsWith("." + d))) {
                return Source.SOCIAL;
            }

            // Otherwise it's a referral
            return Source.REFERRAL;

        } catch (Exception e) {
            log.warn("Failed to parse referer: {}", referer, e);
            return Source.OTHER;
        }
    }

    private static String extractDomain(String url) {
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

### Pattern 2: PageView Entity Modification

**What:** Add `refererSource` field to existing `PageView` entity.

**When to use:** To persist the categorized source alongside raw referer.

**Existing code (line 23):**
```java
private String referer;
```

**After modification:**
```java
private String referer;

private String refererSource;  // NEW: DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER
```

### Pattern 3: BlogDailySourceStats Entity

**What:** New entity for daily source breakdown pre-aggregation.

**When to use:** For pre-aggregated source stats queried by Phase 16 API.

```java
// Location: com.onepage.model.BlogDailySourceStats
package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("blog_daily_source_stats")
public class BlogDailySourceStats {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long blogId;

    private LocalDate statDate;

    private String source;  // DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER

    private Integer pageViews;

    private Integer uniqueVisitors;

    private LocalDateTime createdAt;
}
```

### Pattern 4: AnalyticsService.recordPageView() Modification

**What:** Call `RefererParser.categorize()` and persist the source.

**Location:** `AnalyticsService.java` line 48

**Existing code (lines 53-60):**
```java
PageView pageView = new PageView();
pageView.setBlogId(blogId);
pageView.setVisitorFingerprint(fingerprint);
pageView.setVisitedAt(now);
pageView.setUserAgent(truncate(userAgent, 500));
pageView.setReferer(truncate(referer, 500));
pageViewMapper.insert(pageView);
```

**After modification:**
```java
// Parse referer to categorize source
RefererParser.Source source = RefererParser.categorize(referer);

PageView pageView = new PageView();
pageView.setBlogId(blogId);
pageView.setVisitorFingerprint(fingerprint);
pageView.setVisitedAt(now);
pageView.setUserAgent(truncate(userAgent, 500));
pageView.setReferer(truncate(referer, 500));
pageView.setRefererSource(source.name());  // NEW: store source category
pageViewMapper.insert(pageView);
```

### Anti-Patterns to Avoid

- **Storing raw referer URLs in aggregation:** High cardinality causes storage explosion. Always categorize at insert time.
- **Per-request aggregation:** Querying `page_views` on every dashboard load will be slow. Pre-aggregation via scheduled job is the correct approach (D03 decision).
- **Synchronous analytics recording:** `recordPageView()` must remain `@Async` to avoid blocking site serving.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Referer categorization | Custom regex parsing | Enum-based RefererParser | Simple, maintainable, no external library needed |
| Source domain lists | Hardcoded string matching | Set-based lookup | O(1) lookup, easy to extend |

## Runtime State Inventory

> This is NOT a rename/refactor/migration phase. No runtime state inventory is needed.

## Common Pitfalls

### Pitfall 1: Null Referer Handling
**What goes wrong:** NullPointerException when referer is null.
**Why it happens:** `RefererParser.categorize()` doesn't handle null input properly.
**How to avoid:** Explicit null check at start of `categorize()` method returning `Source.DIRECT`.
**Warning signs:** NullPointerException in analytics recording logs.

### Pitfall 2: HTTPS Referer Loss
**What goes wrong:** When transitioning from HTTPS to HTTP, browsers strip the referer header for privacy. Direct traffic appears artificially high.
**Why it happens:** Browser security feature - cannot be fully prevented.
**How to avoid:** Accept `OTHER` as legitimate; track UTM parameters as supplement (deferred).
**Warning signs:** High percentage of DIRECT traffic, especially from HTTPS sources.

### Pitfall 3: Chinese Platform Coverage
**What goes wrong:** Baidu, Sogou, Weibo, Douyin, Xiaohongshu may not be in initial domain lists.
**Why it happens:** Domain lists are incomplete at first.
**How to avoid:** Include common Chinese platforms in initial domain sets; make it easy to extend.
**Warning signs:** Chinese traffic appearing as REFERRAL instead of SEARCH_ENGINE or SOCIAL.

### Pitfall 4: Missing Index on referer_source
**What goes wrong:** Aggregation query is slow without proper index.
**Why it happens:** Forgetting to add index on new column.
**How to avoid:** Add composite index on `(blog_id, visited_at, referer_source)` when adding column.

## Database Schema Changes

### Change 1: Add referer_source column to page_views
```sql
ALTER TABLE `page_views`
ADD COLUMN `referer_source` VARCHAR(20) DEFAULT NULL
COMMENT 'DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER'
AFTER `referer`;

-- Add index for aggregation queries
CREATE INDEX `idx_blog_visited_source` ON `page_views` (`blog_id`, `visited_at`, `referer_source`);
```

### Change 2: Create blog_daily_source_stats table
```sql
CREATE TABLE IF NOT EXISTS `blog_daily_source_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blog_id` BIGINT NOT NULL,
    `stat_date` DATE NOT NULL,
    `source` VARCHAR(20) NOT NULL COMMENT 'DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER',
    `page_views` INT DEFAULT 0,
    `unique_visitors` INT DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_blog_date_source` (`blog_id`, `stat_date`, `source`),
    INDEX `idx_blog_id` (`blog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw referer URL storage | Categorized source enum | Phase 15 | Enables aggregation without high-cardinality GROUP BY |
| Per-request aggregation | Pre-aggregated daily stats | Phase 11 | Dashboard loads fast; Phase 15 extends to source-level |

**Deprecated/outdated:**
- None relevant to this phase.

## Open Questions

1. **Should we backfill existing page_views data?**
   - What we know: Existing rows have NULL referer_source
   - What's unclear: Is historical source data valuable? What percentage of old data has referer?
   - Recommendation: Leave existing data as NULL; source = DIRECT when NULL.

2. **Should we add UTM parameter parsing?**
   - What we know: Not in current scope, deferred to future
   - What's unclear: How important is campaign tracking for v1.5?
   - Recommendation: Stick to referer-based categorization for v1.5; UTM is Phase 2.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 (junit-jupiter) |
| Config file | `backend/src/test/` directory |
| Quick run command | `mvn test -Dtest=RefererParserTest -x` |
| Full suite command | `mvn test -x` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ANLT-01 | RefererParser categorizes URLs correctly | unit | `mvn test -Dtest=RefererParserTest` | NEEDS CREATE |
| ANLT-01 | PageView stores refererSource field | unit | `mvn test -Dtest=AnalyticsServiceTest` | NEEDS CREATE |
| ANLT-02 | BlogDailySourceStats entity exists | integration | DB schema validation | NEEDS CREATE |

### Sampling Rate
- **Per task commit:** `mvn test -Dtest=RefererParserTest -x`
- **Per wave merge:** `mvn test -x`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/test/java/com/onepage/util/RefererParserTest.java` - unit tests for categorization
- [ ] `backend/src/test/java/com/onepage/service/AnalyticsServiceTest.java` - tests for recordPageView modification
- [ ] `backend/src/test/java/com/onepage/mapper/BlogDailySourceStatsMapperTest.java` - mapper tests

### Framework Installation
JUnit 5 is already configured in the project (`FulfillmentServiceTest.java` uses `@ExtendWith(MockitoExtension.class)`).

## Sources

### Primary (HIGH confidence)
- Existing project codebase analysis (`AnalyticsService.java`, `PageView.java`, `BlogDailyStats.java`)
- MyBatis-Plus documentation (BaseMapper patterns)
- STATE.md decisions D01-D05 (locked decisions)

### Secondary (MEDIUM confidence)
- Standard analytics referer categorization patterns from industry (Google Analytics categories)
- Common search engine and social platform domain lists

### Tertiary (LOW confidence)
- Chinese platform coverage (Weibo, Douyin, Xiaohongshu) - needs production traffic validation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; enum-based approach requires only Java standard library
- Architecture: HIGH - Patterns directly from existing codebase and locked STATE.md decisions
- Pitfalls: MEDIUM - Based on analytics industry common issues; HTTPS referer loss is unavoidable

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days - stable domain)

---

## RESEARCH COMPLETE

**Phase:** 15 - Analytics Data Layer
**Confidence:** HIGH

### Key Findings
1. No new dependencies required - RefererParser is pure Java enum utility
2. PageView entity needs `referer_source` column added to schema
3. BlogDailySourceStats is a new entity + table for daily source pre-aggregation
4. AnalyticsService.recordPageView() modification is minimal - just one line to store categorized source

### File Created
`/Users/chunxiang/Desktop/Vibe/Onepage/.planning/phases/15-analytics-data-layer/15-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | No new dependencies; existing patterns |
| Architecture | HIGH | Based on locked STATE.md decisions |
| Pitfalls | MEDIUM | Common analytics issues, HTTPS referer loss unavoidable |

### Open Questions
- Whether to backfill existing page_views data with NULL (recommend: no, treat as DIRECT)
- Chinese platform domain coverage may need extension during implementation

### Ready for Planning
Research complete. Planner can now create PLAN.md files for Phase 15.
