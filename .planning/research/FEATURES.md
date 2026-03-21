# Feature Research

**Domain:** Drag-and-Drop Website Builder SaaS
**Researched:** 2026-03-21
**Confidence:** MEDIUM (WebFetch from Durable, Elementor, Webflow, Relume; training data supplement for competitive analysis)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Template Library | Users expect choices; "pick a design" is fundamental to the mental model | LOW | 10-100+ templates; categorized by use case (blog, portfolio, business) |
| Drag-and-Drop Block Editor | Core UX paradigm; if users cannot drag, it's not a "builder" | MEDIUM-HIGH | Block-level is simpler than free-layout; sufficient for single-page sites |
| Click-to-Edit Text/Image | Direct manipulation expectation; "see what you get" | LOW | Inline editing overlaid on preview |
| Image Upload/Media Library | Every site needs images; users bring their own | LOW | Should support drag-drop upload, basic crop/resize |
| Hosting/Published URL | "Build and share" is the promise; need live URL | MEDIUM | Subdomain hosting (username.vibe.com) is standard entry-tier |
| Mobile Responsive Output | 50%+ traffic is mobile; non-responsive = broken | LOW | Templates should be responsive by default |
| Text Formatting | Bold, italic, headings, lists, links | LOW | Rich text or markdown in text blocks |
| Social Media Links | Every personal site has social icons | LOW | Icon blocks with URL configuration |
| Share/Publish Controls | Save draft vs publish; visibility toggle | LOW | Draft/Published state, optional password protection |
| Basic SEO | Title, description, OG tags at minimum | LOW | Auto-generated from content, editable |
| Free Entry Option | Users want to try before paying | LOW | Limited templates or watermark for free tier |
| Email Capture/Contact Form | Lead collection is universal need | LOW | Simple form block with email delivery |

### Differentiators (Competitive Advantage)

Features that set products apart. Not required, but valuable for conversion and retention.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI Website Generation from Image | "Upload a photo, get a website" is magical and viral | HIGH | MiniMax image analysis → style extraction → content generation; this is the core differentiator for Vibe Onepage |
| AI Writing Assist per Block | Inline AI helps without leaving context | MEDIUM | "AI Write" button in each text block; uses MiniMax |
| One-Click AI Regeneration | Iterate on AI output quickly | MEDIUM | Regenerate section/block content with new prompt |
| Style Transfer from Image | Extract color palette, mood, typography hints | MEDIUM | Use image RGB analysis to influence template style |
| Block Animations/Motion | Modern sites feel alive | MEDIUM | Entrance animations, hover effects; should use exponential easing per design skill |
| VIP Subscription Model | Recurring revenue; premium access | MEDIUM | 10 RMB/month VIP; per-use template purchase for non-VIP |
| PDF Export | Offline sharing capability | MEDIUM | ~0.1-0.5 RMB per generation; server-side rendering needed |
| Platform Subdomain Branding | Free tier gets platform branding; paid removes it | LOW | username.vibe.com (free) vs custom domain (paid, future) |
| LangChain AI Pipeline | Orchestrated image→style→content→layout chain | HIGH | Existing architecture decision; critical for AI quality |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Free-Form Canvas Layout | "I want to place anything anywhere" | Major complexity; users get lost; poor mobile adaptation | Block-level is sufficient; offer "advanced" blocks instead |
| Custom Domain for Free Users | "I want my site on my domain" | Infrastructure cost, SSL management, support burden | Reserve for VIP; offer subdomain + platform branding |
| Real-Time Collaborative Editing | "Work together like Google Docs" | Extreme complexity; locking, conflict resolution, presence | Single-user editing only for v1; consider Comments for v1.x |
| Multi-Page Websites | "I need more than one page" | Scope explosion; navigation complexity; contradicts "single-page" value prop | Single-page focus; future multi-page as separate product |
| User-Created Block Components | "Build your own blocks" | Template system complexity; rendering pipeline; security | Fixed block types; users can configure not create |
| Custom Template Creation | "Design my own template" | Requires template editor, preview, versioning | 10 fixed templates; expand catalog based on usage data |
| Full Code Export (HTML/CSS/JS) | "I want to own my code" | Removes SaaS lock-in; infrastructure without recurring revenue | Hosting included; code view-only in inspector |

## Feature Dependencies

```
[Template System]
    └──required by──> [Block Editor]
                           └──required by──> [Click-to-Edit]
                                                   └──enhanced by──> [AI Writing Assist]

[AI Generation (Image + LangChain)]
    └──requires──> [Template System]
    └──requires──> [Block Editor]
    └──produces──> [Editable Website]

[VIP Subscription]
    └──gates──> [All Templates Access]
    └──gates──> [No Platform Branding]

[PDF Export]
    └──requires──> [Published Website]
    └──requires──> [Server-side Rendering (Puppeteer/Playwright)]

[Hosting/Subdomain]
    └──required by──> [Published URL]
    └──required by──> [Share Links]
```

### Dependency Notes

