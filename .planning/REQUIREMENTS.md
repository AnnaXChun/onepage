# Requirements: Vibe Onepage

**Defined:** 2026-03-22
**Core Value:** Users can have a beautiful, personalized website live in minutes by combining AI-assisted generation with an intuitive block-level editor.

## v1.7 Requirements

Requirements for user profile pages. Each maps to roadmap phases.

### Profile Display

- [x] **PROF-01**: Public profile page at `/user/{username}` showing avatar, username, bio, social links
- [x] **PROF-02**: Published sites grid — cards with cover image, title, link to published blog
- [x] **PROF-03**: VIP badge on profile for VIP users
- [x] **PROF-04**: Social link icons (Twitter/X, GitHub, LinkedIn, website) with external links

### Profile Editing

- [x] **PROF-05**: Edit bio (text area, max 500 chars) in account settings
- [x] **PROF-06**: Upload avatar via existing ImageController
- [x] **PROF-07**: Edit social links (Twitter, GitHub, LinkedIn, website URLs)
- [x] **PROF-08**: View own profile preview link

### Integration

- [x] **PROF-09**: "View My Profile" link in header navigation (authenticated users)
- [x] **PROF-10**: Profile accessible without login (public page)

### Differentiators

- [x] **PROF-11**: Total visitor count across all user's published sites
- [x] **PROF-12**: Featured site — user can pin one blog to appear first on profile

## Out of Scope

| Feature | Reason |
|---------|--------|
| Follow system | Notification infrastructure, not aligned with single-page site product |
| Custom profile subdomain | Requires DNS infrastructure, deferred |
| Profile page editing of blocks | Users edit in editor, not profile page |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROF-01 | Phase 20 | Complete |
| PROF-02 | Phase 20 | Complete |
| PROF-03 | Phase 20 | Complete |
| PROF-04 | Phase 20 | Complete |
| PROF-05 | Phase 21 | Complete |
| PROF-06 | Phase 21 | Complete |
| PROF-07 | Phase 21 | Complete |
| PROF-08 | Phase 21 | Complete |
| PROF-09 | Phase 22 | Complete |
| PROF-10 | Phase 20 | Complete |
| PROF-11 | Phase 22 | Complete |
| PROF-12 | Phase 22 | Complete |

**Coverage:**
- v1.7 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-22*
*Last updated: 2026-03-22 after initial definition*
