# Phase 3: AI Generation Pipeline - Research

**Researched:** 2026-03-21
**Domain:** Spring AI + MiniMax integration for page generation from images
**Confidence:** MEDIUM

## Summary

The AI Generation Pipeline requires integrating MiniMax (via OpenAI-compatible API) with Spring AI for content generation, but **MiniMax's chat API does not support image inputs**. This is a critical architectural constraint that requires a hybrid approach: client-side JavaScript for image color/mood analysis (using ColorThief or similar) and MiniMax for text generation. The existing RabbitMQ infrastructure is already configured for async processing, and Spring AI 1.0.0-M6 provides the OpenAI-compatible client needed for MiniMax integration.

**Primary recommendation:** Use client-side color extraction + MiniMax text generation via Spring AI OpenAI client with custom base URL.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AI-01 | User uploads one main image + enters one-sentence description | ImageService already handles upload; need to add color extraction client-side |
| AI-02 | AI extracts RGB color palette and mood keywords from uploaded image | **MiniMax does NOT support image inputs** - must use client-side JS (ColorThief) |
| AI-03 | AI generates complete page content (title, paragraphs, image placements, block layout) | Spring AI + MiniMax OpenAI-compatible endpoint supports text generation |
| AI-04 | Generated content is placed into editable blocks in the editor | Existing BlockState structure supports this via setBlocks() |
| AI-05 | Generation runs async as background job; user can edit other content | RabbitMQ blog.generate.queue already configured; need consumer |
| AI-06 | Generation progress indicator shown to user | WebSocket or SSE for progress updates from async job |
| AI-07 | Generated content has confidence score; low-confidence blocks highlighted | Include confidence in block metadata; frontend renders highlight |
| WRT-01 | Each text block has inline "AI Write" button (sparkle icon) | TextBlock.tsx needs AI button addition |
| WRT-02 | Click AI Write button generates content based on existing text | MiniMax chat completion with existing text as context |
| WRT-03 | Generated text replaces or appends to existing text (user choice: "Replace" / "Append") | UI modal needed; API parameter controls mode |
| WRT-04 | AI Write uses Spring AI + MiniMax API | Spring AI OpenAI client + MiniMax OpenAI-compatible endpoint |
| WRT-05 | Each text block has independent AI generation context | Request-scoped context per block ID |
| ORCH-01 | Spring AI orchestrates pipeline: Image Analysis → Style Extraction → Content Generation → Block Assembly | Orchestrator service coordinates stages |
| ORCH-02 | Each pipeline stage has validation gate before proceeding | Validate each stage output before next stage |
| ORCH-03 | Pipeline stages are request-scoped; no state leakage between requests | Use ThreadLocal or request-scoped beans |
| ORCH-04 | Pipeline result includes structured block data (type, content, position, style) | Structured BlockGenerationResult DTO |

## User Constraints (from CONTEXT.md)

*No CONTEXT.md exists for this phase. All decisions are open for research.*

## Standard Stack

### Core Dependencies (need to add to pom.xml)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| spring-ai-openai-spring-boot-starter | 1.0.0-M6 | OpenAI-compatible client for MiniMax | Maven Central |
| spring-ai-starter-websocket | 1.0.0-M6 | WebSocket support for progress updates | Maven Central |

### Client-Side Color Extraction

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| colorthief | 2.3.2 | Extract dominant colors from image | Lightweight, no dependencies |
| vibrant.js | 0.1.0 | Extract color palette (dominant, muted) | Works with canvas |

### Alternative: Server-Side Vision API

If MiniMax adds vision support in future, use their `understand_image` MCP tool. Currently not viable.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side color extraction | Python microservice for vision | Adds infrastructure; not worth it for just color extraction |
| ColorThief | quantize.js (median cut) | ColorThief is simpler and well-tested |
| Spring AI | Direct HTTP client (RestTemplate/WebClient) | Spring AI provides abstraction, retries, structured outputs |
| WebSocket for progress | SSE (Server-Sent Events) | SSE simpler but unidirectional; WebSocket bidirectional |

## Architecture Patterns

### Recommended Project Structure

