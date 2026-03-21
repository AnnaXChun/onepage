# Pitfalls Research

**Domain:** Drag-and-Drop Website Builder SaaS with AI Generation
**Researched:** 2026-03-21
**Confidence:** LOW (Web search API unavailable; findings from training data and industry pattern knowledge)

## Critical Pitfalls

### Pitfall 1: AI Generation Produces Unusable Output Without Validation Gates

**What goes wrong:**
AI-generated website content is often misaligned with user intent, uses wrong tone, or generates blocks that do not match the template structure. Users receive pages that look nothing like what they described.

**Why it happens:**
The LangChain workflow skips validation between stages (image analysis -> style extraction -> content generation -> block mapping). Each stage compounds errors from the previous stage. Without human-in-the-loop checkpoints, bad output propagates unchecked to the editor.

**How to avoid:**
- Implement a preview/approval step before content commits to the database
- Add confidence scoring for AI outputs; require human confirmation when confidence < threshold
- Validate generated content matches template block schema before rendering
- Allow users to regenerate specific blocks without re-running entire pipeline

**Warning signs:**
- Users frequently regenerate the same page multiple times
- Support tickets mention "AI didn't understand my description"
- Generated content does not match the selected template structure

**Phase to address:**
Phase 2 (AI Generation Pipeline) - Add validation gates between LangChain stages

---

### Pitfall 2: Drag-and-Drop State Desync With Backend Persistence

**What goes wrong:**
Users drag and reorder blocks in the editor, but the final published page shows incorrect block order. Or blocks disappear entirely after reordering. Data loss that users attribute to "the builder is broken."

**Why it happens:**
Frontend state management (React component tree) diverges from backend persistence (database block order array). Optimistic UI updates without proper reconciliation, or race conditions between drag events and auto-save triggers.

**How to avoid:**
- Use a deterministic block ordering system (explicit position field, not array index)
- Debounce auto-save to prevent race conditions (500ms after last drag event)
- Persist intermediate state to localStorage as backup
- Implement proper rollback on save failure

**Warning signs:**
- Block order differs between editor preview and published page
- Users report blocks "vanishing" after reorder
- Network errors during save cause unrecoverable state loss

**Phase to address:**
Phase 3 (Block Editor) - Implement robust state persistence before drag features ship

---

### Pitfall 3: MiniMax API Latency Blocks the Entire UI

**What goes wrong:**
AI generation requests to MiniMax API take 5-15 seconds. The entire frontend freezes or shows broken loading states. Users think the app is broken and refresh, triggering duplicate requests.

**Why it happens:**
Synchronous API call pattern where the UI waits for AI response before allowing further interaction. No streaming response, no background processing, no progress indication.

**How to avoid:**
- Implement async job pattern: submit generation request -> poll for result -> notify user when ready
- Use server-side job queue (RabbitMQ already in stack) for AI tasks
- Show progressive loading states with estimated wait time
- Allow users to continue editing other parts while AI generates

**Warning signs:**
- Users report "spinning" or frozen screens during AI generation
- Duplicate API calls from page refreshes during long waits
- Timeout errors in server logs

**Phase to address:**
Phase 2 (AI Generation Pipeline) - Never make AI calls synchronous

---

### Pitfall 4: PDF Export Produces Broken or Incomplete Output

**What goes wrong:**
Generated PDFs are blank, show wrong content, or have formatting issues (text overflow, missing images, broken layouts). Paid feature fails silently and users are charged.

**Why it happens:**
PDF generation libraries render the page at a fixed viewport. Dynamic content, lazy-loaded images, or CSS that works in-browser fails in headless rendering. No quality gate before charging users.

**How to avoid:**
- Generate PDF server-side using headless Chrome/Puppeteer with proper viewport configuration
- Wait for all images and fonts to load before capture
- Add PDF preview before charging
- Implement retry logic for failed renders
- Charge only after successful generation, not on job creation

**Warning signs:**
- Support tickets: "PDF is blank" or "PDF looks wrong"
- Refund requests for failed PDF generations
- PDF generation jobs stuck in queue

