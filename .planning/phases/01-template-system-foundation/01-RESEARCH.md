# Phase 1: Template System Foundation - Research

**Researched:** 2026-03-21
**Domain:** Template block structure declaration, template-editor integration contract
**Confidence:** MEDIUM-HIGH

## Summary

Phase 1 establishes the block declaration layer: each template gets a `blocks.json` that the Phase 2 block editor will consume to render editable React components. The current system uses static placeholder tokens (`{{USER_NAME}}`, `{{USER_BIO}}`, etc.) replaced via string substitution. The new system needs to preserve backward compatibility with existing placeholder tokens while adding a typed block manifest that the editor can parse into a component tree.

The key insight is that `blocks.json` is a **contract between template HTML and the React block editor**: it declares an ordered list of blocks (with type, CSS selector, defaultContent) that the editor uses to know (1) what blocks exist, (2) where in the DOM each block lives, (3) what default content to show, and (4) what editing interactions to enable.

**Primary recommendation:** Use a hybrid approach -- blocks.json declares typed blocks with CSS selectors, existing template HTML remains unchanged, and the editor reads blocks.json to overlay React components onto matching DOM elements using those selectors.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use Blog / Resume / Personal Intro as template categories (not personal/tech/portfolio)
- **D-02:** Template categorization:
  - Portfolio: Gallery, Creative
  - Personal Intro: Vintage, Ultra, Paper, Zen, Minimal
  - Blog: Retro, Glass, Neon
- **D-03:** Each template has a `blocks.json` file declaring its block components
- **D-04:** Each block entry contains: `type`, `placeholder` token, `defaultContent` string
- **D-05:** Supported block types: Text (H1, H2, paragraph, list), Image (single, gallery), Social Links, Contact Form, Divider

### Claude's Discretion

- Schema design details for blocks.json (selector strategy, config fields, order handling)
- TemplateGallery integration (how it passes block data to editor)
- Backend API design for template metadata

### Deferred Ideas

None -- discussion stayed within phase scope.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TPL-01 | 10 fixed templates across Blog, Resume, Personal Intro categories | Update templates.ts category field; 10 template dirs already exist |
| TPL-02 | Templates define block component structure (Text, Image, Social Links, Contact) | blocks.json schema per template with typed block entries |
| TPL-03 | Template categories displayed in gallery with animated preview cards | TemplateGallery.tsx already working; needs category filter update |
| TPL-04 | Free vs paid template flag; paid templates show price (1-10 RMB) | templates.ts already has isPremium + price; TPL-04 largely done |
| TPL-05 | Template thumbnail preview before selection | TemplateGallery already has preview mode with iframe |

---

## Standard Stack

No new libraries needed for Phase 1. The phase is primarily data/file structure work.

| Item | Version | Purpose | Notes |
|------|---------|---------|-------|
| (none) | - | - | Phase 1 is file structure / data modeling, no new dependencies |

**Existing frontend stack (from CLAUDE.md):** React 18 + Vite + TailwindCSS
**Existing backend stack (from CLAUDE.md):** SpringBoot 3 + MyBatis-Plus + MySQL 8 + Redis + RabbitMQ

---

## Architecture Patterns

### Recommended Project Structure

```
frontend/public/templates/
  {slug}/
    index.html        # Template HTML with {{PLACEHOLDER}} tokens
    styles.css        # Template-specific styles
    script.js         # Template-specific JS (animations, interactions)
    metadata.json     # Existing: name, description, category, tags, author
    blocks.json       # NEW: ordered list of typed blocks
    preview.md        # Existing: ASCII wireframe
```

### Pattern 1: blocks.json Schema

**What:** The block manifest file that bridges template HTML and the React block editor.

**Schema:**
```json
{
  "version": "1.0",
  "blocks": [
    {
      "id": "user-name",
      "type": "text-h1",
      "selector": ".name",
      "placeholder": "{{USER_NAME}}",
      "defaultContent": "Your Name",
      "config": {}
    },
    {
      "id": "user-bio",
      "type": "text-paragraph",
      "selector": ".bio",
      "placeholder": "{{USER_BIO}}",
      "defaultContent": "Welcome to my personal blog",
      "config": {}
    },
    {
      "id": "user-image",
      "type": "image-single",
      "selector": ".profile-image",
      "placeholder": "{{USER_IMAGE}}",
      "defaultContent": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=800&fit=crop",
      "config": {
        "aspectRatio": "1/1",
        "rounded": true
      }
    },
    {
      "id": "blog-content",
      "type": "text-container",
      "selector": ".content",
      "placeholder": "{{BLOG_CONTENT}}",
      "defaultContent": "",
      "config": {
        "allowedBlockTypes": ["text-h1", "text-h2", "text-paragraph", "text-list", "image-single", "divider"]
      }
    }
  ]
}
```

