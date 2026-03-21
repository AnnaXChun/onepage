# Codebase Concerns

**Analysis Date:** 2026-03-21

## Tech Debt

**Payment Integration - Mock Implementation:**
- Issue: Payment service uses mock payment URLs and simulates payment flows instead of actual WeChat Pay SDK integration
- Files: `backend/src/main/java/com/onepage/service/PaymentService.java` (lines 119-125), `backend/src/main/java/com/onepage/service/WeChatPayService.java` (lines 128-138)
- Impact: Payments cannot be processed in production - all transactions are fake
- Fix approach: Implement actual WXPay SDK calls, configure real merchant credentials, implement proper callback handling

**WeChat Pay Certificate Not Configured:**
- Issue: `getCertStream()` returns null - refunds will fail without proper certificate configuration
- Files: `backend/src/main/java/com/onepage/config/WeChatPayConfig.java` (line 30), `backend/src/main/java/com/onepage/service/WeChatPayService.java` (line 182)
- Impact: Refund functionality will fail in production
- Fix approach: Load actual merchant certificate (.p12 or .pem) from secure storage

**AI Service Not Implemented:**
- Issue: `AIService.enhanceImage()` returns null - AI image enhancement is a stub
- Files: `backend/src/main/java/com/onepage/service/AIService.java` (line 27)
- Impact: AI-powered image enhancement is non-functional
- Fix approach: Integrate with Stable Diffusion, Midjourney API, or similar AI service

**WeChat Pay Parameters Build Methods Are Stubs:**
- Issue: `buildWeChatPayParams()` and `buildRefundParams()` are incomplete TODOs
- Files: `backend/src/main/java/com/onepage/service/PaymentService.java` (lines 386-408)
- Impact: Even if SDK is called, parameter construction is incomplete
- Fix approach: Complete parameter mapping per WeChat Pay API documentation

---

## Known Bugs

**BlogController Default User ID Fallback:**
- Symptom: Unauthenticated users get blog created with userId=1 instead of proper error
- Files: `backend/src/main/java/com/onepage/controller/BlogController.java` (lines 29-31)
- Trigger: Calling `/api/blog/create` without authentication
- Workaround: Always authenticate before blog creation

**JWT Secret in Configuration File:**
- Symptom: Hardcoded dev secret in application.yml could be accidentally committed
- Files: `backend/src/main/resources/application.yml` (line 58)
- Impact: Low - uses env var in production, but dev default is weak
- Fix approach: Ensure .gitignore excludes .env files, strengthen default validation

---

## Security Considerations

**JWT Secret Weakness:**
- Risk: Default secret `onepage-dev-secret-key-change-in-production-32chars` is predictable
- Files: `backend/src/main/resources/application.yml` (line 58)
- Current mitigation: Production uses JWT_SECRET env var
- Recommendations: Add startup validation that fails if default secret is detected

**Payment Callback Signature Verification:**
- Risk: In mock mode, `verifyCallback()` returns true without actual signature check
- Files: `backend/src/main/java/com/onepage/service/WeChatPayService.java` (lines 109-110)
- Impact: Malicious callback injection possible in development/testing
- Recommendations: Ensure production configuration requires valid signatures

**CORS Allows All Origins in Development:**
- Risk: Overly permissive CORS configuration
- Files: `backend/src/main/resources/application.yml` (line 63), `backend/src/main/java/com/onepage/config/SecurityConfig.java` (line 32)
- Current mitigation: Restricted to localhost in production via env var
- Recommendations: Keep as-is with proper env var management

**Basic XSS Sanitization:**
- Risk: Blog content sanitization uses simple regex replacements - may miss edge cases
- Files: `backend/src/main/java/com/onepage/service/BlogService.java` (lines 258-266)
- Impact: Stored XSS possible in blog content
- Recommendations: Use OWASP Java HTML Sanitizer library

**No Rate Limiting:**
- Risk: Endpoints vulnerable to brute force and DoS attacks
- Files: All controllers
- Recommendations: Add Spring Boot rate limiting (e.g., Bucket4j)

---

## Performance Bottlenecks

**N+1 Query in Order List:**
- Problem: `listMyOrders()` fetches orders, then calls `getOrderDetail()` for each
- Files: `backend/src/main/java/com/onepage/controller/PaymentController.java` (lines 215-218)
- Cause: Sequential stream processing with individual DB queries
- Improvement path: Batch fetch order details in single query

