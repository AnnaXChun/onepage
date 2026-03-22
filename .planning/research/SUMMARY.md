# Project Research Summary

**Project:** Vibe Onepage - v1.5 Enhanced Analytics
**Domain:** Website analytics with time-series visualization and referral source tracking
**Researched:** 2026-03-22
**Confidence:** MEDIUM

## Executive Summary

The v1.5 Enhanced Analytics milestone adds two capabilities to the existing v1.2 analytics infrastructure: (1) time-series page view charts showing trends over 7/30/90 days, and (2) referral source breakdown categorizing traffic into Direct, Search Engine, Social, and Referral categories. The existing codebase already captures raw data (page_views table with referer field, blog_daily_stats aggregation), but lacks visualization and proper referer categorization.

The recommended approach leverages existing infrastructure: AnalyticsService.recordPageView() already stores referer data, and dailyStats[] exists in AnalyticsDTO. The primary work involves adding a ReferralParser utility to categorize referer URLs, exposing the existing dailyStats data properly, and integrating a frontend charting library (Recharts). No new backend dependencies or database tables are strictly required for MVP, though a separate blog_daily_source_stats table enables better per-source trend analysis at scale.

Key risks include: performance issues from querying raw page_views on dashboard load (must use pre-aggregated daily stats), timezone handling bugs in time-series data, and potential referral data loss from HTTPS->HTTP transitions (browser privacy feature). The frontend must implement data downsampling to avoid chart rendering crashes with large datasets.

## Key Findings

### Recommended Stack

The existing v1.2 stack is validated and sufficient. No backend dependency changes are needed.

**Core technologies:**
- **Recharts ^3.8.0** — Time-series line charts and pie/bar charts for referral breakdown; declarative React components, ~15KB core bundle, native time-series support
- **ReferralParser (new utility)** — Backend enum-based parser to categorize referer URLs into Direct, Search Engine, Social, Referral, Other; no external library needed
- **Existing: MySQL 8, Redis 6.x, Spring Boot 3.2.0, MyBatis-Plus 3.5.5** — All remain unchanged; page_views and blog_daily_stats tables already exist

**Avoid:** Chart.js (imperative canvas API requires wrapper overhead), Tremor (heavy ~100KB+ bundle), Victory (complex API), Redis Stack time-series (overkill for project scale), ClickHouse (operational complexity unjustified).

### Expected Features

**Must have (table stakes):**
- Time-series line chart — Display daily page views as line chart with 7d/30d/90d toggle; existing dailyStats[] in AnalyticsDTO provides data
- Referral source categorization — Parse referer into Direct/Search/Social/Referral categories; raw referer field exists but needs parsing
- Referral pie/bar chart — Visual breakdown of traffic sources with percentages

**Should have (competitive):**
- UTM parameter parsing — Track campaign sources from URL parameters (P2 complexity)
- Traffic spike alerts — Email notification when traffic exceeds rolling average (P3, EmailService exists)

**Defer (v2+):**
- Geographic breakdown — Requires IP geolocation service, privacy concerns, cost
- Device/browser breakdown — Requires UA parsing library
- Real-time analytics (live visitor count) — WebSocket infrastructure needed
- Custom date range picker — 7/30/90d presets sufficient for v1.5

### Architecture Approach

The existing analytics pipeline is: SiteController.servePublishedSite() -> AnalyticsService.recordPageView() [@Async] -> Save to page_views table (referer stored) + Redis Set (visitor fingerprint). AnalyticsService.getBlogStats() queries blog_daily_stats and returns dailyStats[].

**Target data flow for v1.5:**
1. recordPageView() parses referer URL via RefererParser, stores source category
2. Scheduled aggregation job (daily at 00:05) groups page_views by blog_id and referer_source, upserts into blog_daily_source_stats (or queries directly for MVP)
3. getBlogStats() returns existing dailyStats[] plus new refererSources[] breakdown
4. Frontend renders line chart (dailyStats) and pie chart (refererSources) via Recharts

**Major components:**
1. **RefererParser** (util/) — Enum-based categorization of referer URLs into Source enum (DIRECT, SEARCH_ENGINE, SOCIAL, REFERRAL, OTHER)
2. **BlogDailySourceStats** (model/) — Entity for daily source breakdown; new table or JSON column in blog_daily_stats
3. **AnalyticsAggregationJob** (job/) — @Scheduled job at 00:05 to aggregate previous day's page_views by source into blog_daily_source_stats
4. **AnalyticsDTO.RefererSourceStat** (dto/) — New nested class for API response: {source, displayName, pageViews, percentage}
5. **TimeSeriesChart + ReferralChart** (frontend) — Recharts LineChart and PieChart wrappers

### Critical Pitfalls

1. **Referral data normalization missing** — Storing raw referer URLs causes useless noise (dozens of google.com variants). Prevention: Parse and normalize domains at insert time via RefererParser.

2. **Per-page-view aggregation on dashboard load** — Querying raw page_views with GROUP BY causes 10+ second loads or timeouts at scale. Prevention: Pre-aggregate via scheduled job; serve from blog_daily_stats or blog_daily_source_stats.

