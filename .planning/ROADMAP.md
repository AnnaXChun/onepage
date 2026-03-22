# Vibe Onepage - Roadmap

**Project:** Vibe Onepage - AI-Powered Single-Page Website Builder
**Granularity:** Standard
**Total v1 Requirements:** 58 (58 validated, 0 remaining)

---

## Milestones

- [x] **v1.0 MVP** — Phases 1-5 (shipped 2026-03-21)
- [x] **v1.1 Completion** — Phases 6-10 (shipped 2026-03-21)
- [x] **v1.2 Analytics** — Phase 11 (SHIPPED 2026-03-22)
- [x] **v1.3 SEO Tools** — Phase 12 (SHIPPED 2026-03-22)
- [x] **v1.4 Email & Notifications** — Phases 13-14 (SHIPPED 2026-03-22)
- [x] **v1.5 Enhanced Analytics** — Phases 15-17 (SHIPPED 2026-03-22)
- [x] **v1.6 UI Polish** — Phases 18-19 (SHIPPED 2026-03-22)
- [ ] **v1.7 User Profiles** — Phases 20-22

---

## Phases

- [ ] **Phase 20: Public Profile Display** - Backend API and frontend display for public profile page
- [ ] **Phase 21: Profile Editing** - Authenticated profile editing flow with bio, avatar, social links
- [ ] **Phase 22: Integration and Polish** - Navigation integration, visitor counts, featured site pinning

---

## Phase Details

### Phase 20: Public Profile Display

**Goal:** Public profile page at `/user/{username}` is fully functional with avatar, username, bio, social links, and published sites grid.

**Depends on:** Phase 19 (previous milestone)

**Requirements:** PROF-01, PROF-02, PROF-03, PROF-04, PROF-10

**Success Criteria** (what must be TRUE):
1. User can view public profile at `/user/{username}` without logging in
2. Profile displays avatar image, username, and bio text
3. Profile displays social link icons (Twitter/X, GitHub, LinkedIn, website) that open in new tabs
4. Profile displays VIP badge for users with active VIP status
5. Profile displays grid of user's published blog cards with cover image, title, and link to published blog

**Plans:** TBD

---

### Phase 21: Profile Editing

**Goal:** Authenticated users can edit their profile bio, avatar, and social links in account settings.

**Depends on:** Phase 20

**Requirements:** PROF-05, PROF-06, PROF-07, PROF-08

**Success Criteria** (what must be TRUE):
1. User can edit bio text in account settings (text area, max 500 characters)
2. User can upload avatar image via existing ImageController
3. User can edit social links (Twitter, GitHub, LinkedIn, website URLs)
4. User can view their own profile preview link from account settings

**Plans:** TBD

---

### Phase 22: Integration and Polish

**Goal:** Profile integrates with navigation and adds differentiating features (visitor counts, featured site).

**Depends on:** Phase 21

**Requirements:** PROF-09, PROF-11, PROF-12

**Success Criteria** (what must be TRUE):
1. Authenticated users see "View My Profile" link in header navigation
2. Profile displays total visitor count across all user's published sites
3. User can pin one blog as featured site, which appears first on profile grid

**Plans:** TBD

---

## v1.7 Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 20. Public Profile Display | 0/1 | Not started | - |
| 21. Profile Editing | 0/1 | Not started | - |
| 22. Integration and Polish | 0/1 | Not started | - |

---

*Last updated: 2026-03-22 after v1.7 roadmap created*