**Field semantics:**
- `id`: Unique block identifier within the template
- `type`: Block type enum (from D-05: `text-h1`, `text-h2`, `text-paragraph`, `text-list`, `image-single`, `image-gallery`, `social-links`, `contact-form`, `divider`)
- `selector`: CSS selector for locating the block's DOM element in the rendered HTML
- `placeholder`: Legacy token used in template HTML (for backward compatibility with existing preview rendering)
- `defaultContent`: Initial content string for the block
- `config`: Block-type-specific configuration (e.g., aspect ratio for images, allowed block types for containers)

**Block type hierarchy:**
```
text
  text-h1       → <h1> elements
  text-h2       → <h2> elements
  text-paragraph → <p> elements
  text-list     → <ul>/<ol> elements

image
  image-single  → single <img> elements
  image-gallery → container of multiple images

social-links    → social icon + link containers
contact-form    → form elements
divider         → <hr> or decorative separators

text-container  → special: contains multiple allowed block types (e.g., {{BLOG_CONTENT}} area)
```

### Pattern 2: TemplateGallery Integration

**What:** TemplateGallery fetches blocks.json when a template is selected, passing it to the editor route.

**Flow:**
1. User clicks template card
2. TemplateGallery enters preview mode, renders iframe with HTML+CSS (existing behavior)
3. TemplateGallery also fetches `/templates/{slug}/blocks.json` in background
4. When user clicks "Use Template", navigates to `/editor` with `{ template, blocksJson, uploadedImage }` in location state
5. Editor reads blocks.json and constructs block component tree

**Why this approach:** Keeps TemplateGallery changes minimal (just fetch + pass through), defers block rendering to Phase 2 editor.

### Pattern 3: Backward Compatibility with Placeholder Tokens

**What:** Existing template HTML uses `{{USER_NAME}}` etc. tokens. The preview iframe in TemplateGallery continues to use simple string substitution (existing behavior). The blocks.json approach layers typed block awareness on top.

**Template preview (existing, unchanged):**
```typescript
// TemplateGallery.tsx line 46-51
const modifiedHtml = htmlText
  .replace(/{{USER_IMAGE}}/g, userImage)
  .replace(/{{USER_NAME}}/g, 'Your Name')
  .replace(/{{USER_BIO}}/g, 'Welcome to my personal blog')
  .replace(/{{BLOG_CONTENT}}/g, '<p>Your blog content will appear here...</p>')
  .replace('</head>', `<style>${cssText}</style></head>`);
```

**Editor preview (Phase 2):**
- Fetches blocks.json, renders React block components
- Components get their initial content from `defaultContent`
- CSS selector in blocks.json tells editor which DOM element each block controls

### Pattern 4: Category Update in templates.ts

**What:** Update `TEMPLATE_CATEGORIES` and category field values from `personal/tech/portfolio` to `Blog/Resume/Personal Intro`.

**Current (from templates.ts):**
```typescript
export const TEMPLATE_CATEGORIES = ['all', 'personal', 'tech', 'portfolio'] as const;
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
```

**New mapping (D-01 + D-02):**
| Old Category | New Category |
|--------------|--------------|
| personal | Personal Intro |
| tech | (Blog category) |
| portfolio | Portfolio |

Template slugs mapped:
- `minimal-simple` → Personal Intro (was: personal)
- `gallery-display` → Portfolio (was: personal)
- `vintage-style` → Personal Intro (was: personal)
- `ultra-minimal` → Personal Intro (was: personal)
- `creative-card` → Portfolio (was: portfolio)
- `paper-fold` → Personal Intro (was: personal)
- `retro-wave` → Blog (was: personal)
- `glass-morphism` → Blog (was: tech)
- `neon-pulse` → Blog (was: tech)
- `zen-minimal` → Personal Intro (was: personal)

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Block type enumeration | Custom string constants | TypeScript union type or enum | Type safety, autocomplete |
| Block DOM location | XPath or coordinate-based | CSS selectors | Standard, works with Shadow DOM |
| Block ordering | Implicit by DOM order | Explicit `order` field in blocks.json | Allows reordering without DOM changes |

---

## Common Pitfalls

### Pitfall 1: Mismatched CSS Selectors
**What goes wrong:** Editor cannot find block DOM elements because selectors in blocks.json don't match actual HTML.
**Why it happens:** Template HTML evolves independently from blocks.json.
**How to avoid:** Each template directory has both files committed together; selector is validated against index.html during PR review.
**Warning signs:** Editor shows empty blocks or wrong content for a template.

