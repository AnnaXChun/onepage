---
phase: 13-email-collection
plan: "01"
subsystem: email-verification
tags: [backend, email, sendgrid, verification]
dependency_graph:
  requires: []
  provides:
    - User.emailVerified field
    - EmailService.sendVerificationEmail()
    - UserService.verifyEmail()
    - UserService.resendVerificationEmail()
    - UserService.updateEmail()
    - POST /api/user/verify-email
    - POST /api/user/resend-verification
    - PUT /api/user/email
tech_stack:
  added:
    - spring-boot-starter-mail (Jakarta Mail)
    - SendGrid SMTP configuration
    - Thymeleaf email template rendering
  patterns:
    - Email verification with UUID tokens
    - Rate-limited resend (max 3 per 24hrs)
    - Re-verification on email change
key_files:
  created:
    - backend/src/main/java/com/onepage/service/EmailService.java
    - backend/src/main/java/com/onepage/dto/EmailRequest.java
    - backend/src/main/java/com/onepage/dto/UpdateEmailRequest.java
    - backend/src/main/resources/templates/email/email-verification.html
  modified:
    - backend/src/main/java/com/onepage/model/User.java
    - backend/src/main/java/com/onepage/dto/RegisterRequest.java
    - backend/src/main/java/com/onepage/service/UserService.java
    - backend/src/main/java/com/onepage/controller/UserController.java
    - backend/src/main/java/com/onepage/exception/ErrorCode.java
    - backend/src/main/resources/application.yml
    - backend/pom.xml
decisions:
  - id: "13-01-D01"
    decision: "Email is required at registration with @NotBlank + @Email validation"
    rationale: "Enforce email collection from day one for future notifications"
  - id: "13-01-D02"
    decision: "SendGrid SMTP via Spring Mail with Thymeleaf template rendering"
    rationale: "Per D-10 in plan; uses existing SendGrid account with templated emails"
  - id: "13-01-D03"
    decision: "UUID tokens for email verification with 24hr expiry"
    rationale: "Simple, stateless token design; no token storage needed in Redis"
  - id: "13-01-D04"
    decision: "Max 3 resend requests per 24 hours per email"
    rationale: "Rate limit resend to prevent abuse while allowing legitimate retries"
metrics:
  duration_minutes: ~5
  completed_date: "2026-03-22"
  files_created: 4
  files_modified: 7
  commits: 10
---

# Phase 13 Plan 01 Summary: Email Infrastructure

## What Was Built

Email verification infrastructure with SendGrid integration enabling:
- Required email at registration with validation
- Email uniqueness enforcement
- UUID-based verification tokens with 24hr expiry
- Rate-limited resend (max 3 per 24hrs)
- Email update with re-verification requirement
- Unverified user login blocking

## Success Criteria Status

| Criteria | Status |
|----------|--------|
| User must provide email when registering | PASS - @NotBlank + @Email on RegisterRequest |
| Email uniqueness is enforced | PASS - checkEmailUniqueness in register() |
| Verification email sent after registration | PASS - EmailService.sendVerificationEmail() called |
| User can verify email via token link | PASS - POST /api/user/verify-email?token=xxx |
| Unverified users cannot login | PASS - EMAIL_NOT_VERIFIED check in login() |
| User can resend verification (max 3/24hrs) | PASS - resendVerificationEmail() with rate limiting |
| User can update email | PASS - PUT /api/user/email triggers re-verification |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/user/verify-email | POST | Verify email with token (query param) |
| /api/user/resend-verification | POST | Resend verification email (body: {email}) |
| /api/user/email | PUT | Update email address (body: {email}, authenticated) |

## Files Modified/Created

**Model:**
- `User.java` - Added emailVerified, verificationToken, verificationExpiresAt, verificationResendCount, verificationResendResetAt

**DTOs:**
- `EmailRequest.java` - For resend verification requests
- `UpdateEmailRequest.java` - For email update requests

**Services:**
- `EmailService.java` - SendGrid SMTP email with Thymeleaf template rendering, retry logic
- `UserService.java` - Email verification logic, rate limiting, login enforcement

**Controller:**
- `UserController.java` - Added verify-email, resend-verification, email endpoints

**Config:**
- `application.yml` - Added spring.mail (SendGrid) and app.base-url
- `pom.xml` - Added spring-boot-starter-mail

**Template:**
- `templates/email/email-verification.html` - Thymeleaf email template

## Deviations from Plan

**1. [Rule 3 - Blocking Issue] Added spring-boot-starter-mail dependency**
- Found during: Backend compilation after Task 4
- Issue: `jakarta.mail.internet` package not found - Spring Mail not in dependencies
- Fix: Added spring-boot-starter-mail to pom.xml
- Files: backend/pom.xml

**2. [Rule 3 - Blocking Issue] Added SLF4J logging to UserService**
- Found during: Backend compilation after Task 6
- Issue: MyBatis-Plus ServiceImpl Log interface doesn't support SLF4J-style formatting
- Fix: Added @Slf4j annotation to UserService class
- Files: backend/src/main/java/com/onepage/service/UserService.java

## Commits (in order)

- `701b298` feat(13-email-collection): add email verification fields to User model
- `8f88bad` feat(13-email-collection): add @NotBlank to RegisterRequest.email field
- `3141645` feat(13-email-collection): create email-verification Thymeleaf template
- `6927b4d` feat(13-email-collection): create EmailService with Thymeleaf template rendering
- `71b7b57` feat(13-email-collection): create EmailRequest and UpdateEmailRequest DTOs
- `7584ced` feat(13-email-collection): add email verification logic to UserService
- `08c058e` feat(13-email-collection): add email verification endpoints to UserController
- `51bfde2` feat(13-email-collection): configure SendGrid mail in application.yml
- `22b20f5` fix(13-email-collection): add spring-boot-starter-mail dependency and SLF4J logging

## Known Stubs

None - all functionality implemented as specified.

## Verification

- Backend compiles successfully: `mvn compile -q` passes
- Email template exists with Thymeleaf syntax
- User model has all required fields
- All new service methods present
- All new endpoints present in UserController
- ErrorCode has EMAIL_ALREADY_EXISTS and EMAIL_NOT_VERIFIED

## Self-Check: PASSED

All files exist, commits verified in git log.
