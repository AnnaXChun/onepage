# Architecture Research

**Domain:** Drag-and-Drop Website Builder SaaS
**Researched:** 2026-03-21
**Confidence:** MEDIUM (derived from documented frameworks, open-source patterns, and official documentation; limited peer-reviewed sources)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Page Editor │  │  AI Assistant │  │  Preview     │                  │
│  │  (Drag-Drop) │  │  (Inline)     │  │  Renderer    │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                  │                           │
│         └─────────────────┼──────────────────┘                           │
│                           ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Editor State Store (Zustand/Context)             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            │ REST API + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVER LAYER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Auth        │  │  Blog        │  │  Payment     │                  │
│  │  Service     │  │  Service     │  │  Service     │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                  │                           │
│         └─────────────────┼──────────────────┘                           │
│                           ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    Spring Boot Application                           │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │ AI Pipeline  │  │ Static Site  │  │ PDF Export   │              │  │
│  │  │ (LangChain)  │  │ Generator    │  │ Service      │              │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  MySQL 8     │  │  Redis       │  │  RabbitMQ    │                  │
│  │  (Primary)   │  │  (Cache/     │  │  (Async      │                  │
│  │              │  │   Sessions)  │  │   Jobs)      │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| **Page Editor** | Drag-drop block manipulation, in-place editing, component selection | React + dnd-kit or react-dnd |
| **Editor State Store** | Page structure state, undo/redo history, selection state | Zustand or React Context + Reducer |
| **AI Assistant** | Inline content generation, style extraction | SpringAI + LangChain |
| **Preview Renderer** | Real-time page preview, breakpoint simulation | React iframe or shadow DOM |
| **AI Pipeline** | Orchestrates image analysis -> style extraction -> content generation -> block mapping | LangChain with MiniMax |
| **Static Site Generator** | Transform page data into deployable HTML/CSS | Custom template renderer |
| **PDF Export Service** | Generate PDF from rendered page | Puppeteer/Playwright headless |
| **Hosting Service** | Serve published sites on subdomain | CDN + object storage |

## Recommended Project Structure

```
backend/src/main/java/com/onepage/
├── controller/
│   ├── BlogController.java
│   ├── PaymentController.java
│   └── AIGenerateController.java       # NEW: AI generation endpoints
├── service/
│   ├── BlogService.java
│   ├── AI/
│   │   ├── AIGenerateService.java    # NEW: LangChain orchestration
│   │   ├── ImageAnalysisService.java  # NEW: Style extraction
│   │   └── ContentGeneratorService.java
│   ├── staticgen/
│   │   ├── StaticSiteGenerator.java   # NEW: HTML generation
│   │   └── TemplateRenderer.java       # NEW: Template processing
│   └── pdf/
│       └── PdfExportService.java      # NEW: PDF generation
├── model/
│   ├── Blog.java
│   ├── Block.java                     # NEW: Block component model
│   └── Template.java
├── dto/
│   ├── BlockDTO.java                  # NEW: Block data transfer
│   └── PageDTO.java                   # NEW: Full page structure
└── config/
    ├── LangChainConfig.java           # NEW: AI pipeline config
    └── RabbitMQConfig.java

frontend/src/
├── components/
│   ├── Editor/
│   │   ├── EditorCanvas.tsx           # NEW: Main editor area
│   │   ├── BlockRenderer.tsx          # NEW: Renders blocks
│   │   ├── BlockToolbar.tsx          # NEW: Block actions
│   │   ├── DragDropProvider.tsx      # NEW: dnd-kit wrapper
│   │   └── blocks/
│   │       ├── TextBlock.tsx
│   │       ├── ImageBlock.tsx
│   │       ├── SocialBlock.tsx
│   │       └── ContactBlock.tsx
│   ├── AIAssistant/
│   │   ├── InlineAIButton.tsx         # NEW: Per-block AI
│   │   └── AIWritePanel.tsx          # NEW: AI writing modal
│   └── Preview/
│       └── PreviewFrame.tsx           # NEW: Preview iframe
├── hooks/
│   ├── useEditorStore.ts              # NEW: Zustand store
│   ├── useDragDrop.ts                # NEW: Drag-drop logic
│   └── useAIAssist.ts                # NEW: AI generation hook
├── pages/
│   └── Editor/
│       └── PageEditor.tsx            # NEW: Full editor page
└── services/
    ├── api.ts
    ├── aiService.ts                   # NEW: AI API calls
    └── staticGenService.ts            # NEW: Static site API
```

### Structure Rationale

- **Editor/blocks/:** Block components are isolated for independent rendering in both editor and preview
- **AI/ folder:** AI services grouped by responsibility (pipeline, analysis, generation)
- **hooks/useEditorStore.ts:** Centralized state with Zustand for predictable updates
- **staticgen/:** Separated from core business logic for testability

## Architectural Patterns

### Pattern 1: Block Component Pattern

