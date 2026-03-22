# Phase 13: Email Collection - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-22
**Phase:** 13-email-collection
**Areas discussed:** Registration email enforcement, Settings/profile page location, Email service provider, Email verification flow

---

## Registration Email Enforcement

| Option | Description | Selected |
|--------|-------------|----------|
| Required at registration | Users must provide email when signing up. Ensures all users have email for notifications. Aligns with DB constraint. | ✓ |
| Optional — add in settings | Users can skip email at signup and add it later when they want notifications or need account recovery. | |

**User's choice:** Required at registration
**Notes:** Aligns with existing DB constraint (NOT NULL)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Standard @Email validation | Standard format check (user@domain.com). Simple, works for most cases. | ✓ |
| Block disposable email domains | Also check against a list of known disposable email providers (mailinator, tempmail, etc.). More friction but ensures real emails. | |

**User's choice:** Standard @Email validation
**Notes:** Simpler to implement

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — one account per email | Each email can only be used for one account. Prevents duplicate accounts, simpler identity management. | ✓ |
| No — allow multiple accounts | Same email can be used for multiple accounts. More flexible but can cause confusion. | |

**User's choice:** Yes — one account per email
**Notes:** Prevents duplicate accounts

---

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt to add email on next login | If existing user has no email, show a non-blocking banner prompting them to add it. | ✓ |
| Force add before using key features | Block access to AI generation, publishing, etc. until email is added. | |
| No special handling | Existing users without email can continue normally. Email only required for new registrations. | |

**User's choice:** Prompt to add email on next login
**Notes:** Non-blocking for existing users

---

## Settings/Profile Page Location

| Option | Description | Selected |
|--------|-------------|----------|
| Add to Home page header | User avatar in top-right → dropdown with 'Account Settings', 'Credits', 'Orders', 'Logout' | ✓ |
| Separate top-level nav item | A new 'Settings' link in the main navigation | |
| Inside Blog editor menu | Settings accessed from the blog editor's toolbar/menu | |

**User's choice:** Add to Home page header (avatar dropdown)
**Notes:** Consistent with how other account features are accessed

---

| Option | Description | Selected |
|--------|-------------|----------|
| Email only | Just email field — keeps scope minimal for Phase 13. Other settings (password, profile) can be future phases. | ✓ |
| Email + Username display | Show username, allow email change. Username changes could be a separate discussion. | |
| Email + basic profile | Email + avatar URL + username display. More complete but wider scope. | |

**User's choice:** Email only
**Notes:** Minimal scope for Phase 13

---

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog | Popup modal over current page. Faster to implement, doesn't navigate away from current context. | ✓ |
| Separate page | Full page navigation to settings. Better for complex settings but requires routing. | |
| Slide-over panel | Slides in from right edge like a drawer. Similar to SEO panel pattern used in Phase 12. | |

**User's choice:** Modal dialog
**Notes:** Faster, doesn't navigate away

---

| Option | Description | Selected |
|--------|-------------|----------|
| Update immediately | Save directly to DB. User can change it anytime. Simple flow. | ✓ |
| Require email verification | Send verification link to new email before confirming change. More secure but adds friction. | |
| Keep old email as backup | Store previous email briefly in case of mistakes. More complex. | |

**User's choice:** Update immediately
**Notes:** Simpler flow, no verification friction on update

---

## Email Service Provider

| Option | Description | Selected |
|--------|-------------|----------|
| SendGrid | Free tier: 100 emails/day, 5,000/month. Industry standard for transactional email. API key based. | ✓ |
| Mailgun | Free tier: 5,000 emails/month. Good deliverability, API key based. | |
| Gmail SMTP | Free, no API key needed (app password). But strict sending limits (500/day) and Google can flag accounts. | |
| AWS SES | $0.10 per 1000 emails. Very cheap at scale but requires AWS setup and domain verification. | |

**User's choice:** SendGrid
**Notes:** Industry standard, good free tier

---

| Option | Description | Selected |
|--------|-------------|----------|
| Simple HTML template | Inline CSS, simple branded template with logo. No external dependencies. | |
| Thymeleaf template | Reuse existing Thymeleaf setup from publishing. More powerful templating but heavier. | ✓ |
| Plain text | Simple text email. Minimal design but guaranteed deliverability. | |

**User's choice:** Thymeleaf template
**Notes:** Reuse existing tech stack

---

| Option | Description | Selected |
|--------|-------------|----------|
| noreply@vibe.com | Standard noreply address. User sees 'Vibe' as sender name. | ✓ |
| hello@vibe.com | Friendly hello address. May feel more personal. | |
| No-reply via domain | Whatever domain is configured for the platform later. | |

**User's choice:** noreply@vibe.com
**Notes:** Standard approach

---

| Option | Description | Selected |
|--------|-------------|----------|
| No retry — fail silently | Log the failure but don't retry. Transactional emails are not critical. Keeps infra simple. | |
| Retry up to 3 times | If email fails, retry with exponential backoff. More reliable but adds complexity. | ✓ |
| Queue for manual retry | Store failed emails in DB, allow manual retry. Best reliability but most complex. | |

**User's choice:** Retry up to 3 times
**Notes:** Balanced approach

---

## Email Verification Flow

| Option | Description | Selected |
|--------|-------------|----------|
| No verification now | Trust the email provided. Add verification later if abuse becomes a problem. Faster to ship Phase 13. | |
| Yes — verify before account active | User must click link in email before using account. More secure but adds friction to onboarding. | ✓ |
| Yes — verify but allow limited access | User can use the app but can't publish/send notifications until email verified. | |

**User's choice:** Yes — verify before account active
**Notes:** More secure

---

| Option | Description | Selected |
|--------|-------------|----------|
| 24 hours | Standard expiration. Long enough for user to check email, short enough to limit abuse. | ✓ |
| 48 hours | More lenient. Good for users who don't check email immediately. | |
| 72 hours | Most lenient but longer window for abuse if email is compromised. | |

**User's choice:** 24 hours
**Notes:** Standard practice

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — allow resend | User can request new verification email. Limit to 3 resends per 24 hours to prevent abuse. | ✓ |
| No resend | User must wait for expiry or contact support. Simpler but poor UX. | |

**User's choice:** Yes — allow resend
**Notes:** Better UX with rate limiting

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show error + resend link | Login shows 'email not verified' error with link to resend verification. Clean flow. | ✓ |
| Show error only | Tell user to verify, no resend link in error. They must go to email. | |
| Auto-resend on login | Automatically send new verification email on each login attempt. | |

**User's choice:** Show error + resend link
**Notes:** Clean UX with easy resend

---

## Claude's Discretion

- Exact SendGrid API integration details (Spring Mail configuration)
- Thymeleaf email template styling (colors, layout)
- Verification token generation approach (UUID vs JWT)
- How to handle expired verification tokens (expired.html vs redirect)
- Banner UI design for "existing users without email" prompt
- Modal styling for Account Settings
