# Feature Research

**Domain:** Website Analytics - Time-Series Charts and Referral Source Tracking (v1.5 Milestone)
**Researched:** 2026-03-22
**Confidence:** MEDIUM (existing infrastructure analyzed; standard analytics patterns from training data)

## Executive Summary

This document covers the v1.5 milestone features: enhanced analytics with time-series page view charts and referral source tracking. The existing codebase has foundational analytics (page_views table, blog_daily_stats aggregation, AnalyticsService) but lacks:
1. **Time-series data exposure** - daily stats exist but frontend needs chart-ready format
2. **Referral source categorization** - raw referer field exists but is not parsed into categories (direct, search, social, referral)

The existing AnalyticsService.getBlogStats() already returns a `dailyStats` array with date/pageViews/uniqueVisitors. The primary work is exposing this data properly and implementing referer parsing.

---

## Feature Landscape (v1.5 Focus)

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Existing State | What's Needed |
|---------|--------------|------------|----------------|---------------|
| Page view trends over time | "Are my visitor numbers going up or down?" | LOW | `dailyStats` array exists in AnalyticsDTO | Chart component with 7/30/90 day toggle |
| Referral source breakdown | "Where are my visitors coming from?" | MEDIUM | `referer` field stored but not categorized | Parse referer into: Direct, Search, Social, Referral |
| Time period selection | "Show me last week's vs last month's trends" | LOW | `period` param (7d/30d/90d) exists | Frontend toggle buttons |
| Chart visualization | "Raw numbers are hard to read" | MEDIUM | None | Line chart component (Recharts, Chart.js, or similar) |

### Differentiators (Competitive Advantage)

Features that set products apart. Not required, but valuable for retention.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| First-touch attribution | Track which channel brought the visitor originally | MEDIUM | Store initial referer on first visit, persist with visitor session |
| Top pages breakdown | "Which page gets the most traffic?" | MEDIUM | Currently single-page sites, but could track hero/section engagement |
| Traffic spike alerts | "Notify me when traffic exceeds normal" | LOW | Compare against rolling average, alert via email |
| UTM parameter parsing | "Track which campaign brought visitors" | MEDIUM | Parse utm_source, utm_medium, utm_campaign from URL |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time analytics (live visitors) | "See visitors right now" | WebSocket infrastructure needed, high complexity for marginal value | Refresh page for current day counts |
| Geographic breakdown | "Where in the world are visitors?" | Requires IP geolocation service, privacy concerns, cost | Defer to v2 |
| Device/browser breakdown | "Optimize for mobile vs desktop" | Requires UA parsing library, secondary metric | User-agent is stored, add aggregation later |
| Custom date range picker | "I want March 1-15 specifically" | UI complexity, edge cases with partial weeks | 7/30/90 day presets are sufficient for v1.5 |

---

## Feature Details

### 1. Time-Series Page View Charts

**Current State:**
- `AnalyticsService.getBlogStats()` returns `List<DailyStat>` with `{date, pageViews, uniqueVisitors}`
- Data is already time-ordered (ORDER BY statDate ASC)
- Period parameter supports 7d, 30d, 90d

**How It Works:**

```
[User opens analytics dashboard]
         │
         ▼
┌─────────────────────────────────────────────────────┐
│ Frontend: Fetch analytics data                      │
│ GET /api/analytics/stats/{blogId}?period=7d        │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ Backend: AnalyticsService.getBlogStats()           │
│ - Query blog_daily_stats for date range           │
│ - Add today's Redis real-time counts               │
│ - Return AnalyticsDTO with dailyStats[]            │
└────────────────────────┬──────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│ Frontend: Render line chart                        │
│ - X-axis: dates                                    │
│ - Y-axis: page views / unique visitors            │
│ - Toggle between 7d / 30d / 90d                  │
└─────────────────────────────────────────────────────┘
```

**Data Shape for Charts:**

```typescript
// Frontend expects this for chart rendering
interface ChartDataPoint {
  date: string;           // "2026-03-15"
  pageViews: number;
  uniqueVisitors: number;
}

// Example API response enhancement
interface AnalyticsResponse {
  blogId: number;
  blogTitle: string;
  totalPageViews: number;
  totalUniqueVisitors: number;
  period: string;         // "7d" | "30d" | "90d"
  dailyStats: ChartDataPoint[];
  // NEW for v1.5:
  referralSources?: ReferralSourceBreakdown;
}
```

### 2. Referral Source Tracking

**Current State:**
- `page_views.referer` stores raw HTTP Referer header
- No categorization is performed

**How Referral Categorization Works:**

