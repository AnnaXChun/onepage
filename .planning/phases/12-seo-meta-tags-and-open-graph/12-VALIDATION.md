---
phase: 12
slug: seo-meta-tags-and-open-graph
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — manual verification only |
| **Config file** | N/A |
| **Quick run command** | N/A — no automated tests |
| **Full suite command** | N/A |
| **Estimated runtime** | N/A |

---

## Sampling Rate

- **After every task commit:** Manual curl/inspect verification
- **After every plan wave:** Manual verification
- **Before `/gsd:verify-work`:** Manual UAT verification
- **Max feedback latency:** N/A

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-----------------|-------------|--------|
| TBD | 01 | 1 | SEO-01, SEO-04 | Manual | curl + HTML inspect | N/A | ⬜ pending |
| TBD | 02 | 1 | SEO-02 | Manual | curl sitemap.xml | N/A | ⬜ pending |
| TBD | 03 | 1 | SEO-03 | Manual | curl robots.txt | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No test framework — all verification is manual
- [ ] curl commands documented for each endpoint
- [ ] HTML inspection steps documented for meta tags

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Set meta title/description via UI | SEO-01 | Requires UI interaction | 1. Open blog editor 2. Click SEO button 3. Enter meta title/description 4. Re-publish 5. Inspect HTML source |
| View sitemap.xml | SEO-02 | Endpoint check | `curl http://localhost:8080/host/{username}/sitemap.xml` — verify XML structure |
| View robots.txt | SEO-03 | Endpoint check | `curl http://localhost:8080/host/{username}/robots.txt` — verify content |
| Inspect OG/Twitter meta tags | SEO-04 | HTML inspection | View page source, search for og:title, og:description, og:image, twitter:card |
| Social share preview | SEO-04 | External rendering | Paste URL in Twitter Card validator |

---

## Validation Sign-Off

- [ ] All tasks have manual verification documented
- [ ] curl commands for all GET endpoints
- [ ] HTML inspection steps for meta tag verification
- [ ] No automated test framework required for this phase
- [ ] `nyquist_compliant: true` set in frontmatter (manual-only is acceptable)

**Approval:** pending
