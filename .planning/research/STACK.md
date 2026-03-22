# Stack Research — v1.5 Enhanced Analytics

**Domain:** Time-series analytics visualization and referral source tracking
**Researched:** 2026-03-22
**Confidence:** MEDIUM

## Executive Summary

The v1.5 Enhanced Analytics milestone requires two new capabilities: (1) time-series page view charts showing trends over 7/30/90 days, and (2) referral source breakdown (Google, Bing, direct, social). The existing infrastructure already captures the raw data needed for both features. No backend dependencies are required. Only a frontend charting library is needed.

## What Stays the Same (v1.2 Analytics Stack Validated)

| Technology | Current Version | Status | Notes |
|------------|-----------------|--------|-------|
| React | 18.2.0 | Keep | Stable |
| MySQL 8 | 8.x | Keep | Stores page_views and blog_daily_stats |
| Redis | 6.x | Keep | Already used for visitor Sets |
| Spring Boot | 3.2.0 | Keep | No changes needed |
| MyBatis-Plus | 3.5.5 | Keep | Working mapper pattern |

---

## New Additions for v1.5

### 1. Recharts — Time-Series Line Charts

**Frontend:**
| Library | Version | Purpose |
|---------|---------|---------|
| recharts | ^3.8.0 | Line chart for page view trends |

**Why Recharts:**

| Criterion | Recharts | Chart.js (react-chartjs-2) | Tremor |
|-----------|----------|---------------------------|--------|
| React 18 support | v3.8.0 confirmed | Works via wrapper | Works |
| Bundle size | Tree-shakeable, ~15KB core | ~50KB min | ~100KB+ |
| Time series | Native XAxis with date scale | Manual configuration | Native |
| Learning curve | Low - declarative components | Medium - canvas API | Medium |
| Maintenance | Active (GitHub releases) | Active | Active |
| Customization | Good theming support | Extensive | Limited |

**Why not Chart.js:** Imperative canvas API requires wrapper library (react-chartjs-2) adding overhead and complexity.

**Why not Tremor:** Heavy bundle (~100KB+), less customization for time-series, design-system locked.

**Installation:**
```bash
npm install recharts
```

### 2. Referral Source Parser — Backend Utility (No Library)

No new Maven dependency needed. Implement a simple enum-based parser:

```java
public enum ReferralSource {
    DIRECT("Direct", null),
    GOOGLE("Google", "google.com"),
    BING("Bing", "bing.com"),
    BAIDU("Baidu", "baidu.com"),
    YANDEX("Yandex", "yandex.ru"),
    TWITTER("Twitter", "twitter.com"),
    FACEBOOK("Facebook", "facebook.com"),
    INSTAGRAM("Instagram", "instagram.com"),
    LINKEDIN("LinkedIn", "linkedin.com"),
    OTHER("Other", null);

    private final String label;
    private final String domain;

    public static ReferralSource fromUrl(String referer) {
        if (referer == null || referer.isBlank()) {
            return DIRECT;
        }
        String lower = referer.toLowerCase();
        for (ReferralSource source : values()) {
            if (source.domain != null && lower.contains(source.domain)) {
                return source;
            }
        }
        return OTHER;
    }
}
```

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Chart.js (direct) | Imperative canvas API, requires react-chartjs-2 wrapper | Recharts (declarative React components) |
| Tremor | Heavy bundle (~100KB+), less customization | Recharts (lighter, more flexible) |
| Victory | Heavy bundle, complex API | Recharts (simpler, lighter) |
| Redis Stack time-series | Requires Redis Stack installation; existing Redis Sets + MySQL already sufficient | Existing approach with `blog_daily_stats` table |
| ClickHouse | Overkill for project scale; adds operational complexity | MySQL aggregation (existing) |
| Any paid charting library | Unnecessary cost for basic analytics | Recharts (free, open-source) |

---

## Architecture for Time-Series Charts

### Data Flow

```
1. Frontend: User requests analytics dashboard
   |
2. GET /api/analytics/stats?blogId={id}&period=7d
   |
3. AnalyticsService.getBlogStats(blogId, period)
   - Query blog_daily_stats for date range (MySQL)
   - Already returns dailyStats list with date/pageViews/visitors
   |
4. Frontend transforms to chart format:
   [{ date: "2026-03-15", pageViews: 42, visitors: 38 }, ...]
   |
5. Recharts <LineChart> renders trend line
```

### Data Flow for Referral Sources

```
1. Page view recorded via @Async AnalyticsService.recordPageView()
   - Stores referer in page_views.referer
   |
2. GET /api/analytics/referrals?blogId={id}&period=7d
   |
3. AnalyticsService.getReferralStats(blogId, period)
   - SELECT referer, COUNT(*) FROM page_views WHERE blog_id=? AND visited_at BETWEEN ? AND ?
   - Group by categorized ReferralSource
   - Calculate percentages
   |
4. Return List<ReferralStatsDTO>
5. Frontend renders <BarChart> or <PieChart>
```

---

## Backend Additions Summary

**No new Maven dependencies.**

| Addition | Type | Location | Purpose |
|----------|------|----------|---------|
| ReferralSource enum | New file | com.onepage.util.ReferralSource | Categorize referer URLs |
| ReferralStatsDTO | New file | com.onepage.dto.ReferralStatsDTO | API response for referral breakdown |
| AnalyticsService.getReferralStats() | Method addition | AnalyticsService.java | Query and aggregate referral data |
| AnalyticsController endpoint | Method addition | AnalyticsController.java | Expose GET /api/analytics/referrals |

---

## Frontend Additions Summary

| Addition | Type | Purpose |
|----------|------|---------|
| recharts | npm install | Line chart for time-series, bar/pie for referral breakdown |
| TimeSeriesChart component | New | Recharts LineChart wrapper for page view trends |
| ReferralChart component | New | Recharts BarChart or PieChart for referral sources |
| AnalyticsDashboard updates | Modify | Add chart sections below stat cards |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| recharts@^3.8.0 | React 18.x, React 17.x | Requires react-is peer dependency |
| recharts@^2.15.0 | React 18.x, React 17.x | Alternative version, same API |

---

## Sources

| Technology | Source | Confidence |
|-----------|--------|------------|
| Recharts | [github.com/recharts/recharts](https://github.com/recharts/recharts) | HIGH — v3.8.0 release verified March 2026 |
| Recharts React 18 | npm registry package info | HIGH — react-is peer dependency confirmed |
| Chart.js | [chartjs.org](https://www.chartjs.org/) | MEDIUM — alternative comparison |
| Redis time-series | [redis.io/docs/stack/timeseries](https://redis.io/docs/stack/timeseries/) | MEDIUM — for reference, not used |

---

*Stack research for: v1.5 Enhanced Analytics (time-series + referral tracking)*
*Researched: 2026-03-22*