```
Raw Referer Header                              Categorized Source
─────────────────────────────────────────────────────────────────────
(no referer)                              →  Direct
https://www.google.com/search?q=...       →  Search: Google
https://www.bing.com/search?q=...         →  Search: Bing
https://www.baidu.com/s?wd=...            →  Search: Baidu
https://www.facebook.com/...              →  Social: Facebook
https://twitter.com/...                   →  Social: Twitter (X)
https://weibo.com/...                     →  Social: Weibo
https://www.linkedin.com/...              →  Social: LinkedIn
https://t.co/... (shortened)             →  Social: Twitter (X)
https://pinterest.com/...                  →  Social: Pinterest
https://example.com/blog/post             →  Referral: example.com
```

**Referer Parsing Logic (Backend):**

```java
public enum ReferralSource {
    DIRECT("Direct", "none"),
    SEARCH_GOOGLE("Search", "google"),
    SEARCH_BING("Search", "bing"),
    SEARCH_BAIDU("Search", "baidu"),
    SEARCH_YAHOO("Search", "yahoo"),
    SEARCH_DUCKDUCKGO("Search", "duckduckgo"),
    SOCIAL_FACEBOOK("Social", "facebook"),
    SOCIAL_TWITTER("Social", "twitter"),
    SOCIAL_INSTAGRAM("Social", "instagram"),
    SOCIAL_LINKEDIN("Social", "linkedin"),
    SOCIAL_WEIBO("Social", "weibo"),
    SOCIAL_PINTEREST("Social", "pinterest"),
    REFERRAL("Referral", null);  // hostname becomes the source

    // Plus Referral source hostname extraction
}

public ReferralSource categorizeReferer(String referer) {
    if (referer == null || referer.isEmpty()) {
        return ReferralSource.DIRECT;
    }

    try {
        URL url = new URL(referer);
        String host = url.getHost().toLowerCase();

        // Search engines
        if (host.contains("google")) return SEARCH_GOOGLE;
        if (host.contains("bing")) return SEARCH_BING;
        if (host.contains("baidu")) return SEARCH_BAIDU;
        if (host.contains("yahoo")) return SEARCH_YAHOO;
        if (host.contains("duckduckgo")) return SEARCH_DUCKDUCKGO;

        // Social platforms
        if (host.contains("facebook") || host.contains("fb.")) return SOCIAL_FACEBOOK;
        if (host.contains("twitter") || host.contains("t.co")) return SOCIAL_TWITTER;
        if (host.contains("instagram") || host.contains("instagr")) return SOCIAL_INSTAGRAM;
        if (host.contains("linkedin")) return SOCIAL_LINKEDIN;
        if (host.contains("weibo")) return SOCIAL_WEIBO;
        if (host.contains("pinterest")) return SOCIAL_PINTEREST;

        // Default to referral with hostname
        return REFERRAL;

    } catch (MalformedURLException e) {
        return ReferralSource.DIRECT;
    }
}
```

**Referral Source Aggregation:**

```sql
-- Query to get referral breakdown for a blog
SELECT
    CASE
        WHEN referer IS NULL OR referer = '' THEN 'Direct'
        WHEN referer LIKE '%google%' THEN 'Search: Google'
        WHEN referer LIKE '%bing%' THEN 'Search: Bing'
        WHEN referer LIKE '%baidu%' THEN 'Search: Baidu'
        WHEN referer LIKE '%facebook%' THEN 'Social: Facebook'
        WHEN referer LIKE '%twitter%' OR referer LIKE '%t.co%' THEN 'Social: Twitter'
        WHEN referer LIKE '%weibo%' THEN 'Social: Weibo'
        ELSE 'Referral'
    END AS source_category,
    COUNT(*) AS visits
FROM page_views
WHERE blog_id = ? AND visited_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY source_category
ORDER BY visits DESC;
```

---

## Feature Dependencies

```
[Page Views Recorded]
    └──produces──> [page_views table]
                           └──aggregated by──> [blog_daily_stats table]
                                                      └──queried by──> [AnalyticsService]
                                                                              └──serves──> [Frontend Chart]

[Referer Header]
    └──captured in──> [page_views.referer]
                           └──parsed by──> [ReferralParser]
                                               └──aggregated by──> [ReferralSourceStats]
                                                                       └──served via──> [Analytics API]
```

### Dependency Notes

- **Page view recording** is already implemented in SiteController and AnalyticsService.recordPageView()
- **Time-series display** requires AnalyticsDTO enhancement + frontend chart component
- **Referral tracking** requires new parser service + aggregation query + API endpoint + frontend breakdown display

---