- **AI Generation requires Template System and Block Editor:** AI outputs must conform to the block structure and be editable in the editor
- **VIP Subscription gates template access and removes branding:** Business model dependency on feature access control
- **PDF Export requires Published Website:** Must render the final state, not draft
- **Click-to-Edit is enhanced by AI Writing Assist:** Each text block becomes editable AND AI-regeneratable

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Template System (10 templates)** — Foundation for everything; block-based templates for Blog, Resume, Personal Intro
- [ ] **Block Editor** — Add, remove, reorder, configure blocks; drag-and-drop reordering
- [ ] **Click-to-Edit** — Inline text/image editing on preview
- [ ] **Image Upload** — Media handling for user images
- [ ] **Platform Hosting** — Publish to `username.vibe.com` subdomain
- [ ] **Share Links** — Unique shareable URL for each published site
- [ ] **User Auth** — Registration/login (already exists)
- [ ] **WeChat Pay Integration** — Payment for VIP and per-template (already exists)
- [ ] **AI Website Generation (Image)** — Upload image + description → complete editable page (core differentiator)
- [ ] **AI Writing Assist (Block-level)** — Inline "AI Write" button per text block
- [ ] **VIP Subscription** — 10 RMB/month; gates all templates + no branding
- [ ] **Basic SEO** — Auto title/description/OG tags

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **PDF Export** — Static PDF generation; paid feature (~0.1-0.5 RMB)
- [ ] **Block Animations** — Entrance animations, hover effects on blocks
- [ ] **More Templates** — Expand catalog based on usage data
- [ ] **Comments System** — Non-real-time feedback on published sites

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Custom Domain Binding** — Own domain for VIP users
- [ ] **Multi-Page Websites** — Expand beyond single-page
- [ ] **User-Created Blocks** — Let advanced users build custom blocks
- [ ] **Team Collaboration** — Multi-user editing with roles
- [ ] **Code Export** — Download HTML/CSS/JS

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Template System | HIGH | MEDIUM | P1 |
| Block Editor | HIGH | MEDIUM-HIGH | P1 |
| Click-to-Edit | HIGH | LOW | P1 |
| Image Upload | HIGH | LOW | P1 |
| Platform Hosting | HIGH | MEDIUM | P1 |
| Share Links | HIGH | LOW | P1 |
| User Auth | HIGH | LOW | P1 (exists) |
| WeChat Pay | HIGH | MEDIUM | P1 (exists) |
| AI Website Generation | HIGH | HIGH | P1 (differentiator) |
| AI Writing Assist | MEDIUM | MEDIUM | P1 (differentiator) |
| VIP Subscription | HIGH | MEDIUM | P1 |
| Basic SEO | MEDIUM | LOW | P1 |
| PDF Export | MEDIUM | MEDIUM | P2 |
| Block Animations | MEDIUM | MEDIUM | P2 |
| More Templates | MEDIUM | LOW | P2 |
| Custom Domain | MEDIUM | HIGH | P3 |
| Multi-Page | LOW | HIGH | P3 |
| User-Created Blocks | LOW | HIGH | P3 |
| Team Collaboration | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Wix | Squarespace | Elementor | Durable | Our Approach |
|---------|-----|------------|-----------|---------|--------------|
| Block Editor | Yes - Wix Editor | Yes - Fluid Engine | Yes - Widget-based | Yes - Drag-drop | Block-level drag-drop (simpler than free-layout) |
| AI Generation | Wix ADI (chatbot) | AI Design | AI Layouts | Yes - 30sec generation | Image + text input → MiniMax → editable page |
| Template Count | 800+ | 100+ | 300+ | 25+ | 10 initially (focused, not expansive) |
| AI Writing Assist | Per-section | Limited | Yes | Yes | Inline per-block AI Write button |
| Hosting | Included | Included | Self-hosted | Included | Platform subdomain (username.vibe.com) |
| Free Tier | Yes (with Wix ads) | 14-day trial | Free plugin | Yes | Free with platform branding |
| Pricing Model | Subscription + add-ons | All-in subscription | Plugin + hosting | Subscription | VIP subscription + per-template |
| PDF Export | Yes (premium) | No | Via plugin | No | Yes - paid feature |
| Mobile Responsive | Yes | Yes | Yes | Yes | Yes - templates responsive by default |

### Key Observations from Competitors

1. **AI is table stakes now (2025+)**: Durable, Wix ADI, Squarespace AI, Elementor AI — all have AI generation. Not differentiating anymore, just expected.

2. **Block-level editors dominate**: Wix (proprietary), Elementor (widgets), Squarespace (fluid engine) — all use block/section-based approaches rather than free-form canvas.

3. **Template count matters less than quality**: Durable has 25 templates but focuses on conversion-optimized, industry-specific. Wix has 800+ but many are low-quality.

4. **Hosting is always included**: No competitor charges separately for hosting in base plans. It's bundled into subscription.

5. **Free tiers exist but with branding**: Wix shows ads, Squarespace has trial, Durable has free with branding. Platform subdomain with branding is standard free tier.

6. **AI Writing Assist is emerging differentiator**: Not universal yet. Elementor and Durable have it. Our per-block approach is competitive.

## Sources

- Durable AI Website Builder (durable.com/ai-website-builder) — AI generation process, pricing
- Elementor Features (elementor.com/features) — Block editor architecture, AI capabilities
- Webflow Features (webflow.com/features) — CMS, hosting model, AI optimization
- Relume Pricing (relume.io/pricing) — Tiered AI + component model
- Squarespace Features (squarespace.com/features) — Product overview, AI, hosting
- Framer (framer.com) — No-code positioning, design-focused

---

*Feature research for: Drag-and-Drop Website Builder SaaS*
*Researched: 2026-03-21*
