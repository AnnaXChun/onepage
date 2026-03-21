# Stack Research — v1.1 Additions

**Domain:** Single-page website builder SaaS with AI generation, editor polish, payments, and hosting
**Researched:** 2026-03-21
**Confidence:** MEDIUM

## Executive Summary

The v1.0 stack is complete for core features. v1.1 requires **minimal additions** — primarily WebSocket infrastructure for real-time AI progress, a form library for the configuration panel, and a PDF preview component. Most features can be completed with existing infrastructure (RabbitMQ for async, MiniMax via Spring AI for generation, Flying Saucer for PDF).

## What Stays the Same (v1.0 Stack Validated)

| Technology | Current Version | Status | Notes |
|------------|-----------------|--------|-------|
| React | 18.2.0 | Keep | Stable, no upgrade needed |
| Vite | 5.0.8 | Keep | Fast, well-supported |
| TailwindCSS | 3.3.6 | Keep | Matches design skill guidelines |
| TypeScript | 5.4 | Keep | Already integrated |
| Spring Boot | 3.2.0 | Keep | Stable, all starters available |
| MyBatis-Plus | 3.5.5 | Keep | Active record pattern working |
| dnd-kit | 6.3.1 | Keep | Already in use |
| Zustand | 5.0.12 | Keep | Temporal middleware working |
| ColorThief | 3.3.1 | Keep | Color extraction working |
| Spring AI | 1.0.0-M6 | Keep | MiniMax integration working |
| Flying Saucer | 9.3.1 | Keep | PDF generation working |
| WeChat Pay SDK | 0.0.3 | Keep | Already integrated |
| RabbitMQ | - | Keep | Already configured for async jobs |

---

## New Additions for v1.1

### 1. WebSocket — Real-time AI Generation Progress

**Frontend:**
| Library | Version | Purpose |
|---------|---------|---------|
| @stomp/stompjs | 7.3.0 | STOMP over WebSocket client |
| sockjs-client | 1.6.2 | SockJS fallback for non-WebSocket environments |

**Backend:**
No new Maven dependency needed — `spring-boot-starter-websocket` is already a transitive dependency of `spring-boot-starter-web` in Spring Boot 3.x.

**Why STOMP over socket.io:**
- STOMP is native to Spring's WebSocket implementation
- Spring Security integrates with STOMP out-of-the-box
- No custom server implementation needed
- Works with Spring's `@MessageMapping` annotated controllers

**Why not socket.io:**
- Requires custom server (not native to Spring)
- More complex authentication integration
- Additional maintenance burden