## MVP Definition (v1.5)

### Launch With (v1.5)

Minimum viable product for enhanced analytics.

- [ ] **Time-series line chart** - Display daily page views as a line chart (7d/30d/90d toggle)
- [ ] **Referral source breakdown** - Categorize referers into Direct/Search/Social/Referral
- [ ] **Referral pie/bar chart** - Visual breakdown of traffic sources

### Add After v1.5 (Future)

Features to add after v1.5 is validated.

- [ ] **UTM parameter parsing** - Track campaign sources from URL parameters
- [ ] **Traffic spike alerts** - Email notification when traffic exceeds threshold
- [ ] **Device breakdown** - Parse user agent for desktop/mobile/tablet stats

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Dependencies |
|---------|------------|---------------------|----------|--------------|
| Time-series line chart | HIGH | MEDIUM | P1 | Existing dailyStats in AnalyticsDTO |
| Period toggle (7/30/90d) | MEDIUM | LOW | P1 | Existing period param |
| Referral source categorization | HIGH | MEDIUM | P1 | New ReferralParser service |
| Referral pie/bar chart | HIGH | LOW | P1 | ReferralSourceStats DTO |
| UTM parameter parsing | MEDIUM | HIGH | P2 | URL parsing, new fields |
| Traffic spike alerts | LOW | MEDIUM | P3 | EmailService exists |

---

## Competitor Feature Analysis

| Feature | Google Analytics | Umami | Plausible | Our v1.5 |
|---------|-----------------|-------|-----------|----------|
| Time-series charts | Yes (complex) | Yes (simple) | Yes | Line chart |
| 7/30/90 day periods | Yes | Yes | Yes | 7d/30d/90d toggle |
| Referral source breakdown | Yes (complex) | Yes (simple) | Yes (basic) | Direct/Search/Social/Referral |
| Real-time visitors | Yes | No | No | No (acceptable) |
| Geographic breakdown | Yes | Optional | No | No (deferred) |
| Device breakdown | Yes | No | No | No (deferred) |

**Key insight:** Simple analytics (Umami, Plausible) provide exactly what v1.5 targets - time-series trends and traffic source breakdown - without the complexity of Google Analytics. We can match this with minimal additional code.

---

## Data Collection, Storage, and Display

### Data Collection (Already Implemented)

| Field | Source | Storage | Status |
|-------|--------|---------|--------|
| blog_id | SiteController on page serve | page_views | EXISTS |
| visited_at | Server timestamp | page_views | EXISTS |
| visitor_fingerprint | SHA-256(IP + User-Agent) | page_views | EXISTS |
| referer | HTTP Referer header | page_views | EXISTS |
| user_agent | HTTP User-Agent header | page_views | EXISTS |

### Data Storage (Exists, Needs Aggregation Query)

| Table | Purpose | Status |
|-------|---------|--------|
| page_views | Raw page view events | EXISTS |
| blog_daily_stats | Daily aggregates | EXISTS |

**New storage needed for referral breakdown:**

```sql
-- Optional: Pre-aggregated referral stats table
CREATE TABLE IF NOT EXISTS `blog_referral_stats` (
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `blog_id` BIGINT NOT NULL,
    `stat_date` DATE NOT NULL,
    `source_category` VARCHAR(50) NOT NULL,  -- 'Direct', 'Search: Google', 'Social: Facebook', 'Referral'
    `source_host` VARCHAR(255),              -- For referrals: the actual hostname
    `visits` INT DEFAULT 0,
    `unique_visitors` INT DEFAULT 0,
    UNIQUE KEY `uk_blog_date_source` (`blog_id`, `stat_date`, `source_category`),
    INDEX `idx_blog_id` (`blog_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Alternative:** Query `page_views` directly for referral breakdown (simpler for v1.5, less storage overhead).

### Data Display (Needs Implementation)

| Component | Implementation | Complexity |
|-----------|----------------|------------|
| Line chart | Recharts `<LineChart>` or Chart.js | MEDIUM |
| Period toggle | Button group (7d / 30d / 90d) | LOW |
| Referral pie chart | Recharts `<PieChart>` or Chart.js | MEDIUM |
| Referral breakdown list | Table with source and visit count | LOW |

---

## Sources

- Existing codebase analysis: `AnalyticsService.java`, `AnalyticsDTO.java`, `PageView.java`, `BlogDailyStats.java`
- Industry standard analytics patterns from training data
- Competitor feature analysis: umami.is, plausible.io

---

*Feature research for: Vibe Onepage v1.5 - Time-Series Analytics and Referral Source Tracking*
*Researched: 2026-03-22*
