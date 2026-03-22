# Phase 16: Analytics API Layer - Research

**Researched:** 2026-03-22
**Domain:** Backend API exposing time-series page view data and referral source breakdown
**Confidence:** HIGH

## Summary

Phase 16 implements the API layer that exposes analytics data for frontend visualization. The existing `AnalyticsService.getBlogStats()` already returns `dailyStats[]` with 7/30/90 day filtering. Phase 16 adds `refererSources[]` to the response and creates the `AnalyticsAggregationJob` scheduled task for pre-aggregating source stats daily. Key changes: (1) Add `RefererSourceStat` nested class to `AnalyticsDTO`, (2) Modify `getBlogStats()` to query and return source breakdown, (3) Create `AnalyticsAggregationJob` with cron `"0 5 0 * * ?"` (daily at 00:05).

Note: `@EnableScheduling` is NOT present in `OnePageApplication.java` — it must be added alongside the job.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **15-01-D02**: ReferralParser enum-based categorization (Direct, Search Engine, Social, Referral, Other)
- **15-01-D03**: Pre-aggregation via scheduled job (AnalyticsAggregationJob) to avoid per-page-view dashboard queries
- **15-01-D04**: UTC storage for timestamps, conversion at display time for timezone handling
- **15-01-D05**: Data downsampling for large datasets (>30 points) to prevent chart rendering issues

### Claude's Discretion
- Exact SQL query approach for aggregation (upsert vs delete-reinsert)
- Whether to include today's real-time Redis data in source breakdown

### Deferred Ideas (OUT OF SCOPE)
- UTM parameter parsing
- Traffic spike alerts
- Geographic breakdown
- Device/browser breakdown

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANLT-01 | User can view page view trends over time displayed as a line chart with 7/30/90 day range selection | `getBlogStats()` already returns `dailyStats[]` filtered by period; Phase 16 verifies data freshness |
| ANLT-02 | User can see referral sources grouped and counted (Google, Bing, direct, social) | Phase 15 created `BlogDailySourceStats` entity + `RefererParser` categorization; Phase 16 queries and returns `refererSources[]` |

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
- `@EnableScheduling` annotation (already part of Spring)

## Architecture Patterns

### Recommended Project Structure
```
backend/src/main/java/com/onepage/
├── service/
│   ├── AnalyticsService.java       # MODIFIED: Add refererSources to getBlogStats()
│   └── AnalyticsAggregationJob.java # NEW: Scheduled job for daily source aggregation
├── dto/
│   └── AnalyticsDTO.java          # MODIFIED: Add RefererSourceStat nested class
```

### Pattern 1: AnalyticsDTO with RefererSourceStat

**What:** Add nested class for referral source breakdown in API response.

**Location:** `AnalyticsDTO.java`

```java
// Add to AnalyticsDTO class
private List<RefererSourceStat> refererSources;

@Data
@NoArgsConstructor
@AllArgsConstructor
public static class RefererSourceStat {
    private String source;        // DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER
    private String displayName;  // "Direct", "Search Engine", etc.
    private Integer pageViews;
    private Integer percentage;   // 0-100
}
```

### Pattern 2: getBlogStats() Modification

**What:** Query BlogDailySourceStats for source breakdown, calculate percentages.

**Location:** `AnalyticsService.java` lines 121-155

**Existing code returns:**
```java
return new AnalyticsDTO(blogId, blog.getTitle(), totalPageViews, totalUniqueVisitors, dailyStatList);
```

**After modification should return:**
```java
List<AnalyticsDTO.RefererSourceStat> refererSources = getRefererSources(blogId, days);
return new AnalyticsDTO(blogId, blog.getTitle(), totalPageViews, totalUniqueVisitors, dailyStatList, refererSources);
```

### Pattern 3: AnalyticsAggregationJob

**What:** Scheduled job to pre-aggregate page views by source into BlogDailySourceStats.

**Location:** New file `AnalyticsAggregationJob.java` in service package

