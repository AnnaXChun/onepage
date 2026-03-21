---
phase: 06-ai-generation-editor-polish
plan: '01'
subsystem: ai-generation
tags: [stomp, websocket, minmax, rabbitmq, confidence-scoring]

# Dependency graph
requires:
  - phase: 05-infrastructure-scale
    provides: RabbitMQ async job processing, Redis caching
provides:
  - AIGenerationService.parseAndAssemble() returns blocks with confidence scores
  - BlockAssemblyService persists blocks to blog via blogService.updateBlogBlocks()
  - WebSocketConfig enables STOMP messaging on /topic prefix
  - GenerationModal uses STOMP client to subscribe to /topic/progress/{blogId}
  - Preview mode with Accept/Cancel/Regenerate per block
  - Per-block regeneration endpoint via /api/v1/generate/regenerate/{blogId}/{blockIndex}
affects:
  - phase: 07-credit-system (depends on AI generation pipeline)

# Tech tracking
tech-stack:
  added: [@stomp/stompjs for STOMP WebSocket client]
  patterns:
    - STOMP over SockJS for real-time progress updates
    - Confidence scoring heuristic (0.85 substantial, 0.70 brief, 0.0 empty)
    - Block type mapping from AI output to editor block types

key-files:
  created:
    - backend/src/main/java/com/onepage/config/WebSocketConfig.java
  modified:
    - backend/src/main/java/com/onepage/service/AIGenerationService.java
    - backend/src/main/java/com/onepage/service/BlockAssemblyService.java
    - backend/src/main/java/com/onepage/controller/AIGenerationController.java
    - backend/src/main/java/com/onepage/messaging/GenerationMessageProducer.java
    - backend/src/main/java/com/onepage/messaging/GenerationMessageConsumer.java
    - backend/src/main/java/com/onepage/config/SecurityConfig.java
    - frontend/src/components/Editor/GenerationModal.tsx
    - frontend/src/components/Editor/SortableBlock.tsx
    - frontend/src/components/Editor/BlockRenderer.tsx

key-decisions:
  - "Used STOMP over SockJS for cross-browser WebSocket compatibility"
  - "Confidence scoring: 0.85 for substantial content (50+ chars), 0.70 for brief, 0.0 for empty"
  - "Block assembly generates UUID for each block id when persisting to blog"

patterns-established:
  - "STOMP broker on /topic for server-to-client push messaging"
  - "Preview mode allows user to accept/cancel/regenerate before committing blocks"

requirements-completed: [GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, WRT-01, WRT-02, WRT-03]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 6 Plan 1: AI Generation Pipeline Summary

**Complete AI generation pipeline end-to-end: parse MiniMax JSON with confidence scoring, persist blocks via STOMP WebSocket progress, preview/reject/regenerate flow**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T13:25:21Z
- **Completed:** 2026-03-21T13:28:46Z
- **Tasks:** 6 committed tasks
- **Files modified:** 12 files across frontend and backend

## Accomplishments

- Implemented parseAndAssemble() to parse MiniMax JSON with confidence scoring
- BlockAssemblyService now persists blocks to blog.blocks via blogService.updateBlogBlocks()
- Created WebSocketConfig with STOMP broker on /topic prefix
- Fixed GenerationModal to use @stomp/stompjs Client instead of plain WebSocket
- Added preview mode with Accept/Cancel/Regenerate per block options
- Propagated confidence prop through SortableBlock -> BlockRenderer -> TextBlock

## Task Commits

Each task was committed atomically:

1. **Task 1: parseAndAssemble()** - `2c59e7c` (feat)
2. **Task 2: BlockAssemblyService** - `64d578f` (feat)
3. **Task 3: WebSocketConfig** - `548623c` (feat)
4. **Task 4: GenerationModal STOMP** - `7ae0d86` (feat)
5. **Task 5: preview flow** - `03825e0` (feat)
6. **Task 6-7: confidence propagation** - `6f47e01` (fix)

## Files Created/Modified

- `backend/src/main/java/com/onepage/config/WebSocketConfig.java` - STOMP broker config
- `backend/src/main/java/com/onepage/service/AIGenerationService.java` - parseAndAssemble implementation
- `backend/src/main/java/com/onepage/service/BlockAssemblyService.java` - block persistence to blog
- `backend/src/main/java/com/onepage/controller/AIGenerationController.java` - per-block regeneration endpoint
- `backend/src/main/java/com/onepage/messaging/GenerationMessageProducer.java` - RegenerateMessage type
- `backend/src/main/java/com/onepage/messaging/GenerationMessageConsumer.java` - handles RegenerateMessage
- `backend/src/main/java/com/onepage/config/SecurityConfig.java` - added /ws/** permit
- `frontend/src/components/Editor/GenerationModal.tsx` - STOMP client + preview mode
- `frontend/src/components/Editor/SortableBlock.tsx` - pass confidence to BlockRenderer
- `frontend/src/components/Editor/BlockRenderer.tsx` - forward confidence prop

## Decisions Made

- Used @stomp/stompjs Client over plain WebSocket for STOMP protocol support
- STOMP endpoint at /ws with SockJS fallback for browser compatibility
- Confidence < 0.7 triggers amber ring styling on TextBlock
- RegenerateMessage uses same queue as GenerationMessage but with blockIndex

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## Next Phase Readiness

AI generation pipeline is complete. Ready for Phase 7 (credit system) which builds on AI pipeline.

---
*Phase: 06-ai-generation-editor-polish*
*Completed: 2026-03-21*