**Phase to address:**
Phase 4 (PDF Export) - Test extensively with each template before enabling paid feature

---

### Pitfall 5: Template Block Schema Mismatch With Editor Assumptions

**What goes wrong:**
Some blocks in templates are not draggable, not reorderable, or not deletable despite appearing in the editor UI. Users try to remove a block and it does not respond.

**Why it happens:**
Blocks are implemented inconsistently - some are "structural" (header, footer), some are "content" (text, image). The editor assumes all blocks behave the same way. Incomplete implementation of block type behaviors.

**How to avoid:**
- Define explicit block type taxonomy: structural (fixed), content (editable), layout (draggable)
- Document which operations each block type supports
- Gray out or hide controls for unsupported operations
- Test each template with full edit cycle (add, delete, reorder, configure)

**Warning signs:**
- Users report "I can't delete this block"
- Template preview in gallery differs from editor behavior
- Certain blocks always stay at same position regardless of drag attempts

**Phase to address:**
Phase 3 (Block Editor) - Complete block type taxonomy and consistent behavior before launch

---

### Pitfall 6: 500 QPS Cache Stampede on Cache Miss

**What goes wrong:**
Cold cache after deployment or cache expiry causes thundering herd. 500+ simultaneous requests hit the database when popular template listing or blog view cache expires. Database falls over.

**Why it happens:**
All requests see cache miss simultaneously, all hit database. No cache warming, no request coalescing, no graceful degradation.

**How to avoid:**
- Implement cache warming on startup and before expiry
- Use probabilistic early expiration (stale-while-revalidate pattern)
- Add request coalescing: first request fetches, others wait for result
- Implement circuit breaker with fallback to stale data
- Set cache TTL with jitter to prevent synchronized expiry

**Warning signs:**
- Database connection pool exhaustion under load
- Latency spikes aligned with cache TTL expiry times
- All 500 QPS hitting MySQL simultaneously

**Phase to address:**
Phase 5 (Performance Optimization) - Load test with cache disabled to simulate cold cache

---

### Pitfall 7: AI Prompt Injection Through User Content Fields

**What goes wrong:**
Malicious users input prompt injection payloads into text fields (bio, about me, blog content). The AI assistant interprets these as system prompts, modifying behavior or extracting context from other users.

**Why it happens:**
User content is fed directly to AI without sanitization. No prompt isolation between user content and system instructions in LangChain chain.

**How to avoid:**
- Never include user content in system prompts without sandboxing
- Use separate prompt templates for each AI task with explicit input/output schema
- Validate and sanitize user content before AI consumption
- Implement output filtering for AI-generated content displayed to other users

**Warning signs:**
- Unusual AI response patterns (responding to "instructions" in user text)
- AI generating content that references other users
- Anomalous token usage spikes

**Phase to address:**
Phase 2 (AI Generation Pipeline) - Security review of AI integration before launch

---

### Pitfall 8: Click-to-Edit Content Edits Wrong Block

**What goes wrong:**
Users click intending to edit text block A, but block B is selected due to z-index or overlay issues. Users unknowingly modify content they did not intend to change.

**Why it happens:**
Overlay elements (sticky headers, floating toolbars, modal backdrops) intercept clicks. Block boundary detection fails when blocks have overlapping regions or transparent backgrounds.

**How to avoid:**
- Implement proper click target hierarchy with explicit hit areas
- Ensure editing toolbar/focus is visually connected to selected block
- Use focus rings to clearly indicate which block is active
- Test with all templates at multiple viewport sizes

**Warning signs:**
- Users report "I clicked on X but Y changed"
- Undo history shows unexpected edits
- Inconsistent selection behavior across templates

**Phase to address:**
Phase 3 (Block Editor) - User testing with real users before launch

---

### Pitfall 9: Published Page Differs From Editor Preview

**What goes wrong:**
What user sees in editor preview does not match the published page. Fonts load differently, images shift, colors look different. User publishes expecting a result and gets something unexpected.

**Why it happens:**
Editor loads fonts and assets from different sources or with different timing than published domain. CSS specificity differs between preview and production domains. No screenshot-based visual regression testing.

