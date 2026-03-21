---
phase: 08-pdf-export
plan: 01
subsystem: backend
tags: [rabbitmq, redis, pdf, credits, security]

# Dependency graph
requires:
  - phase: 07-credit-system
    provides: Credit deduction service, CreditLockService, user_credits table
provides:
  - Atomic credit deduction BEFORE PDF generation (no free PDFs on failure)
  - Ownership validation on PDF download/preview endpoints (403 for wrong user)
  - Scheduled cleanup of expired PDFs (daily at 2 AM)
  - Atomic credit deduction at controller level BEFORE job queuing
affects:
  - Phase 09 (platform-hosting) - PDF export used for published sites

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Redis distributed lock for atomic credit operations
    - Scheduled task with @Scheduled annotation
    - Ownership validation via job record lookup

key-files:
  created:
    - backend/src/main/java/com/onepage/service/PdfJobService.java
  modified:
    - backend/src/main/java/com/onepage/messaging/PdfJobConsumer.java
    - backend/src/main/java/com/onepage/controller/PdfController.java
    - backend/src/main/java/com/onepage/service/PdfGenerationService.java
    - backend/src/main/java/com/onepage/service/UserCreditsService.java

key-decisions:
  - "Credit deduction in PdfJobConsumer happens BEFORE PDF generation to prevent race condition"
  - "Credit deduction at controller level BEFORE queuing provides immediate feedback on insufficient credits"
  - "Redis lock used for both controller-level and consumer-level credit operations"

patterns-established:
  - "Scheduled cleanup pattern: @Scheduled cron + @PostConstruct onStartup"
  - "Ownership validation pattern: lookup job, check userId match, check status"

requirements-completed: [PDF-01]

# Metrics
duration: ~15min
completed: 2026-03-21
---

# Phase 08 Plan 01: PDF Export Security & Cleanup Summary

**Credit deduction atomicity, ownership validation, and scheduled cleanup for PDF export**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-21T14:24:01Z
- **Completed:** 2026-03-21
- **Tasks:** 4
- **Files modified:** 5

## Accomplishments

- Fixed critical race condition: credit deduction now happens BEFORE PDF generation in consumer
- Added ownership validation to PDF download and preview endpoints (403 for unauthorized access)
- Added scheduled cleanup for expired PDFs (daily at 2 AM + startup cleanup)
- Implemented atomic credit deduction at controller level before job queuing

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix credit deduction BEFORE PDF generation in PdfJobConsumer** - `8430ac3` (fix)
2. **Task 2: Add ownership validation to PDF download endpoint** - `4f11d1c` (feat)
3. **Task 3: Add scheduled cleanup job for expired PDFs** - `45e3734` (feat)
4. **Task 4: Update PdfController export endpoint to deduct credits before queuing** - `87fb252` (feat)

**Plan metadata:** (see above commits)

## Files Created/Modified

- `backend/src/main/java/com/onepage/messaging/PdfJobConsumer.java` - Credit deduction moved before PDF generation, refund on failure
- `backend/src/main/java/com/onepage/controller/PdfController.java` - Ownership validation, atomic credit deduction, job creation
- `backend/src/main/java/com/onepage/service/PdfGenerationService.java` - @Scheduled daily cleanup, @PostConstruct startup cleanup
- `backend/src/main/java/com/onepage/service/PdfJobService.java` - New service for job tracking and ownership validation
- `backend/src/main/java/com/onepage/service/UserCreditsService.java` - Added getPdfCost() method

## Decisions Made

- Used Redis lock for atomic credit operations at both controller and consumer level
- Credit deduction at controller level gives immediate feedback; consumer-level deduction provides safety net
- Previews stored in Redis with 1h TTL, exports stored in filesystem with 24h cleanup

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- PDF export security fixes complete (credit atomicity, ownership validation, cleanup)
- Ready for Phase 08 Plan 02 (PDF export frontend) or next phase

---
*Phase: 08-pdf-export*
*Completed: 2026-03-21*
