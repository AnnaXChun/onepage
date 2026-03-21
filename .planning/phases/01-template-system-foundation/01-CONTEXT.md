# Phase 1: Template System Foundation - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver 10 templates with formal block structures that the block editor (Phase 2) can render and manipulate. Template gallery already exists with animated cards and preview mode. This phase adds the block declaration layer.
</domain>

<decisions>
## Implementation Decisions

### Category structure
- **D-01:** Use Blog / Resume / Personal Intro as template categories (not personal/tech/portfolio)
- **D-02:** Template categorization:
  - Portfolio: Gallery, Creative
  - Personal Intro: Vintage, Ultra, Paper, Zen, Minimal
  - Blog: Retro, Glass, Neon

### Block structure definition
- **D-03:** Each template has a `blocks.json` file declaring its block components
- **D-04:** Each block entry contains: `type`, `placeholder` token, `defaultContent` string
- **D-05:** Supported block types: Text (H1, H2, paragraph, list), Image (single, gallery), Social Links, Contact Form, Divider
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Frontend design
- `.claude/frontend-design-skill/SKILL.md` — Frontend design guidelines
- `.claude/frontend-design-skill/reference/typography.md` — Font selection and scales
- `.claude/frontend-design-skill/reference/color-and-contrast.md` — OKLCH, palettes, theming
- `.claude/frontend-design-skill/reference/spatial-design.md` — Grid, rhythm, container queries

### Existing code
- `frontend/src/config/templates.ts` — Current template config (to be updated with new categories)
- `frontend/src/components/TemplateGallery/TemplateGallery.tsx` — Existing gallery (already working)
- `frontend/public/templates/*/metadata.json` — Existing metadata (to be extended with blocks.json)

### Project
- `.planning/PROJECT.md` — Core value: AI-assisted generation + block-level editor
- `.planning/REQUIREMENTS.md` — TPL-01 through TPL-05 define the scope
- `.planning/research/STACK.md` — dnd-kit for drag-and-drop (Phase 2)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TemplateGallery.tsx`: Fully working gallery with animated cards, hover effects, preview mode, image upload
- `templates.ts`: 10 templates with id, slug, name, description, thumbnail, isPremium, price, tags, color
- Template directories: Each has index.html, styles.css, metadata.json, script.js, preview.md
- Placeholder tokens: `{{USER_NAME}}`, `{{USER_BIO}}`, `{{USER_IMAGE}}`, `{{BLOG_CONTENT}}` used in templates

### Established Patterns
- Template config in `templates.ts` uses TypeScript interface `TemplateConfig`
- Category filtering via `TEMPLATE_CATEGORIES` array + `getTemplatesByCategory()` helper
- Premium flag + price stored per template
- Template preview renders in iframe with `srcDoc` using fetched HTML + CSS

### Integration Points
- Template selection → navigates to `/preview` with `selectedTemplate` in location state
- Blocks.json will be read by block editor (Phase 2) when user opens editor
- Template config needs update: category field values changed, blocks.json reference added
</code_context>

<specifics>
## Specific Ideas

No specific templates referenced — open to standard approaches for block declarations.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.
</deferred>

---
*Phase: 01-template-system-foundation*
*Context gathered: 2026-03-21*
