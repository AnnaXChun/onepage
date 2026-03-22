---
gsd_state_version: 1.0
milestone: v1.5
milestone_name: Enhanced Analytics
status: defining_requirements
last_updated: "2026-03-22T16:30:00.000Z"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Vibe Onepage - Project State

**Last Updated:** 2026-03-22

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-22)

**Core Value:** Users can have a beautiful, personalized website live in minutes by combining AI-assisted generation with an intuitive block-level editor.

**Current Milestone:** v1.5 — Enhanced Analytics (defining requirements)

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-22 — Milestone v1.5 started

## Roadmap Evolution

- v1.5 added: Enhanced Analytics — page view time series + referral sources

### Decisions Made (v1.5)

- **15-01-D01**: Analytics data stored in Redis time-series structures (daily/hourly buckets)
- **15-01-D02**: Referral sources extracted from HTTP Referer header on blog page requests
- **15-02-D01**: Frontend charts via Recharts library (lightweight, good React integration)

### Decisions Made (v1.4)

- **13-01-D01**: Email required at registration with @NotBlank + @Email validation
- **13-01-D02**: SendGrid SMTP via Spring Mail with Thymeleaf template rendering (per D-10)
- **13-01-D03**: UUID tokens for email verification with 24hr expiry
- **13-01-D04**: Max 3 resend requests per 24 hours per email
- **13-02-D01**: Registration shows success message and redirects to login (no auto-login)
- **13-02-D02**: Email banner is non-blocking with dismiss option
- **13-02-D03**: Banner state persisted in localStorage

### Decisions Made (v1.3)

- **12-04**: SEO panel rendered at Editor level (not EditorToolbar); SEO button only manages click callback; SEOPanel uses VITE_SITE_URL env var for siteUrl

### Decisions Made (v1.2)

- **11-analytics-02**: AnalyticsService uses @Async for non-blocking page view recording; SHA-256 fingerprinting for visitor identification; Redis Sets for real-time visitor counting

### Decisions Made (v1.1)

- **07-credit-system**: Reused existing UserCreditsService.getCredits() method for credits balance endpoint
- **08-pdf-export-01**: Credit deduction happens BEFORE PDF generation in consumer; atomic deduction at controller level before job queuing; ownership validation on download/preview endpoints

### Technical Debt

- Phase 1 had no GSD plan (pre-existing) — creates traceability gaps
- Requirements traceability table not updated during execution
- Thymeleaf compilation issue exists (pre-existing, not blocking)

---

*See .planning/PROJECT.md for full evolved project context*
