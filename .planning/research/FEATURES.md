# Feature Research: Public Profile Pages

**Domain:** Personal website builder with public user profile pages
**Researched:** 2026-03-22
**Confidence:** MEDIUM

*Note: Web search tools encountered errors during research. Findings synthesized from existing codebase analysis and domain knowledge of comparable products (Linktree, Carrd, about.me, Wix, WordPress.com).*

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist on any public profile page. Missing these = product feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Avatar image** | Visual identity is fundamental to any profile | LOW | Existing `avatar` field in User model, needs upload UI |
| **Username/display name** | Basic identification | LOW | Existing `username` field, display prominently |
| **Bio text** | "Who is this person?" - first thing visitors want to know | LOW | MISSING from User model - needs new `bio` field (200-500 chars) |
| **Published sites grid** | Showcases user's work/product | MEDIUM | Existing Blog model with `status=1` for published; needs public endpoint to list by username |
| **Social links** | "How do I follow/contact them?" | LOW | MISSING from User model - needs `social_links` JSON field or columns |
| **Profile URL** | Shareable link like `/user/{username}` | LOW | New endpoint + frontend page; existing `username` is UNIQUE constraint |
| **VIP badge** | Social proof of premium user | LOW | Existing `vip_status` boolean in User model |
| **Cover/thumbnail images** | Visual richness for site cards | LOW | Existing `cover_image` in Blog model |

### Differentiators (Competitive Advantage)

Features that set Vibe Onepage apart. Not required, but valuable for differentiation.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Featured/pinned site** | Let users highlight their best work | MEDIUM | New boolean field on Blog model (`is_featured`) |
| **Site preview on hover** | Immediate engagement, shows quality | HIGH | Requires loading blog HTML content; may impact performance |
| **Visitor count display** | Social proof - "500 people visited my page" | LOW | Existing analytics infrastructure; add to profile |
| **Total views across all sites** | Aggregate achievement metric | LOW | Sum from `blog_daily_stats` table |
| **Custom profile theme** | Brand alignment for power users | MEDIUM | Extend User model with `profile_theme` JSON |
| **"View site" CTA buttons** | Clear call-to-action on profile | LOW | Each site card needs prominent button |
| **Engagement metrics per site** | Page views, unique visitors on each card | MEDIUM | Join with `blog_daily_stats` |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for this use case.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full editor on profile page** | "Let me tweak my profile from here" | Breaks the product mental model; editor is for sites, not profiles | Keep profile editing in settings/account area |
| **Comments on profile** | "Let visitors leave feedback" | Adds moderation burden, not aligned with one-page site product | Use contact block in user's actual site |
| **Follow system** | "Let me follow interesting creators" | Notification complexity, ongoing engagement expectations | Social links are sufficient for now |
| **Real-time activity feed** | "Show when someone visits" | Privacy concerns, infrastructure complexity | Periodic email digest (already exists) |
| **Unlimited social links** | "Add all my accounts" | Visual clutter, diminishes important links | Cap at 5-6 essential links |

---

## Feature Dependencies

```
[Profile Page] ──requires──> [Public User Endpoint]
                              └──requires──> [User Model: bio + social_links fields]

[Published Sites Grid] ──requires──> [BlogService.getByUsername(username)]
                                     └──requires──> [blogs.status = 1 (published)]

[VIP Badge Display] ──requires──> [User.vipStatus field]

[Featured Site] ──requires──> [Blog.isFeatured field]

[Visitor Counts] ──requires──> [blog_daily_stats aggregation]

[Site Preview Hover] ──enhances──> [Published Sites Grid]
                                    └──conflicts──> [Performance at scale]
```

### Dependency Notes

- **Profile page requires new User fields:** Bio and social_links are not in the current User model. These must be added in a schema migration before the profile endpoint can return meaningful data.
- **Published sites requires filtered query:** Current `BlogController.listMyBlogs()` returns all blogs. Need new `BlogService.getPublishedByUsername()` that filters by `status=1`.
- **VIP badge is already available:** The `vip_status` field exists; just needs to be exposed in the public UserDTO.

---

## MVP Definition (v1.7)

### Launch With (v1.7)

Minimum viable public profile page - what's needed to validate the concept.

- [ ] **Public profile endpoint** `GET /api/user/profile/{username}` - Returns user info + their published sites
- [ ] **Avatar display** - Show user's avatar on profile page
- [ ] **Username prominently displayed** - The user's chosen name
- [ ] **Bio field** - Short text introduction (requires User schema update)
- [ ] **Social links** - Twitter, GitHub, LinkedIn, etc. (requires User schema update)
- [ ] **Published sites grid** - Cards showing title, cover image, share link
- [ ] **VIP badge** - Visual indicator for premium users
- [ ] **Profile page UI** at `/user/{username}` - Public-facing page
- [ ] **Profile editing UI** in account settings - Form to edit bio and social links
- [ ] **Auto-redirect after login** - Send authenticated users to their profile