```java
package com.onepage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.onepage.mapper.BlogDailySourceStatsMapper;
import com.onepage.mapper.PageViewMapper;
import com.onepage.model.BlogDailySourceStats;
import com.onepage.model.PageView;
import com.onepage.util.RefererParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsAggregationJob {

    private final PageViewMapper pageViewMapper;
    private final BlogDailySourceStatsMapper sourceStatsMapper;

    /**
     * Aggregate page views by source for previous day.
     * Runs daily at 00:05 to ensure all page views for previous day are recorded.
     * CRON: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 5 0 * * ?")
    public void aggregateDailySourceStats() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        log.info("Starting daily source aggregation for date: {}", yesterday);

        try {
            // Query all page views for yesterday grouped by blog_id and source
            LocalDateTime startOfDay = yesterday.atStartOfDay();
            LocalDateTime endOfDay = yesterday.plusDays(1).atStartOfDay();

            List<PageView> pageViews = pageViewMapper.selectList(
                new LambdaQueryWrapper<PageView>()
                    .ge(PageView::getVisitedAt, startOfDay)
                    .lt(PageView::getVisitedAt, endOfDay)
            );

            // Group by blogId and source
            Map<String, Integer> sourceCounts = pageViews.stream()
                .collect(Collectors.groupingBy(
                    pv -> pv.getBlogId() + "_" + (pv.getRefererSource() != null ? pv.getRefererSource() : "DIRECT"),
                    Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));

            // Upsert each source stat
            for (Map.Entry<String, Integer> entry : sourceCounts.entrySet()) {
                String[] parts = entry.getKey().split("_", 2);
                Long blogId = Long.parseLong(parts[0]);
                String source = parts.length > 1 ? parts[1] : "DIRECT";
                int count = entry.getValue();

                BlogDailySourceStats stat = new BlogDailySourceStats();
                stat.setBlogId(blogId);
                stat.setStatDate(yesterday);
                stat.setSource(source);
                stat.setPageViews(count);
                stat.setUniqueVisitors(count); // Simplified - unique visitor logic deferred
                stat.setCreatedAt(LocalDateTime.now());

                // Upsert logic using MyBatis-Plus
                BlogDailySourceStats existing = sourceStatsMapper.selectOne(
                    new LambdaQueryWrapper<BlogDailySourceStats>()
                        .eq(BlogDailySourceStats::getBlogId, blogId)
                        .eq(BlogDailySourceStats::getStatDate, yesterday)
                        .eq(BlogDailySourceStats::getSource, source)
                );

                if (existing != null) {
                    stat.setId(existing.getId());
                    sourceStatsMapper.updateById(stat);
                } else {
                    sourceStatsMapper.insert(stat);
                }
            }

            log.info("Daily source aggregation completed. Processed {} source combinations", sourceCounts.size());
        } catch (Exception e) {
            log.error("Daily source aggregation failed", e);
        }
    }
}
```

### Pattern 4: @EnableScheduling Requirement

**What:** Spring's scheduling must be explicitly enabled.

**Location:** `OnePageApplication.java`

**Problem:** `@EnableScheduling` is NOT present — `@EnableAsync` exists but scheduling does not.

**Fix:** Add `@EnableScheduling` annotation to `OnePageApplication` class.

```java
@SpringBootApplication(exclude = {
    org.springframework.ai.autoconfigure.openai.OpenAiAutoConfiguration.class
})
@MapperScan("com.onepage.mapper")
@EnableAsync
@EnableScheduling  // ADD THIS LINE
public class OnePageApplication {
```

### Anti-Patterns to Avoid

- **Querying raw page_views on dashboard load:** Will be slow at scale. Always use pre-aggregated `BlogDailySourceStats`.
- **Synchronous aggregation job:** Use `@Scheduled` with fixed cron, not blocking the main thread.
- **Missing percentage calculation:** `refererSources[]` must include percentage — calculate as `(pageViews / totalPageViews) * 100`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Source categorization | Custom regex parsing | `RefererParser` (Phase 15) | Enum-based, maintainable |
| Cron scheduling | Custom thread pools | `@Scheduled(cron=...)` | Spring standard, cluster-safe |
| Percentage calculation | Manual division with zero-check | `(count * 100) / total` with ternary | Simple integer math |

## Common Pitfalls

### Pitfall 1: Missing @EnableScheduling
**What goes wrong:** `@Scheduled` jobs never run.
**Why it happens:** Spring Boot does not enable scheduling by default.
**How to avoid:** Add `@EnableScheduling` to `OnePageApplication`.

### Pitfall 2: Aggregation Job Running Before Midnight
**What goes wrong:** Yesterday's data is incomplete when job runs at midnight.
**Why it happens:** Page views may arrive with delay; job runs too early.
**How to avoid:** Use `0 5 0 * * ?` (00:05) to give 5-minute buffer.

### Pitfall 3: Division by Zero in Percentage Calculation
**What goes wrong:** `percentage = pageViews / totalPageViews * 100` throws ArithmeticException when total is 0.
**How to avoid:** Use `totalPageViews > 0 ? (pageViews * 100) / totalPageViews : 0`.

### Pitfall 4: Empty refererSource Handling
**What goes wrong:** Null `refererSource` causes NullPointerException in grouping.
**How to avoid:** Default to "DIRECT" when `refererSource` is null.

## Code Examples

### getBlogStats() with refererSources
```java
public AnalyticsDTO getBlogStats(Long blogId, String period) {
    // ... existing daily stats logic (lines 121-153) ...

    // Add source breakdown
    List<AnalyticsDTO.RefererSourceStat> refererSources = getRefererSources(blogId, days);

    return new AnalyticsDTO(blogId, blog.getTitle(), totalPageViews, totalUniqueVisitors, dailyStatList, refererSources);
}

private List<AnalyticsDTO.RefererSourceStat> getRefererSources(Long blogId, int days) {
    LocalDate startDate = LocalDate.now().minusDays(days);

    List<BlogDailySourceStats> sourceStats = sourceStatsMapper.selectList(
        new LambdaQueryWrapper<BlogDailySourceStats>()
            .eq(BlogDailySourceStats::getBlogId, blogId)
            .ge(BlogDailySourceStats::getStatDate, startDate)
    );

    int totalPageViews = sourceStats.stream().mapToInt(BlogDailySourceStats::getPageViews).sum();

    return sourceStats.stream()
        .map(stat -> {
            int percentage = totalPageViews > 0 ? (stat.getPageViews() * 100) / totalPageViews : 0;
            return new AnalyticsDTO.RefererSourceStat(
                stat.getSource(),
                RefererParser.Source.valueOf(stat.getSource()).getDisplayName(),
                stat.getPageViews(),
                percentage
            );
        })
        .collect(Collectors.toList());
}
```

