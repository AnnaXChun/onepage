---
phase: 15
slug: analytics-data-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 + Mockito (existing Spring Boot test stack) |
| **Config file** | src/test/java/com/onepage/ (standard Maven layout) |
| **Quick run command** | `mvn test -Dtest=*RefererParser*,*AnalyticsService*` |
| **Full suite command** | `mvn test` |
| **Estimated runtime** | ~60-120 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick test command
- **After every plan wave:** Run full test suite
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | ANLT-02 | unit | `mvn test -Dtest=RefererParserTest` | TBD | ⬜ pending |
| 15-01-02 | 01 | 1 | ANLT-02 | unit | `mvn test -Dtest=PageViewMapperTest` | TBD | ⬜ pending |
| 15-01-03 | 01 | 1 | ANLT-01, ANLT-02 | unit | `mvn test -Dtest=AnalyticsServiceTest` | TBD | ⬜ pending |
| 15-01-04 | 01 | 1 | ANLT-01, ANLT-02 | unit | `mvn test -Dtest=BlogDailySourceStatsMapperTest` | TBD | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/java/com/onepage/service/RefererParserTest.java` — unit tests for RefererParser enum
- [ ] `src/test/java/com/onepage/service/AnalyticsServiceTest.java` — mock tests for recordPageView with source
- [ ] `src/test/java/com/onepage/mapper/BlogDailySourceStatsMapperTest.java` — mapper tests

*Existing infrastructure covers basic Spring Boot testing. No additional setup needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Database schema migration | ANLT-02 | Requires DB inspection | Run `describe page_views;` and verify `referer_source` column exists |
| End-to-end analytics recording | ANLT-01, ANLT-02 | Full integration test | Publish a blog, visit it, verify source recorded in DB |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

---