**What:** Page content is decomposed into typed blocks (Text, Image, Social, Contact) with consistent interfaces.

**When:** Building any structured content editor where users compose pages from predefined components.

**Trade-offs:**
- Pros: Consistent UX, easy to add new block types, clear serialization format
- Cons: Limited to block-based layouts (acceptable per project requirements)

**Example:**
```typescript
interface Block {
  id: string;
  type: 'text' | 'image' | 'social' | 'contact';
  content: BlockContent;  // Type-specific content
  style: BlockStyle;      // Shared styling properties
  order: number;
}

// Editor state shape
interface EditorState {
  blocks: Block[];
  selectedBlockId: string | null;
  history: { blocks: Block[] }[];
}
```

### Pattern 2: Drag-Drop Orchestration

**What:** Centralized manager coordinates sensors (input methods), modifiers (constraints), and droppable targets.

**When:** Implementing drag-and-drop with multiple input methods (mouse, touch, keyboard).

**Trade-offs:**
- Pros: Handles all input types uniformly, extensible via modifiers/plugins
- Cons: Adds abstraction layer complexity

**Example (dnd-kit style):**
```typescript
// Sensors abstract input methods
const mouseSensor = useSensor(SensorMeta.Mouse, {
  activationConstraint: { distance: 5 },
});
const touchSensor = useSensor(SensorMeta.Touch, {
  activationConstraint: { delay: 250, tolerance: 5 },
});

// DragOverlay for visual feedback
<DragOverlay>
  {activeBlock && <BlockRenderer block={activeBlock} isDragging />}
</DragOverlay>
```

### Pattern 3: LangChain Pipeline Pattern

**What:** AI workflow chains image analysis -> style extraction -> content generation -> block mapping as sequential steps with typed outputs.

**When:** Multi-step AI generation where each step's output feeds the next.

**Trade-offs:**
- Pros: Clear debugging, easy to modify steps, built-in streaming/checkpointing
- Cons: More latency than single-step generation, infrastructure overhead

**Example:**
```java
// LangChain chain definition
Chain chain = Chain.Builder
  .pipe(imageAnalysisStep)      // Extract mood/colors from image
  .pipe(styleMappingStep)       // Map to template styles
  .pipe(contentGenerationStep)  // Generate text content
  .pipe(blockMappingStep)      // Create Block objects
  .build();

// Streaming response for UX
chain.stream(input).subscribe(chunk -> {
  // Progressive UI updates
});
```

### Pattern 4: Optimistic UI with Server Reconciliation

**What:** Update local state immediately, then sync with server. On conflict, server wins and local state corrects.

**When:** Interactive editors where responsiveness matters more than perfect consistency.

**Trade-offs:**
- Pros: Instant feedback, handles network latency gracefully
- Cons: Requires careful conflict resolution, potential brief inconsistencies

**Example:**
```typescript
// Optimistic block reorder
function moveBlockUp(blockId: string) {
  const previousBlocks = store.getState().blocks;

  // Optimistic update
  store.dispatch({ type: 'MOVE_BLOCK_UP', blockId });

  // Server sync
  api.reorderBlocks(blockId, 'up')
    .catch(() => {
      // Rollback on failure
      store.setState({ blocks: previousBlocks });
    });
}
```

### Pattern 5: Template-Output Separation

**What:** Template defines structure/rendering; content data defines page structure. Render at request time or build time.

**When:** Multiple output formats needed (preview, published site, PDF) from same data.

**Trade-offs:**
- Pros: Single source of truth, consistent across outputs
- Cons: Template bugs affect all outputs, rendering complexity

## Data Flow

### AI Generation Flow

```
[User uploads image + text]
         │
         ▼
┌─────────────────────────────────────────┐
│  1. Image Analysis (MiniMax Vision)     │
│     - Extract dominant colors           │
│     - Identify mood/aesthetic          │
│     - Output: StyleMetadata            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. Style Mapping                       │
│     - Match StyleMetadata to template   │
│     - Select component styles           │
│     - Output: TemplateStyle             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Content Generation (MiniMax LLM)   │
│     - Generate text for each block     │
│     - Respect template block types     │
│     - Output: BlockContent[]            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  4. Block Assembly                      │
│     - Create Block objects              │
│     - Assign styles + content          │
│     - Output: Block[]                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  5. Persist + Preview                   │
│     - Save to database                 │
│     - Render in editor                 │
└─────────────────────────────────────────┘
```

### Page Publishing Flow

```
[User clicks Publish]
         │
         ▼
┌─────────────────────────────────────────┐
│  1. Generate Static Site                │
│     - Load page data + template         │
│     - Render HTML + inline CSS          │
│     - Optimize assets                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  2. Upload to Storage                  │
│     - Upload to object storage (OSS)   │
│     - Set cache headers                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  3. Update DNS/CDN                      │
│     - Invalidate CDN cache             │
│     - Verify subdomain routing         │
└─────────────────────────────────────────┘
```

