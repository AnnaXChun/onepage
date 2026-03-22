# Phase 12: SEO Meta Tags and Open Graph - Research

**Researched:** 2026-03-22
**Domain:** SEO optimization for published static sites
**Confidence:** HIGH

## Summary

This phase adds SEO meta tags, Open Graph, and Twitter Card support to published sites, plus auto-generated sitemap.xml and configurable robots.txt. The system uses pre-rendered static HTML (generated via Thymeleaf at publish time), so SEO changes require re-publishing to take effect.

**Primary recommendation:** Add SEO fields to Blog model (metaTitle, metaDescription, coverImage for OG), update blog-template.html with meta tags, add sitemap.xml and robots.txt endpoints to SiteController, and add API endpoints for SEO editing in the frontend editor.

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for this phase. All SEO features are in scope per the phase description.

## Standard Stack

No new libraries required. Uses existing:
- Spring Boot 3.2.0 (backend)
- Thymeleaf (HTML template engine)
- React 18 + TypeScript (frontend)

### Supporting Standards

| Standard | Purpose | When to Use |
|----------|---------|-------------|
| Open Graph Protocol | Social sharing previews (Facebook, LinkedIn) | og:title, og:description, og:image, og:url |
| Twitter Card | Twitter sharing previews | twitter:card, twitter:title, twitter:description, twitter:image |
| sitemap.org XML | Search engine indexing | /host/{username}/sitemap.xml |
| robots.txt (Google spec) | Crawler configuration | /host/{username}/robots.txt |

## Architecture Patterns

### Pre-Rendered Static HTML Architecture

**What:** Published sites are pre-rendered Thymeleaf templates stored as `blog.htmlContent` at publish time.

**When to use:** All published blog serving via SiteController.

**Flow:**
```
User clicks Publish
  -> BlogService.publish()
    -> StaticSiteService.generateStaticHtml(title, coverImage, blocks)
      -> Thymeleaf processes blog-template.html
      -> Returns HTML string
    -> Stored in blog.htmlContent
  -> SiteController.servePublishedSite() returns blog.getHtmlContent() directly
```

**Implication:** SEO changes (meta title, description, OG tags) baked into htmlContent at publish time. User must re-publish for changes to take effect.

### Pattern 1: Dynamic SEO Endpoints for Static Content

**What:** sitemap.xml and robots.txt are generated dynamically at request time, not stored.

**When to use:** For SEO files that change based on blog content or user settings.

**Example:**
```
GET /host/{username}/sitemap.xml  -> Dynamically generates XML
GET /host/{username}/robots.txt   -> Returns user-configured rules
GET /host/{username}              -> Returns pre-rendered static HTML
```

### Pattern 2: SEO Settings via API + Re-publish

**What:** SEO fields stored in Blog model, editable via API, but only take effect after re-publish.

**When to use:** For meta title, description that need to be baked into static HTML.

