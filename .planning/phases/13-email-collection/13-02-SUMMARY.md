---
phase: 13-email-collection
plan: "02"
subsystem: frontend
tags:
  - email
  - registration
  - login
  - i18n
dependency_graph:
  requires:
    - 13-01
  provides:
    - email-ui
  affects:
    - frontend/src/pages/Auth/Register.jsx
    - frontend/src/pages/Auth/Login.jsx
    - frontend/src/pages/Home/Home.tsx
    - frontend/src/services/api.ts
    - frontend/src/i18n/index.jsx
tech_stack:
  added:
    - Email validation (frontend)
    - Resend verification link
    - Email banner for existing users
  patterns:
    - Email validation with regex
    - Success state management
    - Non-blocking banner with dismiss
key_files:
  created: []
  modified:
    - frontend/src/pages/Auth/Register.jsx
    - frontend/src/pages/Auth/Login.jsx
    - frontend/src/pages/Home/Home.tsx
    - frontend/src/services/api.ts
    - frontend/src/i18n/index.jsx
decisions:
  - id: 13-02-D01
    decision: Registration shows success message and redirects to login (no auto-login)
    rationale: User must verify email before accessing account
  - id: 13-02-D02
    decision: Email banner is non-blocking with dismiss option
    rationale: Existing users shouldn't be blocked from using the app
  - id: 13-02-D03
    decision: Banner state persisted in localStorage
    rationale: Banner should not reappear after dismissal
metrics:
  duration: "< 1 hour"
  completed: "2026-03-22"
---

# Phase 13 Plan 02: Email Collection UI Summary

Updated frontend registration, login, and home pages for email collection flow.

## What Was Built

**Register.jsx** - Email validation and success message:
- Empty email validation with `emailRequired` error message
- Email regex format validation with `invalidEmail` error message
- Success message displayed after successful registration
- Redirects to login page (not home) after 2 seconds
- User must verify email before login

**Login.jsx** - Unverified error handling and resend link:
- Detects `EMAIL_NOT_VERIFIED` error from backend
- Shows "Resend verification email" link for unverified users
- Calls `resendVerification` API when link clicked
- Shows success message after resend
- Shows success message when redirected from registration

**Home.tsx** - Email banner for existing users:
- Shows banner when user has no email and hasn't dismissed it
- Banner displays: "Add your email to receive notifications and recover your account"
- "Add Email" button opens AccountSettings modal (placeholder in this plan)
- Dismiss button hides banner and persists dismissal in localStorage
- Banner is non-blocking (doesn't prevent page use)

**api.ts** - Email-related API functions:
- `resendVerification(emailOrUsername)` - resends verification email
- `verifyEmail(token)` - verifies email with token
- `updateEmail(email)` - updates user email
- `getUserInfo()` - now syncs full user data to localStorage

**i18n** - New translations for email-related text:
- English and Chinese translations for all new UI strings

## Commits

| Hash | Message |
| ---- | ------- |
| 86b26e5 | feat(13-email-collection-02): add email validation and success message to Register.jsx |
| 9140826 | feat(13-email-collection-02): add unverified error handling and resend link to Login.jsx |
| 09eb3eb | feat(13-email-collection-02): add email banner to Home.tsx for users without email |
| e2d6319 | feat(13-email-collection-02): add email APIs to api.ts |
| ee9f5a8 | feat(13-email-collection-02): add email-related i18n translations |

## Verification

- Frontend builds successfully: `npm run build` passes
- All acceptance criteria met:
  - Register.jsx validates email is not empty
  - Register.jsx validates email format
  - Register.jsx shows success message after registration
  - Register.jsx redirects to login page after success
  - Login.jsx detects EMAIL_NOT_VERIFIED error
  - Login.jsx shows resend verification email link
  - Login.jsx shows success message when redirected from registration
  - Home.tsx shows banner when user has no email
  - Banner has "Add Email" button and dismiss button

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

- Home.tsx "Add Email" button sets `showAccountSettings` state but AccountSettings modal is not yet implemented (deferred to plan 03)
- Login.jsx resendVerification uses `formData.username` - this works if username is email or if backend accepts username for resend

## Self-Check: PASSED

All files exist and commits verified:
- Register.jsx: FOUND (86b26e5)
- Login.jsx: FOUND (9140826)
- Home.tsx: FOUND (09eb3eb)
- api.ts: FOUND (e2d6319)
- i18n/index.jsx: FOUND (ee9f5a8)
