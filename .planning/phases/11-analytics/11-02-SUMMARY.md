---
phase: 11-analytics
plan: "02"
status: completed
completed: "2026-03-22T05:13:11Z"
duration: "~5 minutes"
requirements:
  - ANAL-01
  - ANAL-02
  - ANAL-03
---

# Phase 11 Plan 02: Analytics Service Layer & Dashboard

## Summary

Implemented analytics service layer, REST API endpoints, tracking integration, and frontend dashboard with analytics display.

## Commits

| Hash | Message |
|------|---------|
| 16c443a | feat(11-analytics): add AnalyticsService with recordPageView, getBlogStats, getUserBlogsStats |
| 94667a5 | feat(11-analytics): add AnalyticsController with GET /api/analytics and GET /api/analytics/blog/{blogId} |
| 3af0bc8 | feat(11-analytics): integrate analytics tracking in SiteController.servePublishedSite |
| 0d9de31 | feat(11-analytics): add getUserAnalytics and getBlogAnalytics to frontend API |
| 80bf3f7 | feat(11-analytics): create AnalyticsDashboard page with stat cards and analytics table |
| c577eae | feat(11-analytics): add /analytics route to App.tsx |

## Tasks Completed

1. **AnalyticsService** - Created with recordPageView (@Async), getBlogStats, getUserBlogsStats methods. Uses SHA-256 fingerprinting and Redis Sets for real-time visitor tracking.

2. **AnalyticsController** - Created with GET /api/analytics (user's all blogs) and GET /api/analytics/blog/{blogId} (specific blog). Supports period param (7d, 30d, 90d).

3. **SiteController Integration** - Added AnalyticsService dependency and recordPageView call in servePublishedSite. Handles X-Forwarded-For/X-Real-IP headers for real client IP.

4. **Frontend API** - Added getUserAnalytics and getBlogAnalytics functions with AnalyticsData interface.

5. **AnalyticsDashboard** - Created with StatCard components, AnalyticsTable, PeriodSelector (7d/30d/90d), loading skeleton, error state, and empty state.

6. **Route** - Added /analytics route to App.tsx.

## Key Files Modified/Created

- `backend/src/main/java/com/onepage/service/AnalyticsService.java` (NEW)
- `backend/src/main/java/com/onepage/controller/AnalyticsController.java` (NEW)
- `backend/src/main/java/com/onepage/controller/SiteController.java` (MODIFIED)
- `frontend/src/services/api.ts` (MODIFIED)
- `frontend/src/pages/Analytics/AnalyticsDashboard.tsx` (NEW)
- `frontend/src/App.tsx` (MODIFIED)

## Success Criteria Met

- [x] AnalyticsService.recordPageView is called from SiteController when serving published sites
- [x] AnalyticsController exposes GET /api/analytics and GET /api/analytics/blog/{blogId}
- [x] Frontend dashboard shows visitor counts and page views per blog
- [x] Dashboard has period selector (7d, 30d, 90d)
- [x] Dashboard shows empty state when no published blogs

## Dependencies

- Phase 11-01 (analytics data layer: PageView, BlogDailyStats entities, mappers, schema)
- PageViewMapper and BlogDailyStatsMapper from 11-01

## Notes

- @Async annotation on recordPageView requires async configuration - ensure @EnableAsync is present on application class
- Redis is used for real-time visitor counting (Sets with TTL)
- Analytics data aggregation combines stored daily stats with real-time Redis data