```
backend/src/main/java/com/onepage/
├── controller/
│   └── AIGenerationController.java    # Endpoints for generation triggers
├── service/
│   ├── AIGenerationService.java       # Main orchestrator (ORCH-01 to ORCH-04)
│   ├── ImageAnalysisService.java       # Color palette extraction (client-side)
│   ├── ContentGenerationService.java    # MiniMax text generation
│   ├── BlockAssemblyService.java       # Convert content to blocks
│   └── AIService.java                 # Existing stub - will be enhanced
├── dto/
│   ├── GenerationRequest.java          # { imageUrl, description }
│   ├── GenerationProgress.java         # { stage, progress, blockId, confidence }
│   ├── BlockGenerationResult.java      # { type, content, position, style, confidence }
│   └── AIWriteRequest.java            # { blockId, existingText, mode }
├── messaging/
│   ├── GenerationMessageProducer.java  # Sends to RabbitMQ
│   └── GenerationMessageConsumer.java  # Processes async generation
├── config/
│   ├── SpringAIConfig.java            # MiniMax OpenAI client configuration
│   └── WebSocketConfig.java           # For progress updates
└── exception/
    └── GenerationException.java        # Specific to AI generation failures
```

### Pattern 1: Async Pipeline with Validation Gates

**What:** Sequential stages where each stage validates output before proceeding.

**When to use:** AI-05, AI-06, ORCH-01, ORCH-02

**Example:**
```java
@Service
public class AIGenerationOrchestrator {
    public GenerationResult generate(Long blogId, String imageUrl, String description) {
        // Stage 1: Image Analysis (validation gate)
        ImageAnalysisResult colors = analyzeImage(imageUrl);
        if (colors == null || colors.getColors().isEmpty()) {
            throw GenerationException.imageAnalysisFailed("No colors extracted");
        }

        // Stage 2: Style Extraction (validation gate)
        StyleExtractionResult style = extractStyle(colors);
        if (!style.isValid()) {
            throw GenerationException.invalidStyle("Style extraction failed");
        }

        // Stage 3: Content Generation (validation gate)
        ContentGenerationResult content = generateContent(description, style);
        if (content == null || content.isEmpty()) {
            throw GenerationException.contentGenerationFailed("No content generated");
        }

        // Stage 4: Block Assembly (validation gate)
        List<BlockGenerationResult> blocks = assembleBlocks(content, style);
        if (blocks.isEmpty()) {
            throw GenerationException.assemblyFailed("No blocks produced");
        }

        return new GenerationResult(blocks);
    }
}
```

### Pattern 2: WebSocket Progress Updates

**What:** Real-time progress from async job to frontend.

**When to use:** AI-05, AI-06

**Example:**
```java
@MessageMapping("/generate-progress/{blogId}")
public void sendProgress(@DestinationVariable String blogId, String status) {
    messagingTemplate.convertAndSend("/topic/progress/" + blogId, status);
}
```

### Pattern 3: Request-Scoped Context

**What:** No state leakage between concurrent generation requests.

**When to use:** ORCH-03

**Implementation:** Use `ThreadLocal` or Spring's `@Scope("request")` for intermediate results.

```java
@Service
@Scope("request")
public class GenerationContext {
    private final ThreadLocal<ImageAnalysisResult> imageAnalysis = new ThreadLocal<>();
    private final ThreadLocal<StyleExtractionResult> styleExtraction = new ThreadLocal<>();
    // ... clear in @PreDestroy
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MiniMax API client | Raw HTTP calls | Spring AI OpenAI client | Handles retries, timeouts, structured outputs, streaming |
| Color extraction | Custom image processing | ColorThief + vibrant.js | Well-tested, handles edge cases, no native deps |
| Progress tracking | Polling endpoint | WebSocket + SSE | Real-time, less load than polling |
| JSON parsing for AI output | String manipulation | Spring AI JSON mode + structured output | Reliable parsing |
| Async job queue | Custom threading | RabbitMQ (already configured) | Already in infrastructure |

**Key insight:** MiniMax OpenAI-compatible endpoint supports JSON mode for structured outputs, eliminating need for complex parsing.

## Common Pitfalls

### Pitfall 1: MiniMax Vision Misconception

**What goes wrong:** Assuming MiniMax chat API supports image inputs (it does NOT).

**Why it happens:** MiniMax has image generation but not vision/image analysis in their chat API.

**How to avoid:** Use client-side ColorThief for color extraction. For mood/keywords, describe image to MiniMax using image URL and ask it to infer style.

**Warning signs:** `UnsupportedMediaType` or `invalid_request` errors when sending base64 images to chat endpoint.

### Pitfall 2: Blocking the HTTP Request Thread

**What goes wrong:** AI generation blocks the HTTP request (30+ seconds timeout).

**Why it happens:** MiniMax API calls are synchronous; Spring defaults don't handle long-running requests well.

**How to avoid:** Use async processing via RabbitMQ (already configured). Return 202 Accepted immediately, WebSocket progress.

**Warning signs:** Request timeout errors, thread pool exhaustion.

### Pitfall 3: JSON Parsing Failures

**What goes wrong:** AI returns non-JSON or malformed JSON in response.

**Why it happens:** LLMs are non-deterministic; may return markdown code blocks or incomplete JSON.

**How to avoid:** Use Spring AI JSON mode with structured output support (`ResponseFormat.JSON`). Add validation with fallback.

**Warning signs:** `JsonProcessingException` in logs, null blocks in response.

### Pitfall 4: Missing Validation Gates

**What goes wrong:** Pipeline continues with invalid intermediate results, causing cascade failures.

**Why it happens:** Skipping validation for "good enough" intermediate results.

**How to avoid:** Each stage MUST validate output; throw specific exception if invalid; frontend handles gracefully.

**Warning signs:** NullPointerException in later stages, incomplete block generation.

## Code Examples

### Spring AI OpenAI Client Configuration

```java
@Configuration
public class SpringAIConfig {
    @Value("${minimax.api.key}")
    private String apiKey;

