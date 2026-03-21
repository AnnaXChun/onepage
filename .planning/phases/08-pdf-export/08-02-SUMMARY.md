---
phase: 08-pdf-export
plan: 02
subsystem: api
tags: [redis, rabbitmq, pdf, watermarking]

# Dependency graph
requires:
  - phase: 07-credit-system
    provides: Credit deduction flow, UserCreditsService
provides:
  - PdfJob entity with status/expiresAt tracking
  - 1h expiring preview URL via Redis TTL
  - Preview PDF with watermark via generatePdfPreview()
affects:
  - 09-platform-hosting
  - 10-payments

# Tech tracking
tech-stack:
  added: [Redis TTL for preview expiry]
  patterns: [PdfJob tracking with status state machine]

key-files:
  created:
    - backend/src/main/java/com/onepage/model/PdfJob.java
    - backend/src/main/java/com/onepage/mapper/PdfJobMapper.java
    - backend/src/main/java/com/onepage/service/PdfJobService.java
  modified:
    - backend/src/main/resources/schema.sql
    - backend/src/main/java/com/onepage/dto/PdfPreviewResponse.java
    - backend/src/main/java/com/onepage/controller/PdfController.java
    - backend/src/main/java/com/onepage/service/PdfGenerationService.java
    - backend/src/main/java/com/onepage/messaging/PdfJobConsumer.java

key-decisions:
  - "Used Redis TTL for preview expiry (1h) instead of scheduled cleanup for immediate expiration"
  - "PdfJob record created at preview request time with expiresAt=now+1h"
  - "Preview stored in Redis with key pdf:preview:{jobId} and 1h TTL"

patterns-established:
  - "PdfJob state machine: 0=pending, 1=completed, 2=failed"

requirements-completed: [PDF-02, PDF-03]

# Metrics
duration: 15min
completed: 2026-03-21
---

# Phase 08 Plan 02: PDF Preview with Expiry Summary

**PdfJob entity with Redis-backed 1h expiring preview URLs and ownership validation**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-21T14:24:59Z
- **Completed:** 2026-03-21T14:40:00Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- Created PdfJob entity and mapper for persistent job tracking with expiresAt
- Added expiresAt field to PdfPreviewResponse for frontend display
- Implemented 1h expiring preview URLs via Redis TTL
- Added ownership validation to preview and download endpoints
- Preview PDFs contain watermark text via generatePdfPreview()

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PdfJob entity and mapper** - `6c3ed49` (feat)
2. **Task 2: Update PdfPreviewResponse with expiresAt** - `452c8ed` (feat)
3. **Task 3: Implement 1h expiring preview URL** - `8cba40d` (feat)

**Plan metadata:** `4f11d1c` (docs: complete plan)

## Files Created/Modified

- `backend/src/main/java/com/onepage/model/PdfJob.java` - PdfJob entity with userId, blogId, jobType, status, expiresAt
- `backend/src/main/java/com/onepage/mapper/PdfJobMapper.java` - MyBatis-Plus BaseMapper for PdfJob
- `backend/src/main/java/com/onepage/service/PdfJobService.java` - Job CRUD operations
- `backend/src/main/resources/schema.sql` - Added pdf_jobs table with indexes
- `backend/src/main/java/com/onepage/dto/PdfPreviewResponse.java` - Added expiresAt and downloadUrl fields
- `backend/src/main/java/com/onepage/controller/PdfController.java` - Preview endpoint, ownership validation
- `backend/src/main/java/com/onepage/service/PdfGenerationService.java` - Redis storage, watermark support
- `backend/src/main/java/com/onepage/messaging/PdfJobConsumer.java` - Redis storage on job completion

## Decisions Made

- Used Redis TTL (Duration.ofHours(1)) for preview expiry - immediate expiration without scheduled cleanup
- Created PdfJob record at preview request time with jobType=1, status=0, expiresAt=now+1h
- Preview served from Redis via `/api/pdf/preview/{jobId}` endpoint with ownership check

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- PdfJob infrastructure complete for tracking PDF jobs
- Redis preview storage ready for Phase 09-10 integration
- Ownership validation prevents unauthorized PDF access

---
*Phase: 08-pdf-export*
*Completed: 2026-03-21*