**Example:**
```
PUT /api/blog/{id}/seo    -> Updates metaTitle, metaDescription in DB
                           -> Does NOT regenerate HTML
POST /api/blog/publish/{id}  -> Regenerates HTML with new SEO values
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sitemap XML generation | String concatenation | JAXB @XmlRootElement or Simple XML Serialize | Proper XML escaping, namespace handling |
| robots.txt parsing | Custom parser | Static string with simple template substitution | robots.txt is simple key:value format |
| Open Graph tag validation | Custom validation | Follow ogp.me specification | Well-documented standard |

## Common Pitfalls

### Pitfall 1: SEO changes not taking effect
**What goes wrong:** User updates meta title in editor but published site still shows old title.
**Why it happens:** htmlContent is pre-rendered. Changes to Blog model fields do not regenerate HTML.
**How to avoid:** Clearly indicate in UI that re-publish is required for SEO changes to take effect.
**Warning signs:** User complains "I changed my meta title but it didn't update."

### Pitfall 2: sitemap.xml returning 404 for unpublished blogs
**What goes wrong:** Sitemap includes blogs that are no longer published.
**Why it happens:** Sitemap generation queries all blogs, not just status=1.
**How to avoid:** Filter to only published blogs (status=1) in sitemap query.

### Pitfall 3: OG image missing on social shares
**What goes wrong:** Shared link shows no image or broken image.
**Why it happens:** og:image requires absolute URL with http/https, coverImage may be relative or empty.
**How to avoid:** Ensure og:image is absolute URL, fallback to default image if no coverImage.

### Pitfall 4: robots.txt blocking sitemap
**What goes wrong:** sitemap.xml is blocked by robots.txt rules.
**Why it happens:** Default robots.txt may have "Disallow: /" or sitemap path is blocked.
**How to avoid:** Default robots.txt should be "Allow: /" and reference sitemap at absolute URL.

## Code Examples

### Sitemap XML Format (sitemap.org)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>http://example.com/host/john</loc>
    <lastmod>2026-03-22</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
```
Source: https://www.sitemaps.org/protocol.html

### Open Graph Meta Tags
```html
<meta property="og:title" content="John's Blog" />
<meta property="og:description" content="A personal blog about tech" />
<meta property="og:image" content="http://example.com/images/cover.jpg" />
<meta property="og:url" content="http://example.com/host/john" />
<meta property="og:type" content="website" />
```

### Twitter Card Meta Tags
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="John's Blog" />
<meta name="twitter:description" content="A personal blog about tech" />
<meta name="twitter:image" content="http://example.com/images/cover.jpg" />
```

### robots.txt Standard Format
```
User-agent: *
Allow: /
Sitemap: http://example.com/host/john/sitemap.xml
```
Source: https://developers.google.com/search/docs/crawling-indexing/robots_txt

## Runtime State Inventory

> Not applicable - this is a greenfield SEO feature, not a rename/refactor phase.

## Open Questions

1. **Where to store robots.txt rules?**
   - What we know: User model has no robots_txt field; Blog model has no SEO fields.
   - What's unclear: Should robots.txt rules be per-user (all their blogs) or per-blog?
   - Recommendation: Store in User model as `robots_txt` TEXT column (user-level setting applies to all their published blogs). Simpler and sufficient for v1.

2. **Should sitemap.xml be cached?**
   - What we know: Sitemap is dynamically generated per request.
   - What's unclear: Is generation expensive? Should it be cached in Redis?
   - Recommendation: Generate on-demand for now. Sitemap generation is simple XML string building, not expensive. Add Redis caching only if performance issues arise.

3. **How to handle missing coverImage for og:image?**
   - What we know: Blog model has coverImage field which may be null.
   - What's unclear: Should og:image be required? What fallback image?
   - Recommendation: If coverImage is null/empty, omit og:image tag entirely (social platforms handle missing og:image gracefully with their own defaults). Provide a placeholder image URL in config.

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false. If the key is absent, treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | N/A |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SEO-01 | User can set custom meta title and description per page | Manual | N/A - requires UI interaction | No |
| SEO-02 | Published sites include auto-generated sitemap.xml | Manual | `curl http://localhost:8080/host/{username}/sitemap.xml` | No |
| SEO-03 | User can configure robots.txt (allow/block specific paths) | Manual | `curl http://localhost:8080/host/{username}/robots.txt` | No |
| SEO-04 | Published sites include Open Graph and Twitter Card meta tags | Manual | Inspect HTML source for og:* and twitter:* tags | No |

### Sampling Rate
- **Per task commit:** N/A - no automated tests
- **Per wave merge:** N/A
- **Phase gate:** N/A

### Wave 0 Gaps
- [ ] No test infrastructure exists in this project (no JUnit test files for core services, no frontend test setup)
- [ ] Consider adding basic unit tests for SitemapService once created

## Implementation Overview