    @Bean
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel).build();
    }

    @Bean
    public OpenAiApi openAiApi() {
        return OpenAiApi.builder()
            .baseUrl("https://api.minimax.io/v1")
            .apiKey(apiKey)
            .build();
    }

    @Bean
    public ChatModel chatModel(OpenAiApi openAiApi) {
        var openAi = OpenAiChatModel.builder()
            .openAiApi(openAiApi)
            .defaultOptions(OpenAiChatOptions.builder()
                .model("MiniMax-M2.7")
                .temperature(0.7)
                .build())
            .build();
        return openAi;
    }
}
```

### Application Properties

```properties
minimax.api.key=${MINIMAX_API_KEY}
spring.ai.openai.base-url=https://api.minimax.io/v1
spring.ai.openai.api-key=${MINIMAX_API_KEY}
```

### Color Extraction (Client-Side)

```typescript
// frontend/src/utils/colorExtraction.ts
import ColorThief from 'colorthief';

export async function extractColors(imageUrl: string): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const colorThief = new ColorThief();
      const palette = colorThief.getPalette(img, 5);
      const hexColors = palette.map(([r, g, b]) =>
        `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`
      );
      resolve(hexColors);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
```

### AI Write Assist API Call

```typescript
// frontend/src/services/aiApi.ts
export async function aiWrite(
  blockId: string,
  existingText: string,
  mode: 'replace' | 'append'
): Promise<string> {
  const response = await api.post('/api/ai/write', {
    blockId,
    existingText,
    mode
  });
  return response.data.content;
}
```

### Block Assembly with Confidence

```java
public record BlockGenerationResult(
    BlockType type,
    String content,
    int position,
    Map<String, Object> style,
    float confidence
) {}

