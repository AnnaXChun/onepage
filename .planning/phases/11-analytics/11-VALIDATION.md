---
phase: 11
slug: analytics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JUnit 5 (existing in project) |
| **Config file** | None — standard Spring Boot test |
| **Quick run command** | `./mvnw test -Dtest=AnalyticsServiceTest -x` |
| **Full suite command** | `./mvnw test -x` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run affected unit tests only
- **After every plan wave:** Full suite (`./mvnw test -x`)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | ANAL-01, ANAL-02 | unit | `./mvnw test -Dtest=AnalyticsServiceTest -x` | NO | pending |
| 11-01-02 | 01 | 1 | ANAL-03 | integration | `./mvnw test -Dtest=AnalyticsControllerTest -x` | NO | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/test/java/com/onepage/service/AnalyticsServiceTest.java` — unit tests for ANAL-01, ANAL-02
- [ ] `backend/src/test/java/com/onepage/controller/AnalyticsControllerTest.java` — integration tests for ANAL-03
- [ ] `backend/src/main/java/com/onepage/mapper/PageViewMapper.java` — MyBatis-Plus mapper (new file)
- [ ] `backend/src/main/java/com/onepage/model/PageView.java` — entity (new file)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dashboard UI displays stats correctly | ANAL-03 | Frontend visual verification | Manual browser test |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