### Pitfall 2: blocks.json / HTML Drift
**What goes wrong:** Placeholder tokens in HTML don't match those declared in blocks.json.
**Why it happens:** Two separate files for the same template.
**How to avoid:** blocks.json `placeholder` field must exactly match the token string used in index.html. Treat as a contract.
**Warning signs:** Preview shows literal `{{PLACEHOLDER}}` strings instead of content.

### Pitfall 3: Wrong Category Granularity
**What goes wrong:** User confusion from mixing "Resume" and "Personal Intro" in same flow.
**Why it happens:** D-01 decision says Blog / Resume / Personal Intro -- but 10 templates are split as Portfolio (2) + Personal Intro (5) + Blog (3). Resume is NOT represented by any template in the 10.
**How to avoid:** Accept the current 10-template set as-is; Resume category will be empty until Phase 2+ templates are added. The category filter should show categories that have at least 1 template.

### Pitfall 4: TemplateGallery Backward Compatibility Break
**What goes wrong:** Changing categories or adding blocks.json reference breaks existing template preview.
**Why it happens:** templates.ts category values are referenced in filter logic; blocks.json is fetched asynchronously.
**How to avoid:** Keep existing placeholder replacement logic in TemplateGallery intact; add blocks.json fetch as additive behavior.
**Warning signs:** Template preview renders empty or shows raw placeholder strings.

---

## Code Examples

### Adding blocks.json to a Template Directory

File: `frontend/public/templates/minimal-simple/blocks.json`

```json
{
  "version": "1.0",
  "blocks": [
    {
      "id": "user-image",
      "type": "image-single",
      "selector": ".profile-image",
      "placeholder": "{{USER_IMAGE}}",
      "defaultContent": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=800&fit=crop",
      "config": {
        "aspectRatio": "1/1",
        "rounded": true
      }
    },
    {
      "id": "user-name",
      "type": "text-h1",
      "selector": ".name",
      "placeholder": "{{USER_NAME}}",
      "defaultContent": "Your Name",
      "config": {}
    },
    {
      "id": "user-bio",
      "type": "text-paragraph",
      "selector": ".bio",
      "placeholder": "{{USER_BIO}}",
      "defaultContent": "Welcome to my personal blog",
      "config": {}
    },
    {
      "id": "blog-content",
      "type": "text-container",
      "selector": ".content",
      "placeholder": "{{BLOG_CONTENT}}",
      "defaultContent": "<p>Your blog content will appear here...</p>",
      "config": {
        "allowedBlockTypes": ["text-h1", "text-h2", "text-paragraph", "text-list", "image-single", "divider"]
      }
    }
  ]
}
```

### Updating TemplateConfig Type

File: `frontend/src/config/templates.ts`

```typescript
export type TemplateCategory = 'all' | 'Blog' | 'Resume' | 'Personal Intro' | 'Portfolio';
export const TEMPLATE_CATEGORIES: TemplateCategory[] = ['all', 'Blog', 'Resume', 'Personal Intro', 'Portfolio'];

export interface TemplateConfig {
  id: number;
  slug: string;
  name: string;
  description: string;
  thumbnail: string;
  category: Exclude<TemplateCategory, 'all'>;
  isPremium: boolean;
  price: number;
  tags: string[];
  color: string;
  blocksJsonPath?: string; // Added in Phase 1: relative path to blocks.json
}
```

### Fetching blocks.json in TemplateGallery

```typescript
// In TemplateGallery.tsx, alongside existing template fetch
const [blocksJson, setBlocksJson] = useState<BlockManifest | null>(null);

useEffect(() => {
  if (!selectedTemplate) return;
  fetch(`/templates/${selectedTemplate.slug}/blocks.json`)
    .then(r => r.json())
    .then(setBlocksJson)
    .catch(() => setBlocksJson(null));
}, [selectedTemplate]);

// Pass to editor on "Use Template"
navigate('/editor', {
  state: { template: selectedTemplate, blocksJson, uploadedImage }
});
```

### TypeScript Block Type Definitions

```typescript
// frontend/src/types/block.ts

export type BlockType =
  | 'text-h1' | 'text-h2' | 'text-paragraph' | 'text-list'
  | 'image-single' | 'image-gallery'
  | 'social-links' | 'contact-form' | 'divider'
  | 'text-container'; // special container block

export interface BlockConfig {
  aspectRatio?: string;
  rounded?: boolean;
  allowedBlockTypes?: BlockType[]; // for text-container
}

export interface BlockDefinition {
  id: string;
  type: BlockType;
  selector: string;
  placeholder: string;
  defaultContent: string;
  config: BlockConfig;
}

export interface BlockManifest {
  version: string;
  blocks: BlockDefinition[];
}
```

---

## Backend API Design (for Template Metadata)

**Context:** The backend `Template` model has a `config` TEXT field currently unused. The frontend currently uses static `templates.ts` config. For Phase 1, templates remain frontend-only. Future phases may use the backend.

