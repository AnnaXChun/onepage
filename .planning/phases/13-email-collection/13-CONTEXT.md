# Phase 13: Email Collection - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Collect user email during registration (with verification) and allow users to update their email in account settings. This phase covers EML-01 (email required at registration) and EML-02 (email update in settings), plus the email verification flow and SMTP infrastructure needed to support future notification emails.

</domain>

<decisions>
## Implementation Decisions

### Registration Email Enforcement
- **D-01:** Email is **required** at registration — add `@NotBlank` to RegisterRequest.email field
- **D-02:** Use standard `@Email` validation (not blocking disposable emails)
- **D-03:** Email uniqueness enforced — one account per email
- **D-04:** Existing users without email: show non-blocking banner prompting to add email on next login

### Settings/Profile Page
- **D-05:** Account Settings accessed from Home page header — user avatar dropdown with 'Account Settings', 'Credits', 'Orders', 'Logout'
- **D-06:** Account Settings is a **modal dialog** (not a separate page or slide-over)
- **D-07:** Account Settings Phase 13 scope: **email only** (minimal scope)
- **D-08:** Email update saves immediately to DB (no verification on update)

### Email Service Provider
- **D-09:** Use **SendGrid** for transactional email sending
- **D-10:** Email content uses **Thymeleaf template** (reuse existing Thymeleaf setup from publishing)
- **D-11:** From address: **noreply@vibe.com**
- **D-12:** Failed email sends: **retry up to 3 times** with exponential backoff

### Email Verification Flow
- **D-13:** Send verification email after registration — user must verify email before account is active
- **D-14:** Verification link expires in **24 hours**
- **D-15:** Allow resend of verification email — limit to 3 resends per 24 hours
- **D-16:** Unverified accounts attempting login: show error + resend link

### Claude's Discretion
- Exact SendGrid API integration details (Spring Mail configuration)
- Thymeleaf email template styling (colors, layout)
- Verification token generation approach (UUID vs JWT)
- How to handle expired verification tokens (expired.html vs redirect)
- Banner UI design for "existing users without email" prompt
- Modal styling for Account Settings

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Backend Patterns
- `backend/src/main/java/com/onepage/dto/RegisterRequest.java` — existing registration DTO to modify
- `backend/src/main/java/com/onepage/model/User.java` — User model with email field already exists
- `backend/src/main/java/com/onepage/controller/UserController.java` — existing user controller
- `backend/src/main/java/com/onepage/service/UserService.java` — existing user service

### Frontend Patterns
- `frontend/src/pages/Auth/Register.jsx` — existing registration form (email field already present)
- `frontend/src/pages/Home/Home.tsx` — where header avatar dropdown needs Account Settings link
- `frontend/src/pages/Auth/Login.jsx` — where unverified user flow will show error

### Email Infrastructure
- No existing email infrastructure — need to add Spring Boot Mail + SendGrid
- Schema: `backend/src/main/resources/schema.sql` — email field already NOT NULL

### Existing Thymeleaf
- `backend/src/main/resources/templates/` — existing Thymeleaf templates for site publishing

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- User model already has `email` field
- RegisterRequest.java already has email field with `@Email` validation
- Frontend Register.jsx already has email input field
- UserController already has `/api/user/info` endpoint returning full User object
- Thymeleaf templating engine already configured for HTML-to-PDF

### Established Patterns
- Modal dialogs used in CreditTopup.tsx for credit purchase flow
- Slide-over panels used in SEO panel (Phase 12)
- Spring Boot Mail for email sending
- RabbitMQ for async job processing

### Integration Points
- New: Add email update endpoint `PUT /api/user/email`
- New: Email verification endpoint `POST /api/user/verify-email` and `POST /api/user/resend-verification`
- New: Account Settings modal component in frontend
- Backend: SendGrid SMTP configuration in application.yml
- Frontend: Header avatar dropdown needs Account Settings link
</code_context>

<specifics>
## Specific Ideas

- Email verification token: use UUID stored in User model or separate verification_tokens table
- Banner for existing users: non-blocking top banner on Home page
- Account Settings modal: simple centered modal with email input and save button
- SendGrid integration: use Spring Boot Starter Mail with SendGrid SMTP

</specifics>

<deferred>
## Deferred Ideas

- Email verification for email updates (not just registration) — verify when user changes email address
- Password change in Account Settings
- Avatar upload in Account Settings
- Full profile page with more fields
- Other SMTP providers (Mailgun, AWS SES) if SendGrid limits are hit

---

*Phase: 13-email-collection*
*Context gathered: 2026-03-22*