**How to avoid:**
- Serve preview from same domain/cdn as published pages
- Use identical font loading strategy in preview and production
- Implement visual diff testing: capture preview, compare to published
- Include "screenshot preview" before publish using headless browser

**Warning signs:**
- Support tickets: "looks different when I published"
- Visual inconsistencies between preview URL and production URL
- Font fallback chain differences between environments

**Phase to address:**
Phase 3 (Block Editor) - Preview fidelity validation

---

### Pitfall 10: LangChain Chain State Leakage Between Requests

**What goes wrong:**
User A's generation request influences User B's generation result. User A describes a tech blog, User B asks for a wedding site, and User B's site has tech blog content.

**Why it happens:**
LangChain chain/callback handlers are not properly isolated per request. Shared state in LangChain memory objects or improper session scoping.

**How to avoid:**
- Create new chain instance per request
- Never share memory/buffer objects between requests
- Use request-scoped dependency injection for LangChain components
- Validate AI output matches the specific user's input before returning

**Warning signs:**
- Users receive content that does not match their description
- AI generations reference other users' data
- Cross-contamination of style/mood between different users' sites

**Phase to address:**
Phase 2 (AI Generation Pipeline) - Security review of LangChain session isolation

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store block order as array indices | Simple to implement | Breaks on concurrent edits, requires re-indexing | Never - use explicit position field |
| Client-side AI calls directly to MiniMax | Fast to ship | Exposes API key, no server-side control | Never for production |
| Single CSS file for all templates | Shared styling | Style leakage, specificity wars | MVP only, refactor per-template |
| Poll MongoDB/repo for job status | Simple implementation | Database load, eventual consistency issues | MVP only, use proper message queue |
| Local storage for draft autosave | No backend work | Data loss on device clear, no sync | Backup only, not primary persistence |
| Hardcoded template block mappings | Fast to iterate | Brittle, breaks when templates change | MVP only with tests |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| MiniMax API | Calling synchronously, blocking UI | Async job pattern with polling |
| MiniMax API | No timeout configuration | Set 30s timeout, implement retry with exponential backoff |
| MiniMax API | Passing user content in system prompt | Sandboxed prompt templates with explicit input schemas |
| LangChain | Sharing chain instances | New chain per request, request-scoped DI |
| LangChain | No output validation | Validate response schema before using output |
| RabbitMQ | Not handling dead letters | Configure DLQ with retry limits |
| RabbitMQ | Fire-and-forget message publishing | Use confirm mode, handle publisher confirms |
| Redis Cache | No cache invalidation strategy | Define invalidation triggers, use cache tags |
| Redis Cache | Storing large objects | Store only IDs, fetch from DB on miss |
| MySQL | N+1 queries for block fetching | Use batch fetch with IN clause |
| MySQL | No index on share_code | Add index immediately, verify with EXPLAIN |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous AI calls | UI freeze, timeout errors | Async job queue pattern | Any AI generation >2s |
| No connection pooling | Connection exhaustion | Configure HikariCP pool size = CPU cores + effective DB threads | >50 concurrent users |
| Full template render on each view | High latency, CPU spike | Cache rendered HTML in Redis | >100 concurrent views |
| Auto-save on every keystroke | Excessive writes, database load | Debounce to 500ms, batch writes | Any active user |
| No query result caching | Repeated expensive queries | Cache blog view results with TTL | Any caching layer failure |
| Large session objects | Memory pressure, GC pauses | Stateless session, JWT only | >1000 concurrent users |
| Blocking I/O in request thread | Thread starvation | Use async frameworks, non-blocking I/O | >200 concurrent requests |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Storing API keys in code | Key exposure, unauthorized usage | Environment variables, secret management service |
| No rate limiting on AI endpoints | Cost overrun, DoS | Rate limit per user, monthly quota enforcement |
| Direct file upload without validation | Malicious file upload | Validate file type, scan with ClamAV, sandbox storage |
| No CSRF protection on state-changing endpoints | Cross-site request forgery | Spring Security CSRF tokens, SameSite cookies |
| Exposing internal error messages | Information disclosure | Global exception handler, sanitize stack traces |
| No input sanitization on AI prompts | Prompt injection | Sandboxed prompts, output filtering |
| Sharing JWT secret across instances | Token forgery | Unique secret per deployment, proper rotation |
| No audit log for billing operations | Dispute resolution difficulty | Log all payment events with idempotency keys |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No undo/redo for block operations | Mistakes require manual correction | Implement command pattern with undo stack |
| Drag preview shows wrong position | User confusion, wrong reorder | Show ghost at actual drop position |
| AI generation has no progress indication | User thinks app is broken | Show stages: "Analyzing image... Generating content... Building page..." |
| Delete confirmation only on final step | Accidental deletion of work | Autosave drafts, confirm before publish, show recovery option |
| Block insertion has no visual feedback | User does not know where block will appear | Show insertion indicator line during drag |
| Click-to-edit focus is unclear | User does not know what is editable | Highlight editable elements on hover, show cursor change |
| Template gallery loads slowly | User abandonment | Lazy load thumbnails, skeleton loading states |
| Mobile editor is broken | Users cannot edit on mobile | Responsive editor, or warn users desktop recommended |
| Published URL is not shown clearly | Users cannot find their site | Prominent "View Site" button, copy link action |