### SEO-01: Custom Meta Title and Description

**Backend changes:**
1. Add columns to `blogs` table: `meta_title` VARCHAR(255), `meta_description` TEXT
2. Add fields to Blog.java model
3. Update blog-template.html to use meta fields (fallback to title if not set)
4. Update StaticSiteService.generateStaticHtml() to accept meta fields
5. Add `PUT /api/blog/{id}/seo` endpoint to update SEO fields
6. BlogService.publish() passes meta fields to StaticSiteService

**Frontend changes:**
1. Add SEO settings panel in editor (accessible via Settings or Properties)
2. Input fields for meta title (max 60 chars) and meta description (max 160 chars)
3. Show warning: "Re-publish to apply SEO changes"

### SEO-02: Auto-generated Sitemap.xml

**Backend changes:**
1. Add endpoint to SiteController: `GET /host/{username}/sitemap.xml`
2. Query all published blogs for user (status=1)
3. Generate XML per sitemap.org spec
4. Return with `Content-Type: application/xml`

**No frontend changes required.**

### SEO-03: Configurable robots.txt

**Backend changes:**
1. Add column to `users` table: `robots_txt` TEXT
2. Add field to User.java model
3. Add endpoint to SiteController: `GET /host/{username}/robots.txt`
4. If user has custom robots_txt, return it; otherwise return default (Allow all, Sitemap reference)
5. Add endpoint `PUT /api/user/robots` to update user's robots.txt (authenticated)

**Frontend changes:**
1. Add robots.txt editor in user settings or blog settings
2. Textarea with syntax guidance

### SEO-04: Open Graph and Twitter Card Meta Tags

**Backend changes:**
1. Add `meta_description` and use existing `cover_image` as og:image source
2. Update blog-template.html to include all OG and Twitter Card meta tags
3. Tags to add: og:title, og:description, og:image, og:url, og:type, twitter:card, twitter:title, twitter:description, twitter:image

**Frontend changes:**
1. SEO panel (from SEO-01) shows OG preview or at minimum indicates OG tags will use meta title/description/cover image

### Dependencies on Existing Code

| File | How SEO Phase Uses It |
|------|----------------------|
| SiteController.java | Adding sitemap.xml and robots.txt endpoints at /host/{username}/... |
| Blog.java | Adding meta_title, meta_description fields |
| BlogService.java | Passing meta fields to StaticSiteService on publish |
| StaticSiteService.java | Accepting and passing meta fields to Thymeleaf context |
| blog-template.html | Adding meta tag placeholders |
| BlogController.java | Adding PUT /api/blog/{id}/seo endpoint |
| application.yml | Potentially adding default site URL for absolute URL generation in sitemap |

### Key Design Decision: Pre-rendered vs Dynamic

**Chosen approach:** Pre-rendered (SEO baked into htmlContent at publish)

**Rationale:**
- Simpler architecture - no server-side rendering at request time
- Faster page loads - pure static HTML serving
- Existing infrastructure already supports this pattern

**Trade-off:** User must re-publish for SEO changes. This is acceptable for v1 - SEO is typically set before going live, and re-publishing is a simple action.

## Sources

### Primary (HIGH confidence)
- sitemap.org protocol - https://www.sitemaps.org/protocol.html
- Open Graph Protocol - https://ogp.me/
- Twitter Card Documentation - https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- robots.txt specification - https://developers.google.com/search/docs/crawling-indexing/robots_txt

### Secondary (MEDIUM confidence)
- Existing blog-template.html structure (verified by reading source)
- SiteController.servePublishedSite() pattern (verified by reading source)

### Tertiary (LOW confidence)
- N/A

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - only standard HTML meta tags, no new libraries
- Architecture: HIGH - follows existing Thymeleaf pre-render pattern
- Pitfalls: MEDIUM - identified through code analysis, not production validation

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (standards stable, implementation straightforward)