**Phase 1 approach:** No backend API changes. blocks.json is served as static files from `frontend/public/templates/{slug}/blocks.json`.

**Future consideration (out of scope for Phase 1):**
```
GET /api/v1/templates
Response: [{ id, slug, name, category, isPremium, price, blocksJsonUrl }]

GET /api/v1/templates/{slug}/blocks
Response: BlockManifest (same as blocks.json)
```

The backend Template model could store:
- `config` JSON field with `blocksJsonPath` reference
- `category` integer field mapping to enum (Blog=1, Resume=2, PersonalIntro=3, Portfolio=4)

---

## Open Questions

1. **Resume category is empty**
   - What we know: D-01 defines Resume as a category, but none of the 10 templates are Resume-type. The 10 templates are split: Portfolio (2) + Personal Intro (5) + Blog (3).
   - What's unclear: Should Resume be hidden from the category filter until templates are added? Or should existing templates be re-mapped?
   - Recommendation: Show all 4 categories in filter; if a category has 0 templates, the filter should still work (returns empty). This is future-proof.

2. **text-container block (blog content area) boundary**
   - What we know: `{{BLOG_CONTENT}}` is a single placeholder token representing the entire blog content area. Phase 2 editor needs to put multiple blocks inside it.
   - What's unclear: Does the text-container's `selector` (`.content`) already exist in all 10 template HTML files? If not, which templates need their HTML updated?
   - Recommendation: Audit all 10 template HTML files for `.content` or equivalent selector before finalizing blocks.json.

3. **Blocks.json vs. embedded block data in metadata.json**
   - What we know: metadata.json already exists in each template directory.
   - What's unclear: Should blocks.json be a separate file or merged into metadata.json?
   - Recommendation: Keep separate. metadata.json is for template metadata (name, author, version); blocks.json is for block structure. Single-responsibility principle.

---

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (React 18 + Vite project, existing test setup) |
| Config file | `frontend/vitest.config.ts` (if exists) or `frontend/package.json` vitest config |
| Quick run command | `npm run test -- --run --reporter=verbose` |
| Full suite command | `npm run test -- --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TPL-01 | 10 templates load with correct categories | unit | `vitest run tests/templateConfig.test.ts` | TBD |
| TPL-02 | blocks.json exists for each template, parses correctly | unit | `vitest run tests/blocksJson.test.ts` | TBD |
| TPL-03 | Category filter returns correct templates | unit | `vitest run tests/categoryFilter.test.ts` | TBD |
| TPL-04 | Free/paid badge displays correctly | unit | `vitest run tests/templatePricing.test.ts` | TBD |
| TPL-05 | Template preview iframe renders | integration | `vitest run tests/preview.test.tsx` | TBD |

### Sampling Rate
- **Per task commit:** `npm run test -- --run --reporter=verbose`
- **Per wave merge:** Full suite
- **Phase gate:** All tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `frontend/tests/templateConfig.test.ts` -- validates TEMPLATES array has 10 entries with correct categories
- [ ] `frontend/tests/blocksJson.test.ts` -- fetches each blocks.json, validates schema
- [ ] `frontend/tests/categoryFilter.test.ts` -- tests getTemplatesByCategory
- [ ] `frontend/tests/conftest.ts` -- shared test fixtures
- [ ] Framework install: `npm install vitest @testing-library/react --save-dev` if not detected

*(If no gaps: "None -- existing test infrastructure covers all phase requirements")*

---

## Sources

### Primary (HIGH confidence)
- Existing template files: `frontend/public/templates/*/index.html`, `metadata.json` -- direct inspection
- `frontend/src/config/templates.ts` -- direct inspection
- `frontend/src/components/TemplateGallery/TemplateGallery.tsx` -- direct inspection
- `backend/src/main/java/com/onepage/model/Template.java` -- direct inspection

### Secondary (MEDIUM confidence)
- D-03, D-04, D-05 from 01-CONTEXT.md -- user-locked decisions, direct reference
- Block type taxonomy from REQUIREMENTS.md EDIT-02 -- maps to D-05

### Tertiary (LOW confidence)
- Schema recommendations for blocks.json -- inferred from requirements and existing placeholder patterns; no external source consulted (no Context7/WebSearch needed for data modeling decisions)

---

## Metadata

**Confidence breakdown:**
- Standard stack: N/A (no new dependencies) -- N/A
- Architecture: MEDIUM -- decisions are informed by existing code patterns, but blocks.json schema is a new design with no runtime validation yet
- Pitfalls: MEDIUM -- identified from existing code patterns, but some (like selector drift) are theoretical until templates are built out

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days -- schema design is stable once blocks.json files are created)
