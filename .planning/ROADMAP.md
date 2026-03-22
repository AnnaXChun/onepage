# Vibe Onepage - Roadmap

**Project:** Vibe Onepage - AI-Powered Single-Page Website Builder
**Granularity:** Standard
**Total v1 Requirements:** 52 (31 existing, 21 v1.1 to build)

---

## Milestones

- [x] **v1.0 MVP** — Phases 1-5 (shipped 2026-03-21)
- [x] **v1.1 Completion** — Phases 6-10 (shipped 2026-03-21)
- [x] **v1.2 Analytics** — Phase 11 (COMPLETED 2026-03-22)
- [x] **v1.3 SEO Tools** — Phase 12 (SHIPPED 2026-03-22)
- [x] **v1.4 Email & Notifications** — Phases 13-14 (SHIPPED 2026-03-22)
- [x] **v1.5 Enhanced Analytics** — Phases 15-17 (SHIPPED 2026-03-22)

---

## Phases

- [x] **Phase 15: Analytics Data Layer** - Backend referral source categorization and storage
- [x] **Phase 16: Analytics API Layer** - Backend API exposing time-series and referral data (completed 2026-03-22)
- [x] **Phase 17: Analytics UI Layer** - Frontend charts for visualization

---

## Phase Details

### Phase 15: Analytics Data Layer

**Goal:** Analytics data layer can categorize and store referral sources for time-series and breakdown analysis

**Depends on:** Nothing (first phase of milestone)

**Requirements:** ANLT-01 (data foundation), ANLT-02 (data foundation)

**Success Criteria** (what must be TRUE):
1. RefererParser utility categorizes referer URLs into Direct, Search Engine, Social, Referral, and Other categories
2. PageView entity stores refererSource field when recording a page view
3. AnalyticsService.recordPageView() persists the categorized source to database
4. BlogDailySourceStats entity and mapper exist for daily source aggregation

**Plans:** 1/1 plans complete
- [x] 15-01-PLAN.md — Analytics Data Layer (ANLT-01, ANLT-02) — COMPLETED 2026-03-22

---

### Phase 16: Analytics API Layer

**Goal:** API exposes time-series page view data and referral source breakdown for frontend consumption

**Depends on:** Phase 15

**Requirements:** ANLT-01 (API support), ANLT-02 (API support)

**Success Criteria** (what must be TRUE):
1. AnalyticsService.getBlogStats() returns dailyStats[] with filtering for 7/30/90 day periods
2. AnalyticsService.getBlogStats() returns refererSources[] with source name, page view count, and percentage
3. AnalyticsAggregationJob runs daily and pre-aggregates page views by source into BlogDailySourceStats
4. API response latency under 200ms for dashboard load (using pre-aggregated data)

**Plans:** 1/1 plans complete
- [x] 16-01-PLAN.md — Analytics API Layer (ANLT-01, ANLT-02) — COMPLETED 2026-03-22

---

### Phase 17: Analytics UI Layer

**Goal:** User can visualize page view trends and referral source breakdown in the analytics dashboard

**Depends on:** Phase 16

**Requirements:** ANLT-01 (visualization), ANLT-02 (visualization)

**Success Criteria** (what must be TRUE):
1. Time-series line chart displays daily page views with working 7d/30d/90d toggle
2. Referral source pie/bar chart displays traffic breakdown with percentages and source labels
3. Analytics dashboard renders both charts with proper loading and empty states
4. Charts downsample data gracefully when dataset is large (>30 data points)

**Plans:** 1/1 plans complete
- [x] 17-01-PLAN.md — Analytics Charts (ANLT-01, ANLT-02) — COMPLETED 2026-03-22

---

### Phase 11: Analytics

**Goal**: Users can view visitor counts and page views for their published sites

**Depends on**: Phase 9 (platform hosting)

**Requirements**: ANAL-01, ANAL-02, ANAL-03

**Success Criteria** (what must be TRUE):
1. User can view visitor counts for their published site
2. User can view page views per published site
3. Analytics data displays in user dashboard

**Plans**: 2 plans
- [x] 11-01-PLAN.md — Analytics Data Layer (ANAL-01, ANAL-02)
- [x] 11-02-PLAN.md — Analytics Service & Dashboard (ANAL-01, ANAL-02, ANAL-03)

---

## v1.1 Progress

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 6. AI Generation & Editor Polish | 2/2 | Complete    | 2026-03-21 |
| 7. Credit System | 3/3 | Complete    | 2026-03-21 |
| 8. PDF Export | 2/2 | Complete    | 2026-03-21 |
| 9. Platform Hosting | 1/1 | Complete    | 2026-03-21 |
| 10. Payments & VIP | 1/1 | Complete    | 2026-03-21 |

## v1.2 Progress

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 11. Analytics | 2/2 | Complete    | 2026-03-22 |

## v1.3 Progress

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 12. SEO Meta Tags and Open Graph | 4/4 | Complete | 2026-03-22 |

## v1.4 Progress

| Phase | Plans | Status | Completed |
|-------|-------|--------|-----------|
| 13. Email Collection | 3/3 | Complete | 2026-03-22 |
| 14. Notification Emails and PDF Delivery | 3/3 | Complete | 2026-03-22 |

## v1.5 Progress (Active)

| Phase | Plans | Status |
|-------|-------|--------|
| 15. Analytics Data Layer | 1/1 | Complete (2026-03-22) |
| 16. Analytics API Layer | 1/1 | Complete (2026-03-22) |
| 17. Analytics UI Layer | 1/1 | Complete (2026-03-22) |

---

*Last updated: 2026-03-22 after Phase 17 planning*