### Request Flow (Page View)

```
[Visitor requests username.vibe.com]
         │
         ▼
┌─────────────────────────────────────────┐
│  CDN Edge                              │
│  - Check cache (Redis)                │
│  - HIT: Return cached HTML            │
│  - MISS: Continue to origin           │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Origin Server                          │
│  - Load from OSS if not cached         │
│  - Apply edge caching                  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
[Static HTML + CSS returned]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith sufficient; single Spring Boot instance; single MySQL |
| 1k-10k users | Add Redis for full-page caching; read replicas for MySQL |
| 10k-100k users | CDN for static assets; multiple Spring Boot instances behind LB; Redis cluster |
| 100k+ users | Consider static site pre-generation at publish time; edge caching strategy |

### Scaling Priorities

1. **First bottleneck: Database reads**
   - Blog page views are cacheable (500 QPS requirement)
   - Solution: Redis full-page cache with 24h TTL (already in place)

2. **Second bottleneck: AI generation latency**
   - LangChain chains add sequential latency
   - Solution: Async job queue for generation; webhook/polling for results

3. **Third bottleneck: Static site generation**
   - Publish-time CPU intensive
   - Solution: Background job via RabbitMQ; horizontal scaling of worker nodes

## Anti-Patterns

### Anti-Pattern 1: Storing Rendered HTML in Database

**What people do:** Pre-render pages to HTML strings and store in `blog.html_content` column.

**Why it's wrong:** Cache invalidation becomes complex; hard to edit published content; version control on templates breaks stored HTML.

**Do this instead:** Store structured Block data; render at request time or publish time.

### Anti-Pattern 2: Direct DOM Manipulation in Editor

**What people do:** Use `contentEditable` or direct `ref.current.innerHTML` for text editing.

**Why it's wrong:** State diverges from DOM; undo/redo breaks; cross-platform behavior inconsistent.

**Do this instead:** Use controlled components with hidden text areas or contentEditable backed by React state.

### Anti-Pattern 3: Blocking AI Generation

**What people do:** Wait for full AI generation before showing any UI.

**Why it's wrong:** Poor UX for long generations (10-30 seconds); user abandonment.

**Do this instead:** Stream generation progress; show skeleton blocks; allow editing while AI runs.

### Anti-Pattern 4: Monolithic AI Prompts

**What people do:** Single huge prompt with all instructions for generating entire page.

**Why it's wrong:** Token limits; inconsistent outputs; hard to debug which step failed.

**Do this instead:** Use LangChain pipeline with discrete steps and typed outputs between steps.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| MiniMax API | LangChain with custom parsers | SpringAI provides abstraction; implement custom output parsers for structured generation |
| WeChat Pay | Existing REST endpoints | Already integrated; no changes needed |
| CDN/OSS | Object storage + invalidation API | Use Tencent Cloud COS + CDN for production |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Editor <-> Spring Boot | REST API + WebSocket | REST for CRUD; WebSocket for AI progress streaming |
| AI Pipeline <-> Block Store | Direct service call | No queue needed for generation under 30s |
| Static Generator <-> CDN | Async job (RabbitMQ) | Publish is background job; return immediately to UX |

## Build Order Implications

Given dependencies between components:

```
Phase 1: Block Editor Foundation
├── Implement Block component model
├── Create EditorState store (Zustand)
├── Build basic drag-drop with dnd-kit
└── REST endpoints for block CRUD

Phase 2: Template Rendering
├── Create TemplateRenderer service
├── Implement static HTML generation
├── Backend template system
└── Preview iframe in editor

Phase 3: AI Generation Pipeline
├── LangChain integration with MiniMax
├── Image analysis step
├── Content generation step
└── Block assembly step

Phase 4: Publishing + Hosting
├── Static site upload to OSS
├── Subdomain DNS routing
├── CDN cache invalidation
└── PDF export with Puppeteer

Phase 5: Polish + Scale
├── Redis full-page caching for published sites
├── Edge caching strategy
└── Performance optimization
```

**Critical path:** Phase 1 must complete before Phase 2; Phase 2 before Phase 3 is optional (AI can be added anytime); Phase 4 depends on Phase 2.

## Sources

- GrapesJS Documentation (https://www.grapesjs.com/docs/) - Page builder architecture patterns
- dnd-kit Documentation (https://dndkit.com/) - Drag-and-drop React architecture
- LangChain Concepts (https://docs.langchain.com/) - AI pipeline orchestration
- Vercel Documentation (https://vercel.com/docs) - Static site deployment patterns
- Redis Caching Documentation (https://redis.io/docs/) - Cache strategies
- MDN Web Performance (https://developer.mozilla.org/en-US/docs/Learn/Performance) - Performance optimization

---
*Architecture research for: Drag-and-Drop Website Builder SaaS*
*Researched: 2026-03-21*
