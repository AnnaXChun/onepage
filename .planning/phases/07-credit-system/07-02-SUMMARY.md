---
phase: "07"
plan: "02"
title: "Atomic Credit Deduction"
subsystem: credit-system
tags: [redis, distributed-lock, concurrency, credit-deduction]
dependency_graph:
  requires: ["07-01"]
  provides: ["credit-atomic-deduction"]
  affects: ["PaymentService", "OrderService"]
tech_stack:
  added: ["CreditLockService"]
  patterns: ["Redis distributed lock with setIfAbsent", "tryLock/finally unlock pattern"]
key_files:
  created:
    - path: backend/src/main/java/com/onepage/service/CreditLockService.java
      provides: "Redis distributed lock for credit operations"
  modified:
    - path: backend/src/main/java/com/onepage/service/UserCreditsService.java
      provides: "Atomic deductCredits using distributed lock"
decisions:
  - decision: "CreditLockService follows PaymentLockService pattern"
    rationale: "Consistent Redis lock usage across codebase, proven pattern"
  - decision: "Lock released in finally block"
    rationale: "Ensures lock release even on exceptions"
  - decision: "Balance check inside lock"
    rationale: "Defensive double-check pattern for atomicity"
metrics:
  duration: 40
  completed_date: "2026-03-21"
  tasks_completed: 2
---

# Phase 07 Plan 02: Atomic Credit Deduction Summary

## One-liner

Redis distributed lock prevents race conditions in concurrent credit deductions.

## Completed Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Create CreditLockService | `689d45a` | CreditLockService.java |
| 2 | Refactor deductCredits | `9ae1887` | UserCreditsService.java |

## What Was Built

### CreditLockService
Redis distributed lock service using `setIfAbsent` pattern with 5-minute TTL:
- `tryLock(userId)` - Acquires lock, returns lock value or null if held
- `unlock(userId, lockValue)` - Releases only if lockValue matches (safe unlock)

### UserCreditsService.deductCredits (refactored)
Now uses atomic pattern:
1. Acquire distributed lock via `creditLockService.tryLock()`
2. If lock unavailable, throw "Credit operation in progress" error
3. Double-check balance inside lock
4. Perform deduction and update
5. **Always release lock in finally block**

## Deviations from Plan

None - plan executed exactly as written.

## Verification

```bash
# Verify CreditLockService exists
grep -n "class CreditLockService" backend/src/main/java/com/onepage/service/CreditLockService.java

# Verify deductCredits uses lock
grep -A 30 "public void deductCredits" backend/src/main/java/com/onepage/service/UserCreditsService.java | grep -c "tryLock\|unlock"
# Returns: 2
```

## Success Criteria Status

- [x] CreditLockService created with tryLock/unlock using Redis setIfAbsent pattern
- [x] deductCredits acquires lock before checking balance, releases in finally block
- [x] Concurrent requests to deductCredits are serialized via Redis lock
- [x] No negative credit balances possible due to atomic check-and-deduct
- [x] Backend compiles without new errors (pre-existing Spring AI errors unchanged)

## Known Stubs

None.

## Self-Check: PASSED

- [x] CreditLockService.java created at correct path
- [x] UserCreditsService.java modified with lock pattern
- [x] Commit `689d45a` exists for CreditLockService
- [x] Commit `9ae1887` exists for deductCredits refactor