**Configuration Required (Backend):**
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefix("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins("*").withSockJS();
    }
}
```

**Security Update:**
Add `/ws/**` to permitted paths in SecurityConfig.

---

### 2. React Hook Form — Configuration Panel

**Frontend:**
| Library | Version | Purpose |
|---------|---------|---------|
| react-hook-form | 7.71.2 | Form state management |
| @hookform/resolvers | 5.2.2 | Validation resolver support |

**Why needed:**
The block configuration panel (right sidebar) requires form handling for block settings (alignment, colors, visibility, etc.). react-hook-form provides:
- Lightweight (no Redux-like overhead)
- Built-in validation
- Uncontrolled inputs (better performance)
- Integration with existing Zod validation

**Why not Redux Form or Formik:**
- Too heavy for this use case
- Zustand is already in use for editor state
- react-hook-form is the modern standard for React forms

**Alternative:** Plain React state — acceptable if panel is simple, but react-hook-form scales better.

---

### 3. PDF Preview — React PDF Rendering

**Frontend:**
| Library | Version | Purpose |
|---------|---------|---------|
| react-pdf | 3.4.1 | In-browser PDF preview |

**Why needed:**
PDF export completion requires preview before charge. User should see PDF in a modal before confirming download/credit deduction.

**Alternative considered: pdfjs-dist**
- Lower-level (Mozilla's PDF.js)
- More boilerplate for React integration
- react-pdf provides better React component API

**Note:** react-pdf requires a PDF worker. Configure in your app entry:
```tsx
import { PdfWorker } from 'react-pdf';
PdfWorker.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
```

---

### 4. AI Pipeline Completion (Implementation, Not Libraries)

No new libraries needed. The existing stack handles the full pipeline:

| Component | Current Status | What's Needed |
|-----------|---------------|---------------|
| ColorThief | Working (3.3.1) | Extracts dominant colors client-side |
| MiniMax via Spring AI | Working (1.0.0-M6) | Generate block content from prompts |
| Image upload | Working | Send to backend for analysis |
| Block assembly | Stub in AIService | Implement prompt engineering for full page |

**Implementation approach:**
1. Client uploads image, ColorThief extracts palette
2. Image + palette sent to `/api/ai/generate` endpoint
3. RabbitMQ queues job for async processing
4. MiniMax analyzes image and generates block content (structured JSON)
5. WebSocket pushes progress updates to client
6. Blocks assembled and returned for editor

**No additional AI libraries needed.** Spring AI ChatClient handles prompts; MiniMax provides generation.

---

### 5. Hosting — Subdomain Routing (No Libraries)

Subdomain routing is a **deployment concern**, not a library concern.

**What's needed:**
1. **DNS configuration** — Wildcard CNAME record pointing to server
2. **Spring Boot request routing** — Filter requests by subdomain
3. **Blog lookup** — Map subdomain to blog shareCode

**Implementation:**
```java
@Component
public class SubdomainFilter extends OncePerRequestFilter {
    @Override
    protected void doFilterInternal(HttpServletRequest request, ...) {
        String host = request.getHeader("Host");
        String subdomain = extractSubdomain(host); // e.g., "user1" from "user1.onepage.com"
        if (subdomain != null && !subdomain.equals("www")) {
            // Look up blog by subdomain, forward to blog controller
        }
    }
}
```

**No new libraries needed.** Spring MVC handles routing.

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| socket.io | Requires custom server; Spring native STOMP is sufficient | @stomp/stompjs |
| Redux / MobX | Zustand is sufficient; heavy for this use case | Zustand (existing) |
| react-query | Not needed for this app's server state complexity | Zustand + existing API layer |
| Builder.io / GrapesJS | Full frameworks; overkill for block editing | Existing dnd-kit + React |
| LangChain4j | Spring AI is sufficient for linear pipeline | Spring AI ChatClient |
| iText 7 | AGPL license; Flying Saucer is working | Flying Saucer (existing) |

---

## Installation Commands

```bash
# Frontend
npm install @stomp/stompjs sockjs-client react-hook-form @hookform/resolvers react-pdf

# Backend
# No new dependencies — spring-boot-starter-websocket is transitive
# Just add @Configuration class to enable
```

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @stomp/stompjs@7.3.0 | React 18, SockJS 1.6.x | TypeScript types included |
| sockjs-client@1.6.2 | All modern browsers | WebSocket fallback |
| react-hook-form@7.71.2 | React 18 | UseFormContext for complex forms |
| @hookform/resolvers@5.2.2 | react-hook-form@7.x | Supports Zod |
| react-pdf@3.4.1 | React 18 | Worker loaded separately |

---

## Sources

| Technology | Source | Confidence |
|-----------|--------|------------|
| Spring WebSocket | [docs.spring.io/spring-framework/reference/web/websocket](https://docs.spring.io/spring-framework/reference/web/websocket.html) | HIGH |
| Spring STOMP | [docs.spring.io/spring-framework/reference/web/websocket/stomp](https://docs.spring.io/spring-framework/reference/web/websocket/stomp.html) | HIGH |
| @stomp/stompjs | npm registry (verified 7.3.0) | HIGH |
| react-hook-form | npm registry (verified 7.71.2) | HIGH |
| react-pdf | npm registry (verified 3.4.1) | HIGH |

---

*Stack research for: Vibe Onepage v1.1 additions*
*Researched: 2026-03-21*
