---
phase: 5
slug: polish-performance
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | JMeter 5.6+ |
| **Config file** | `jmeter/blog-share-500qps.jmx` |
| **Quick run command** | `jmeter -n -t jmeter/blog-share-500qps.jmx -l results.jtl` |
| **Full suite command** | `jmeter -n -t jmeter/blog-share-500qps.jmx -f -l results.jtl -e -o report` |
| **Estimated runtime** | ~300 seconds (5 min sustained load) |

---

## Sampling Rate

- **After every task commit:** Quick smoke test (100 requests)
- **After every plan wave:** Full 5-minute load test at 500 QPS
- **Before `/gsd:verify-work`:** JMeter summary shows >99% success rate at 500 QPS
- **Max feedback latency:** 5 minutes (sustained load test duration)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | PERF-02 | config | grep "maximum-pool-size: 50" backend/src/main/resources/application.yml | ✅ | ⬜ pending |
| 05-01-02 | 01 | 1 | PERF-04 | config | grep "templates" backend/src/main/resources/application.yml | ✅ | ⬜ pending |
| 05-02-01 | 02 | 1 | PERF-01 | load | jmeter -n -t jmeter/blog-share-500qps.jmx | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 1 | PERF-05 | manual | Verify RabbitMQ queues exist | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jmeter/blog-share-500qps.jmx` — JMeter test plan for 500 QPS on blog share endpoint
- [ ] `jmeter/templates-list-500qps.jmx` — JMeter test plan for 500 QPS on template listing endpoint
- [ ] JMeter installation: `brew install jmeter` (macOS) or download from apache.org

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Redis cache TTL 24h | PERF-02 | Requires Redis introspection | `redis-cli TTL template:*` after template listing call |
| Database index scan | PERF-03 | Requires EXPLAIN query | `EXPLAIN SELECT * FROM blogs WHERE share_code = 'xxx'` |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 300s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