---

## "Looks Done But Isn't" Checklist

- [ ] **AI Generation:** Often missing retry logic — verify generation fails gracefully with user notification
- [ ] **AI Generation:** Often missing output validation — verify generated content matches template schema
- [ ] **Drag-and-Drop:** Often missing keyboard accessibility — verify Tab navigation and Enter to drop works
- [ ] **Block Editor:** Often missing undo/redo — verify command stack is persisted
- [ ] **Block Editor:** Often missing mobile touch events — verify drag works on touch devices
- [ ] **PDF Export:** Often has font embedding issues — verify fonts render correctly in PDF
- [ ] **PDF Export:** Often has image loading issues — verify images appear in PDF
- [ ] **Caching:** Often has stale data issues — verify cache invalidation works on updates
- [ ] **Autosave:** Often loses data on network failure — verify failed saves are recovered
- [ ] **Preview:** Often differs from published — verify visual parity before publish button

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| AI generates bad content | LOW | User clicks regenerate; no data loss permanent |
| Block order desync | MEDIUM | Restore from localStorage backup; implement reconciliation job |
| PDF generation failure | MEDIUM | Refund user; log failure for investigation; retry with different params |
| Cache stampede | HIGH | Disable affected endpoint; warm cache manually; implement circuit breaker |
| Prompt injection | HIGH | Audit logs; revoke exposed sessions; patch prompt isolation |
| Published page differs from preview | LOW | User re-publishes; investigate preview fidelity gap |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| AI unusable output without validation | Phase 2: AI Generation Pipeline | User testing with diverse inputs |
| Drag-and-drop state desync | Phase 3: Block Editor | Test reorder with concurrent edits |
| MiniMax API UI blocking | Phase 2: AI Generation Pipeline | Measure perceived latency during generation |
| PDF broken output | Phase 4: PDF Export | Test all templates, verify with real users |
| Block schema mismatch | Phase 3: Block Editor | Complete block taxonomy before drag features |
| Cache stampede | Phase 5: Performance | Load test with cache disabled |
| Prompt injection | Phase 2: AI Generation Pipeline | Security review, penetration testing |
| Click-to-edit wrong block | Phase 3: Block Editor | User testing, accessibility audit |
| Preview/publish diff | Phase 3: Block Editor | Visual regression testing |
| LangChain state leakage | Phase 2: AI Generation Pipeline | Integration test with concurrent users |

---

## Sources

**Note:** Web search API was unavailable during research. Findings are based on training data (up to 2024-06) and industry pattern knowledge. All findings should be verified with current sources before implementation.

- React DnD library known issues (training data)
- LangChain documentation on session isolation (training data)
- High concurrency SaaS patterns (training data)
- Website builder post-mortems (training data)
- MiniMax API integration considerations (training data)

---

*Pitfalls research for: Drag-and-Drop Website Builder SaaS with AI Generation*
*Researched: 2026-03-21*