### Cron Expression Reference
| Schedule | Cron Expression |
|----------|-----------------|
| Daily 00:05 | `0 5 0 * * ?` |
| Daily 02:00 | `0 0 2 * * ?` |
| Every hour | `0 0 * * * ?` |

## Open Questions

1. **Should today's real-time Redis data be included in source breakdown?**
   - What we know: `getBlogStats()` already adds Redis data for today's visitors
   - What's unclear: Should sources also include real-time data or only pre-aggregated?
   - Recommendation: Only pre-aggregated for sources (Phase 16); real-time addition is Phase 17 enhancement

2. **Unique visitor counting in source aggregation?**
   - What we know: Current `BlogDailySourceStats.uniqueVisitors` is set equal to `pageViews` (simplified)
   - What's unclear: Should we track unique fingerprints per source?
   - Recommendation: Keep simplified for Phase 16; unique visitor logic per source deferred

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 (junit-jupiter) |
| Config file | `backend/src/test/` directory |
| Quick run command | `mvn test -Dtest=AnalyticsServiceTest -x` |
| Full suite command | `mvn test -x` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| ANLT-01 | getBlogStats returns dailyStats with 7/30/90 filtering | unit | `mvn test -Dtest=AnalyticsServiceTest#testGetBlogStatsFiltering` | NEEDS CREATE |
| ANLT-02 | getBlogStats returns refererSources with name, count, percentage | unit | `mvn test -Dtest=AnalyticsServiceTest#testGetBlogStatsRefererSources` | NEEDS CREATE |
| ANLT-02 | AnalyticsAggregationJob upserts BlogDailySourceStats | unit | `mvn test -Dtest=AnalyticsAggregationJobTest` | NEEDS CREATE |

### Sampling Rate
- **Per task commit:** `mvn test -Dtest=AnalyticsServiceTest -x`
- **Per wave merge:** `mvn test -x`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/test/java/com/onepage/service/AnalyticsServiceTest.java` - getBlogStats tests
- [ ] `backend/src/test/java/com/onepage/service/AnalyticsAggregationJobTest.java` - scheduled job tests

### Framework Installation
JUnit 5 already configured in project (`FulfillmentServiceTest.java` uses `@ExtendWith(MockitoExtension.class)`).

## Sources

### Primary (HIGH confidence)
- Existing `AnalyticsService.java` lines 121-155 (`getBlogStats()` method)
- Existing `AnalyticsDTO.java` (DailyStat nested class)
- Phase 15 research (refererSource field, BlogDailySourceStats entity)
- `PdfGenerationService.java` line 183 (existing `@Scheduled` cron example)
- `OnePageApplication.java` (confirms `@EnableAsync` present, `@EnableScheduling` missing)

### Secondary (MEDIUM confidence)
- MyBatis-Plus `LambdaQueryWrapper` patterns
- Spring `@Scheduled` cron expression syntax

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; existing patterns
- Architecture: HIGH - Based on Phase 15 implementation and existing code
- Pitfalls: HIGH - @EnableScheduling issue is a clear known issue

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (30 days - stable domain)

---

## RESEARCH COMPLETE

**Phase:** 16 - Analytics API Layer
**Confidence:** HIGH

### Key Findings
1. `getBlogStats()` already returns `dailyStats[]` with 7/30/90 filtering - no changes needed for ANLT-01
2. `AnalyticsDTO` needs `RefererSourceStat` nested class and `refererSources` field added
3. `AnalyticsService` needs `getRefererSources()` private method querying `BlogDailySourceStats`
4. `AnalyticsAggregationJob` scheduled job required with cron `"0 5 0 * * ?"` (daily 00:05)
5. `@EnableScheduling` is MISSING from `OnePageApplication.java` - must be added

### File Created
`/Users/chunxiang/Desktop/Vibe/Onepage/.planning/phases/16-analytics-api-layer/16-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | No new dependencies; existing patterns |
| Architecture | HIGH | Based on Phase 15 entities + existing service |
| Pitfalls | HIGH | @EnableScheduling missing is confirmed issue |

### Open Questions
- Include real-time Redis data in source breakdown? (Recommend: no for Phase 16)
- Unique visitor counting per source? (Recommend: simplified for Phase 16)

### Ready for Planning
Research complete. Planner can now create PLAN.md files for Phase 16.