### Add After Validation (v1.x)

Features to add once core profile page is working.

- [ ] **Featured site** - Let users pin one site to the top
- [ ] **Total visitor count** - Aggregate views across all published sites
- [ ] **Per-site visitor counts** - Show page views on each site card
- [ ] **Custom profile theme** - Brand colors for power users

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Site preview on hover** - Rich interaction but high complexity
- [ ] **Follow system** - Adds notification infrastructure
- [ ] **Profile visit notifications** - Email digest is sufficient
- [ ] **Custom profile subdomain** - `username.vibeonepage.com` (requires DNS infrastructure)

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Public profile endpoint | HIGH | LOW | P1 |
| Bio field + editing | HIGH | LOW | P1 |
| Social links field + editing | HIGH | LOW | P1 |
| Published sites grid | HIGH | MEDIUM | P1 |
| Profile page UI | HIGH | MEDIUM | P1 |
| Avatar display | MEDIUM | LOW | P1 |
| VIP badge | LOW | LOW | P2 |
| Featured site pinning | MEDIUM | MEDIUM | P2 |
| Total visitor counts | MEDIUM | MEDIUM | P2 |
| Per-site visitor counts | MEDIUM | MEDIUM | P2 |
| Custom profile theme | LOW | HIGH | P3 |
| Site preview on hover | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch - without these, profile page is incomplete
- P2: Should have - adds meaningful value without major complexity
- P3: Nice to have - defer until after validation

---

## Schema Changes Required

### User Model Additions

```sql
-- Add bio field
ALTER TABLE users ADD COLUMN bio VARCHAR(500) DEFAULT NULL COMMENT 'Profile bio text';

-- Add social links as JSON
ALTER TABLE users ADD COLUMN social_links JSON DEFAULT NULL COMMENT '{"twitter":"", "github":"", "linkedin":"", "website":""}';
```

### Blog Model Additions

```sql
-- Add featured flag for pinning
ALTER TABLE blogs ADD COLUMN is_featured TINYINT DEFAULT 0 COMMENT '1:featured 0:normal';
```

---

## Competitor Feature Analysis

| Feature | Linktree | Carrd | about.me | Wix | Our Approach |
|---------|----------|-------|----------|-----|--------------|
| Avatar | Yes | Yes | Yes | Yes | Yes - existing field |
| Bio | Yes (80 char) | Yes | Yes | Yes | Yes - new field |
| Social links | Yes (unlimited) | Yes | Yes | Yes | Yes - new JSON field |
| Published items grid | Links only | Single page | Links only | Full sites | Published sites grid |
| Featured item | Pro only | No | No | Yes | Featured site (P2) |
| Visitor counts | Pro only | No | No | Yes | Total + per-site (P2) |
| Custom theme | Pro only | Limited | No | Yes | Custom colors (P3) |
| Follow system | Yes | No | No | Yes | No - use social links |

**Observations:**
- Linktree pioneered the link-in-bio profile, but they charge for advanced features
- Carrd is simplest - one page, minimal features
- about.me was early entrant but has not innovated much
- Wix offers full website builder with user profiles

**Our positioning:** Vibe Onepage is for users who want more than a link page - they want actual single-page websites. The profile page should showcase those sites prominently.

---

## Sources

- **Linktree** - Link-in-bio profile pages (linktr.ee)
- **Carrd** - Simple one-page site builder with profiles (carrd.co)
- **about.me** - Classic personal profile pages (about.me)
- **Wix** - Website builder with user profiles (wix.com)
- **WordPress.com** - Blogging platform with public user profiles
- **Existing codebase analysis** - User.java, Blog.java, schema.sql, UserController.java, BlogController.java

---

## Open Questions

1. **Username uniqueness enforcement** - The `username` column has UNIQUE constraint. What happens if a user wants to change their username? (Need slug migration strategy)
2. **Profile page vs published site URL conflict** - Currently sites are at `/blog/share/{shareCode}`. Profile is at `/user/{username}`. Is this the intended URL structure?
3. **Default avatar** - What if user has no avatar uploaded? Need placeholder image.
4. **Minimum blogs to show** - Should empty profiles (no published sites) be shown? What message to display?

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Table stakes features | HIGH | Standard pattern across all profile products |
| Differentiators | MEDIUM | Based on product positioning; may need user validation |
| Anti-features | MEDIUM | Based on product constraints; could change with user feedback |
| Schema recommendations | HIGH | Based on existing codebase analysis |
| Priority matrix | MEDIUM | Informed by industry patterns; actual priorities need PM input |

*Research completed: 2026-03-22*