**Redis Cache Without Invalidation on External Updates:**
- Problem: Blog cache invalidated on update but not on direct DB changes
- Files: `backend/src/main/java/com/onepage/service/BlogService.java` (lines 242-249)
- Impact: Stale cache data if DB updated outside service
- Improvement path: Use cache-aside pattern with shorter TTL or event-based invalidation

**Polling Payment Status in Frontend:**
- Problem: 2-second polling interval for payment status
- Files: `frontend/src/components/Payment/Payment.jsx` (line 87)
- Impact: Unnecessary API calls, potential rate limiting
- Improvement path: Implement WebSocket or Server-Sent Events for real-time updates

---

## Fragile Areas

**Payment State Machine Logic:**
- Files: `backend/src/main/java/com/onepage/service/PaymentService.java` (lines 33-40)
- Why fragile: Hardcoded state transitions - adding new states requires code changes
- Safe modification: Add new states to STATE_MACHINE map, update OrderStatus enum
- Test coverage: No unit tests for state transitions

**Dual JWT Implementation:**
- Files: `backend/src/main/java/com/onepage/util/JwtUtil.java`, `backend/src/main/java/com/onepage/util/JwtTokenProvider.java`
- Why fragile: Two different JWT utilities with overlapping functionality
- Safe modification: Deprecate JwtUtil, consolidate into JwtTokenProvider
- Test coverage: None detected

**Redis Dependency for Core Operations:**
- Files: `backend/src/main/java/com/onepage/service/BlogService.java`, `backend/src/main/java/com/onepage/service/IdempotentService.java`
- Why fragile: Application fails if Redis is unavailable - no fallback
- Safe modification: Add circuit breaker pattern, local cache fallback
- Test coverage: None detected

---

## Scaling Limits

**Stateless JWT with No Token Revocation:**
- Current capacity: Unlimited tokens valid until expiration
- Limit: Cannot force logout, cannot invalidate compromised tokens
- Scaling path: Implement token blacklist in Redis or use short-lived tokens with refresh

**Database Connection Pool:**
- Current capacity: Default HikariCP settings (max-active: 8)
- Limit: 8 concurrent DB connections
- Scaling path: Tune `spring.datasource.lettuce.pool` settings for load

**Redis Serialization:**
- Current capacity: Stores entire Blog objects as serialized Java objects
- Limit: Large blog content increases memory, cannot share cache with other services
- Scaling path: Use JSON serialization, implement compression for large values

---

## Dependencies at Risk

**WxPay SDK Version Unknown:**
- Risk: Using `com.github.wxpay.sdk` without pinned version
- Impact: Breaking changes on SDK update
- Migration plan: Pin to specific version in pom.xml, test on update

**No Dependency on Frontend:**
- Frontend has no test files, no integration tests
- Impact: Refactoring is high-risk
- Migration plan: Add Vitest, React Testing Library

---

## Missing Critical Features

**No Email Verification:**
- Problem: User registration has no email verification
- Blocks: Account validation, password reset functionality

**No Password Reset:**
- Problem: Users cannot reset forgotten passwords
- Blocks: Account recovery

**No Admin Panel:**
- Problem: No backend admin for managing users, blogs, templates
- Blocks: Content moderation, user management

**Payment Webhook Retry Logic:**
- Problem: Payment notification handling is fire-and-forget
- Blocks: Reliable payment confirmation on network failures

**No File Upload Validation:**
- Problem: `ImageController` saves files without type verification
- Files: `backend/src/main/java/com/onepage/controller/ImageController.java`
- Blocks: Malicious file upload

---

## Test Coverage Gaps

**No Backend Unit Tests:**
- What's not tested: Service layer business logic, state machines, JWT handling
- Files: Entire `backend/src/main/java/com/onepage/service/` directory
- Risk: Refactoring can break functionality undetected
- Priority: High

**No Integration Tests:**
- What's not tested: API endpoints, database interactions, Redis caching
- Risk: Production bugs due to environment differences
- Priority: High

**No Frontend Tests:**
- What's not tested: React components, user flows, payment UI
- Files: Entire `frontend/src/` directory (except node_modules)
- Risk: UI bugs undetected
- Priority: Medium

**No Test for IdempotentService:**
- What's not tested: Duplicate payment prevention
- Files: `backend/src/main/java/com/onepage/service/IdempotentService.java`
- Risk: Double payments possible if Redis race conditions occur
- Priority: High

---

*Concerns audit: 2026-03-21*