3. **Synchronous analytics recording blocks site serving** — recordPageView() in request thread adds 50-200ms latency. Prevention: Already @Async in existing code; verify dedicated thread pool exists.

4. **Timezone handling bugs in time-series** — LocalDateTime.now() uses server timezone; aggregation by day is ambiguous. Prevention: Store timestamps in UTC; convert to user timezone at display time.

5. **Frontend chart rendering crashes** — Recharts renders all data points; 90 days of data = 2160 points, DOM cannot handle. Prevention: Downsample to daily for >30 points; disable animation for large datasets; lazy load historical data.

## Implications for Roadmap

Based on research, the v1.5 Enhanced Analytics work splits into three phases:

### Phase 1: Backend Data Layer
**Rationale:** Foundation must be solid before API and UI layers. Referer categorization requires database schema changes (add referer_source column to page_views).

**Delivers:** PageView entity updated with refererSource field; RefererParser utility with categorization logic; AnalyticsService.recordPageView() stores categorized source; BlogDailySourceStats entity and mapper (if using separate table).

**Implements:** STACK.md ReferralParser, ARCHITECTURE.md Phase A components.

### Phase 2: Backend API Layer
**Rationale:** API must expose categorized data before frontend can visualize. Builds directly on Phase 1.

**Delivers:** AnalyticsDTO.RefererSourceStat nested class; AnalyticsService.getBlogStats() returns refererSources[] breakdown; AnalyticsAggregationJob for daily source aggregation.

**Implements:** ARCHITECTURE.md Phase B components, API changes from STACK.md.

### Phase 3: Frontend UI Layer
**Rationale:** UI layer depends on API. Final integration of Recharts for visualization.

**Delivers:** Recharts installed; TimeSeriesChart component for daily page view trends; ReferralChart component (PieChart) for traffic source breakdown; Period toggle (7d/30d/90d); Updated AnalyticsDashboard.

**Implements:** FEATURES.md P1 features (time-series chart, referral chart), STACK.md Recharts integration.

### Phase Ordering Rationale

- **Phase 1 before 2:** API cannot return source breakdown without data layer changes
- **Phase 2 before 3:** Frontend needs API contract to render charts
- **Grouping by layer:** Backend (data + API) separated from frontend to enable parallel work after Phase 1
- **Avoids pitfalls:** Async recording already exists (Pitfall 15 mitigated), pre-aggregation design (Pitfall 14 mitigated), timezone handling in schema design (Pitfall 16 mitigation)

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** RefererParser domain list completeness — need to verify coverage for Chinese platforms (Baidu, Sogou, Weibo) with actual traffic patterns
- **Phase 2:** Aggregation job scaling — if blog has 100K+ daily page views, job execution time needs measurement

Phases with standard patterns (skip research-phase):
- **Phase 3:** Recharts is well-documented; LineChart/PieChart patterns are standard React charting approaches

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Existing v1.2 stack validated; Recharts v3.8.0 confirmed compatible with React 18 |
| Features | MEDIUM | Based on existing codebase analysis + industry standard patterns (Umami, Plausible); competitor comparison available |
| Architecture | HIGH | Integration points verified via codebase analysis; @Async, scheduled jobs, aggregation patterns standard |
| Pitfalls | MEDIUM | Based on code analysis + common analytics pitfalls; some (referer normalization, timezone) require production validation |

**Overall confidence:** MEDIUM

### Gaps to Address

- **ReferralParser domain coverage:** Chinese search engines (Sogou, 360so) and social platforms (Douyin, Xiaohongshu) may need inclusion; validate against actual traffic during implementation
- **Timezone validation:** UTC storage and display-time conversion needs testing with users in different timezones
- **Chart performance at scale:** 90-day view with high-traffic blogs needs load testing; downsampling thresholds may need tuning
- **HTTPS referer loss:** Cannot be fully solved; need to validate acceptable "Unknown" percentage with real traffic

## Sources

### Primary (HIGH confidence)
- Existing project codebase analysis (AnalyticsService.java, AnalyticsDTO.java, PageView.java, BlogDailyStats.java, SiteController.java)
- Recharts official documentation (recharts.org) — v3.8.0 release confirmed
- MyBatis-Plus documentation (BaseMapper, LambdaQueryWrapper patterns)
- Spring @Scheduled documentation (cron expressions)

### Secondary (MEDIUM confidence)
- Standard analytics patterns from training data (time-series visualization, referer categorization)
- Competitor feature analysis: umami.is, plausible.io (simple analytics feature set)
- Spring Async execution patterns
- Redis HyperLogLog for approximate unique counting (reference, not implemented)

### Tertiary (LOW confidence)
- RefererParser domain lists — need production traffic validation
- Aggregation job performance at 100K+ page views/day — needs load testing
- Chinese platform categorization (Weibo, Douyin, Xiaohongshu) — need user base validation

---
*Research completed: 2026-03-22*
*Ready for roadmap: yes*