public List<BlockGenerationResult> assembleBlocks(
    ContentGenerationResult content,
    StyleExtractionResult style
) {
    List<BlockGenerationResult> blocks = new ArrayList<>();

    // Title block (high confidence - direct extraction)
    blocks.add(new BlockGenerationResult(
        BlockType.TEXT_H1,
        content.getTitle(),
        0,
        style.getTitleStyle(),
        0.95f
    ));

    // Paragraph blocks (medium confidence - AI generated)
    for (int i = 0; i < content.getParagraphs().size(); i++) {
        blocks.add(new BlockGenerationResult(
            BlockType.TEXT_PARAGRAPH,
            content.getParagraphs().get(i),
            i + 1,
            style.getParagraphStyle(),
            0.75f
        ));
    }

    // Image placement (low confidence - inferred)
    blocks.add(new BlockGenerationResult(
        BlockType.IMAGE_SINGLE,
        style.getSuggestedImageUrl(),
        2,
        Map.of("aspectRatio", "16:9"),
        0.55f  // Low - AI is guessing
    ));

    return blocks;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct API integration | Spring AI abstraction | Now | Portable to other providers if needed |
| Blocking sync calls | Async via RabbitMQ | Now | UI stays responsive |
| String parsing AI output | Structured JSON output | Now | Reliable parsing |
| Polling for status | WebSocket progress | Now | Real-time updates |

**Deprecated/outdated:**
- **Hardcoded color extraction on server**: Not viable with MiniMax; replaced by client-side extraction
- **Polling /status endpoint**: Replaced by WebSocket for progress

## Open Questions

1. **MiniMax Vision Support**
   - What we know: MiniMax MCP server has `understand_image` tool; chat API does NOT support images
   - What's unclear: Whether Token Plan MCP tools work with REST API or only in their playground
   - Recommendation: Implement with ColorThief now; monitor MiniMax for vision API updates

2. **Confidence Score Calibration**
   - What we know: We need to assign confidence to generated blocks
   - What's unclear: What threshold for "low confidence"? 0.6? 0.7?
   - Recommendation: Start with 0.7 threshold; user testing will refine

3. **Progress Update Frequency**
   - What we know: Need real-time progress for stages
   - What's unclear: How often to send updates without overwhelming WebSocket
   - Recommendation: Send on stage start, stage completion, and every 5 seconds during generation

4. **Fallback if ColorThief Fails**
   - What we know: ColorThief requires canvas and cross-origin
   - What's unclear: What if image fails to load or CORS blocks it?
   - Recommendation: Provide default palette (grays, neutral tones) and let user override

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 + Mockito (existing Spring Boot test setup) |
| Config file | None - using existing test infrastructure |
| Quick run command | `mvn test -Dtest=AIGenerationServiceTest` |
| Full suite command | `mvn test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| AI-02 | Extract colors from uploaded image | Unit | `ColorExtractionTest` | No - needs creation |
| AI-03 | Generate content via MiniMax | Unit | `ContentGenerationServiceTest` | No - needs creation |
| AI-04 | Place content into blocks | Unit | `BlockAssemblyServiceTest` | No - needs creation |
| AI-05 | Async job via RabbitMQ | Integration | `GenerationMessageConsumerTest` | No - needs creation |
| WRT-04 | MiniMax API returns valid text | Unit | `AIWriteServiceTest` | No - needs creation |
| ORCH-02 | Validation gates reject bad input | Unit | `AIGenerationOrchestratorTest` | No - needs creation |

### Sampling Rate
- **Per task commit:** `mvn test -Dtest=AIGenerationServiceTest -q`
- **Per wave merge:** `mvn test -q`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `backend/src/test/java/com/onepage/service/ColorExtractionTest.java` - Test client-side extraction logic
- [ ] `backend/src/test/java/com/onepage/service/ContentGenerationServiceTest.java` - Mock MiniMax API responses
- [ ] `backend/src/test/java/com/onepage/service/BlockAssemblyServiceTest.java` - Test block mapping
- [ ] `backend/src/test/java/com/onepage/service/AIGenerationOrchestratorTest.java` - Test validation gates
- [ ] `backend/src/test/java/com/onepage/messaging/GenerationMessageConsumerTest.java` - Test async processing
- [ ] Framework install: Spring AI test dependencies in pom.xml

## Sources

### Primary (HIGH confidence)
- [MiniMax Platform API Overview](https://platform.minimaxi.com/docs/api-reference/api-overview) - Authentication, available APIs
- [MiniMax OpenAI-Compatible API](https://platform.minimax.io/docs/api-reference/text-openai-api) - **CRITICAL: Image inputs NOT supported**
- [MiniMax Anthropic-Compatible API](https://platform.minimax.io/docs/api-reference/text-anthropic-api) - Same limitation
- [Spring AI Reference Documentation](https://docs.spring.io/spring-ai/reference/index.html) - OpenAI client configuration

### Secondary (MEDIUM confidence)
- [Spring AI OpenAI ChatModel](https://spring.io/projects/spring-ai) - General architecture, not MiniMax-specific
- [ColorThief npm package](https://www.npmjs.com/package/colorthief) - Client-side color extraction

### Tertiary (LOW confidence)
- MiniMax MCP `understand_image` tool availability - Not confirmed as REST-accessible

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Spring AI version (1.0.0-M6) is old but functional; MiniMax integration approach verified
- Architecture: HIGH - Patterns well-established; RabbitMQ already configured
- Pitfalls: MEDIUM - MiniMax limitation discovered via docs; fallback approach viable

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days - MiniMax API may evolve)
