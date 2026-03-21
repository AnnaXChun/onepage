---
name: "01-template-system-foundation"
wave: 1
depends_on: []
files_modified:
  - frontend/src/config/templates.ts
  - frontend/src/types/block.ts
  - frontend/src/components/TemplateGallery/TemplateGallery.tsx
  - frontend/public/templates/*/blocks.json (10 files)
autonomous: false
---

# Phase 1 Plan: Template System Foundation

## Phase Goal

Deliver 10 templates with formal block structures that the block editor (Phase 2) can render and manipulate.

## Requirements Covered

- **TPL-01**: 10 fixed templates across Blog, Resume, Personal Intro categories
- **TPL-02**: Templates define block component structure (Text, Image, Social Links, Contact)
- **TPL-03**: Template categories displayed in gallery with animated preview cards
- **TPL-04**: Free vs paid template flag; paid templates show price (1-10 RMB)
- **TPL-05**: Template thumbnail preview before selection

## must_haves

1. `frontend/src/types/block.ts` defines `BlockType` union and `BlockManifest` interface
2. `TEMPLATE_CATEGORIES` = `['all', 'Blog', 'Resume', 'Personal Intro', 'Portfolio']`
3. Each of 10 templates has `blocks.json` with typed block entries
4. `TemplateConfig` type includes `blocksJsonPath?: string`
5. TemplateGallery fetches `blocks.json` when template is selected and passes it to editor route

---

## Task 1: Create Block Type Definitions

**wave**: 1

### Context

Phase 2 block editor needs a TypeScript type system for block declarations. This file establishes the contract between templates and the editor.

### read_first

- `frontend/src/config/templates.ts` — existing TemplateConfig interface to align with
- `.planning/phases/01-template-system-foundation/01-RESEARCH.md` — blocks.json schema (Pattern 1)

### action

Create `frontend/src/types/block.ts`:

```typescript
export type BlockType =
  | 'text-h1' | 'text-h2' | 'text-paragraph' | 'text-list'
  | 'image-single' | 'image-gallery'
  | 'social-links' | 'contact-form' | 'divider'
  | 'text-container';

export interface BlockConfig {
  aspectRatio?: string;
  rounded?: boolean;
  allowedBlockTypes?: BlockType[];
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

### acceptance_criteria

1. `grep -c "text-h1\|text-h2\|text-paragraph\|text-list\|image-single\|image-gallery\|social-links\|contact-form\|divider\|text-container" frontend/src/types/block.ts` returns `10`
2. `grep "BlockManifest\|BlockDefinition\|BlockConfig" frontend/src/types/block.ts | wc -l` returns `3`
3. File passes TypeScript compilation: `cd frontend && npx tsc --noEmit src/types/block.ts` exits with code 0

---

## Task 2: Update TemplateConfig and Category Types

**wave**: 1

### Context

Template categories need to change from `personal/tech/portfolio` to `Blog/Resume/Personal Intro/Portfolio`. TemplateConfig needs `blocksJsonPath` field.

### read_first

- `frontend/src/config/templates.ts` — existing template config (current state)
- `.planning/phases/01-template-system-foundation/01-CONTEXT.md` — D-01, D-02 category mapping

### action

In `frontend/src/config/templates.ts`:

1. Change `TemplateCategory` type and `TEMPLATE_CATEGORIES` array to:
```typescript
export const TEMPLATE_CATEGORIES = ['all', 'Blog', 'Resume', 'Personal Intro', 'Portfolio'] as const;
export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];
```

2. Add `blocksJsonPath?: string` to `TemplateConfig` interface.

3. Update all 10 template entries with new categories per mapping:
- `minimal-simple` → `Personal Intro`
- `gallery-display` → `Portfolio`
- `vintage-style` → `Personal Intro`
- `ultra-minimal` → `Personal Intro`
- `creative-card` → `Portfolio`
- `paper-fold` → `Personal Intro`
- `retro-wave` → `Blog`
- `glass-morphism` → `Blog`
- `neon-pulse` → `Blog`
- `zen-minimal` → `Personal Intro`

4. Add `blocksJsonPath` to each template pointing to `/templates/{slug}/blocks.json`.

### acceptance_criteria

1. `grep "Blog\|Resume\|Personal Intro\|Portfolio" frontend/src/config/templates.ts | wc -l` returns at least `5`
2. `grep "blocksJsonPath" frontend/src/config/templates.ts | wc -l` returns `10`
3. `getTemplatesByCategory('Blog').length` returns `3` (retro-wave, glass-morphism, neon-pulse)
4. `getTemplatesByCategory('Portfolio').length` returns `2` (gallery-display, creative-card)
5. `getTemplatesByCategory('Personal Intro').length` returns `5` (minimal-simple, vintage-style, ultra-minimal, paper-fold, zen-minimal)

---

## Task 3: Create blocks.json for minimal-simple Template

**wave**: 1

### Context

blocks.json declares block structure. Starting with minimal-simple as the reference template.

### read_first

- `frontend/public/templates/minimal-simple/index.html` — to extract selectors and placeholder tokens
- `frontend/public/templates/minimal-simple/metadata.json` — existing metadata

### action

Create `frontend/public/templates/minimal-simple/blocks.json`:
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

### acceptance_criteria

1. File exists at `frontend/public/templates/minimal-simple/blocks.json`
2. `jq '.version == "1.0" and .blocks | length == 4' frontend/public/templates/minimal-simple/blocks.json` returns `true`
3. All 4 placeholder tokens (`{{USER_IMAGE}}`, `{{USER_NAME}}`, `{{USER_BIO}}`, `{{BLOG_CONTENT}}`) appear in blocks.json

---

## Task 4: Create blocks.json for remaining 9 Templates

**wave**: 1

### Context

Create blocks.json for all remaining templates following the same schema. Each template has the same 4 placeholders with different CSS class selectors.

### read_first

Each template's `index.html` to extract exact CSS selectors:
- `frontend/public/templates/gallery-display/index.html`
- `frontend/public/templates/vintage-style/index.html`
- `frontend/public/templates/ultra-minimal/index.html`
- `frontend/public/templates/creative-card/index.html`
- `frontend/public/templates/paper-fold/index.html`
- `frontend/public/templates/retro-wave/index.html`
- `frontend/public/templates/glass-morphism/index.html`
- `frontend/public/templates/neon-pulse/index.html`
- `frontend/public/templates/zen-minimal/index.html`

### action

Create `blocks.json` for each template following the minimal-simple pattern. Each file contains 4 blocks (user-image, user-name, user-bio, blog-content) with selectors matching each template's HTML:

| Template | user-image selector | user-name selector | user-bio selector | blog-content selector |
|----------|---------------------|--------------------|--------------------|-----------------------|
| gallery-display | `.hero-image img` | `.title` | `.subtitle` | `.gallery` |
| vintage-style | `.avatar` | `.name` | `.bio` | `.content` |
| ultra-minimal | `.photo` | `.name` | `.bio` | `.posts` |
| creative-card | `.avatar` | `.name` | `.bio` | `.cards-grid` |
| paper-fold | `.profile-image` | `.name` | `.bio` | `.content` |
| retro-wave | `.avatar` | `.name` | `.bio` | `.content` |
| glass-morphism | `.avatar` | `.name` | `.bio` | `.content` |
| neon-pulse | `.avatar` | `.name` | `.bio` | `.content` |
| zen-minimal | `.avatar` | `.name` | `.bio` | `.content-inner` |

### acceptance_criteria

1. Each of the 9 files exists at `frontend/public/templates/{slug}/blocks.json`
2. `jq '.blocks | length == 4'` returns `true` for all 9 files
3. All placeholder tokens match those in corresponding `index.html` files

---

## Task 5: Update TemplateGallery to Fetch and Pass blocks.json

**wave**: 1

### Context

TemplateGallery needs to fetch blocks.json when a template is selected and pass it to the editor route via navigation state.

### read_first

- `frontend/src/components/TemplateGallery/TemplateGallery.tsx` — current implementation (lines 1-392)
- `frontend/src/types/block.ts` — newly created BlockManifest type

### action

In `TemplateGallery.tsx`:

1. Add `BlockManifest` import from `../../types/block`

2. Add state for blocksJson:
```typescript
const [blocksJson, setBlocksJson] = useState<BlockManifest | null>(null);
```

3. Update the template fetch effect to also fetch blocks.json:
```typescript
useEffect(() => {
  if (!selectedTemplate) {
    setPreviewHTML(null);
    setBlocksJson(null);
    return;
  }

  const templateBase = `/templates/${selectedTemplate.slug}`;
  const userImage = uploadedImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=800&fit=crop';

  Promise.all([
    fetch(`${templateBase}/index.html`).then((r) => r.text()),
    fetch(`${templateBase}/styles.css`).then((r) => r.text()),
    fetch(`${templateBase}/blocks.json`).then((r) => r.json()).catch(() => null),
  ])
    .then(([htmlText, cssText, blocksJsonData]) => {
      // existing html modification logic
      setBlocksJson(blocksJsonData);
    })
    // ...
}, [selectedTemplate, uploadedImage]);
```

4. Update `handleUseTemplate` to pass blocksJson in navigation state:
```typescript
navigate('/preview', {
  state: {
    uploadedImage,
    selectedTemplate,
    blocksJson,
  },
});
```

### acceptance_criteria

1. `grep "BlockManifest" frontend/src/components/TemplateGallery/TemplateGallery.tsx` returns 1 match
2. `grep "blocksJson" frontend/src/components/TemplateGallery/TemplateGallery.tsx` returns at least 4 matches (state, setBlocksJson, fetch, navigate)
3. `handleUseTemplate` navigation state includes `blocksJson` key

---

## Task 6: Verify Phase Completeness

**wave**: 1

### Context

Final verification that all TPL requirements are met and phase is ready for gate.

### read_first

- `.planning/REQUIREMENTS.md` — TPL-01 through TPL-05
- `frontend/src/config/templates.ts` — final state
- Any 2 blocks.json files for spot-check

### action

Run verification commands to confirm all acceptance criteria:

1. TPL-01 verification:
```bash
cd frontend && node -e "
const { TEMPLATES, TEMPLATE_CATEGORIES, getTemplatesByCategory } = require('./src/config/templates');
console.log('Categories:', TEMPLATE_CATEGORIES.join(', '));
console.log('Blog count:', getTemplatesByCategory('Blog').length);
console.log('Resume count:', getTemplatesByCategory('Resume').length);
console.log('Personal Intro count:', getTemplatesByCategory('Personal Intro').length);
console.log('Portfolio count:', getTemplatesByCategory('Portfolio').length);
console.log('Total templates:', TEMPLATES.length);
"
```

2. TPL-02 verification:
```bash
ls frontend/public/templates/*/blocks.json | wc -l
# Expected: 10
```

3. TPL-03 verification (TemplateGallery has category filter - already working):
```bash
grep -c "TEMPLATE_CATEGORIES" frontend/src/components/TemplateGallery/TemplateGallery.tsx
# Expected: at least 1
```

4. TPL-04 verification (free/paid badges - already working):
```bash
grep "isPremium\|price" frontend/src/config/templates.ts | head -5
# Expected: isPremium and price fields exist for each template
```

5. TPL-05 verification (preview - already working):
```bash
grep "previewMode\|previewHTML" frontend/src/components/TemplateGallery/TemplateGallery.tsx | wc -l
# Expected: at least 2
```

### acceptance_criteria

1. `TEMPLATE_CATEGORIES` contains `Blog`, `Resume`, `Personal Intro`, `Portfolio`
2. All 10 templates have `blocks.json` files
3. `TEMPLATES.length === 10`
4. TemplateGallery imports `BlockManifest` type
5. Phase directory has `PLAN.md` with valid frontmatter (wave, depends_on, files_modified, autonomous)

---

## Dependencies

All tasks in Wave 1 are independent and can run in parallel.

## Verification Gate

Before `/gsd:verify-work`, the following must be TRUE:
- [ ] 10 blocks.json files exist in `frontend/public/templates/{slug}/`
- [ ] `frontend/src/types/block.ts` passes TypeScript compilation
- [ ] `TEMPLATE_CATEGORIES` updated to new category names
- [ ] All 10 templates have correct category assignments
- [ ] TemplateGallery fetches blocks.json and passes it in navigation state
