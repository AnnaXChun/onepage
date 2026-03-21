# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Layered REST API with Service-Repository pattern (MyBatis-Plus)

**Key Characteristics:**
- Controller-Service-Repository (Mapper) three-layer architecture
- JWT-based stateless authentication with Spring Security
- Redis for caching (blogs) and distributed locks (payments)
- RabbitMQ configured but not actively used in current code
- Response wrapper pattern (`Result<T>`) for consistent API responses
- BusinessException-based error handling with global exception handler

## Layers

**Controller Layer:**
- Purpose: Handle HTTP requests/responses, input validation, authentication extraction
- Location: `backend/src/main/java/com/onepage/controller/`
- Contains: `UserController.java`, `BlogController.java`, `PaymentController.java`, `ImageController.java`
- Depends on: Service layer
- Used by: Frontend, external API consumers

**Service Layer:**
- Purpose: Business logic, transaction management, data transformation
- Location: `backend/src/main/java/com/onepage/service/`
- Contains: `UserService.java`, `BlogService.java`, `OrderService.java`, `WeChatPayService.java`, `IdempotentService.java`, `ImageService.java`, `AIService.java`, `PaymentLockService.java`
- Depends on: Mapper layer, Redis, JWT provider
- Used by: Controller layer

**Repository/Mapper Layer:**
- Purpose: Database access abstraction using MyBatis-Plus
- Location: `backend/src/main/java/com/onepage/mapper/`
- Contains: `UserMapper.java`, `BlogMapper.java`, `OrderMapper.java`
- Depends on: MyBatis-Plus base mapper
- Used by: Service layer

**Model/Entity Layer:**
- Purpose: Domain objects mapped to database tables
- Location: `backend/src/main/java/com/onepage/model/`
- Contains: `User.java`, `Blog.java`, `Order.java`, `OrderStatus.java`, `Template.java`
- Used by: All layers

**DTO Layer:**
- Purpose: Data transfer objects for API requests/responses
- Location: `backend/src/main/java/com/onepage/dto/`
- Contains: `Result.java`, `BlogDTO.java`, `LoginRequest.java`, `RegisterRequest.java`, `OrderDetailDTO.java`, `PaymentDTO.java`, `CreateOrderRequest.java`, `RefundRequest.java`, `RefreshTokenRequest.java`
- Used by: Controller and Service layers

**Config Layer:**
- Purpose: Spring configuration, security, filters
- Location: `backend/src/main/java/com/onepage/config/`
- Contains: `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `JwtUserPrincipal.java`, `CorsConfig.java`, `RedisConfig.java`, `JacksonConfig.java`, `RabbitMQConfig.java`, `WeChatPayConfig.java`
- Used by: Application bootstrap

**Exception Layer:**
- Purpose: Centralized error handling
- Location: `backend/src/main/java/com/onepage/exception/`
- Contains: `GlobalExceptionHandler.java`, `BusinessException.java`, `ErrorCode.java`
- Used by: All layers via `throw BusinessException.*`

**Validation Layer:**
- Purpose: Custom bean validation annotations
- Location: `backend/src/main/java/com/onepage/validation/`
- Contains: `ValidEmail.java`, `EmailValidator.java`, `ValidPassword.java`, `PasswordValidator.java`, `ValidShareCode.java`, `ShareCodeValidator.java`, `ValidOrderAmount.java`, `OrderAmountValidator.java`
- Used by: Controller layer via `@Valid`

**Utility Layer:**
- Purpose: Shared utilities (JWT handling)
- Location: `backend/src/main/java/com/onepage/util/`
- Contains: `JwtUtil.java`, `JwtTokenProvider.java`
- Used by: Config layer, Service layer

## Data Flow

**Authentication Flow:**
1. Request arrives at `JwtAuthenticationFilter` (OncePerRequestFilter)
2. Filter extracts JWT from `Authorization: Bearer <token>` header
3. `JwtTokenProvider` validates token and extracts userId/username
4. `JwtUserPrincipal` created and stored in `SecurityContextHolder`
5. Controller retrieves via `SecurityContextHolder.getContext().getAuthentication()`

**Blog Creation Flow:**
1. POST `/api/blog/create` with `BlogDTO` body
2. `JwtAuthenticationFilter` authenticates user (skipped for public share endpoint)
3. `BlogController.createBlog()` extracts userId from SecurityContext
4. `BlogService.createBlog()` validates input, generates shareCode, saves to DB
5. `BlogService.cacheBlog()` stores in Redis with 24-hour TTL
6. Returns created `Blog` entity wrapped in `Result.success(blog)`

**Payment Flow:**
1. POST `/api/payment/create` creates order with status PENDING
2. POST `/api/payment/qrcode` calls `initiatePayment()` with Redis distributed lock
3. Status transitions PENDING -> PAYING
4. WeChatPay callback at `/api/payment/callback` or `/api/payment/notify`
5. `confirmPayment()` with idempotency check via Redis key
6. Status transitions PAYING -> PAID
7. Client polls `/api/payment/status/{orderNo}` to check status

**Order Status State Machine:**
```
PENDING -> PAYING -> PAID -> REFUNDING -> REFUNDED
   |        |
CANCELLED  FAILED
```

## Key Abstractions

**Result<T> (Response Wrapper):**
- Purpose: Standardized API response format
- Examples: `Result.success(data)`, `Result.error(400, "message")`
- Pattern: `{ code: number, message: string, data: T }`

**BusinessException:**
- Purpose: Typed business errors with ErrorCode enum
- Examples: `BusinessException.badRequest()`, `BusinessException.unauthorized()`, `BusinessException.blogNotFound()`
- Pattern: Thrown throughout service layer, caught by `GlobalExceptionHandler`

**JwtUserPrincipal:**
- Purpose: Security context principal containing authenticated user info
- Location: `com.onepage.config.JwtUserPrincipal`
- Pattern: `{ userId: Long, username: String }`

**ServiceImpl<T, M> (MyBatis-Plus):**
- Purpose: Base service class providing CRUD via injected mapper
- Pattern: `BlogService extends ServiceImpl<BlogMapper, Blog>`

## Entry Points

**Backend Application:**
- Location: `backend/src/main/java/com/onepage/OnePageApplication.java`
- Triggers: Spring Boot application startup via `SpringApplication.run()`
- Responsibilities: Component scan, MyBatis-Plus mapper scan (`@MapperScan`), Jackson configuration

**Frontend Application:**
- Location: `frontend/src/main.tsx`
- Triggers: Vite dev server or production build
- Responsibilities: React app bootstrap with `BrowserRouter` wrapping `App` component

**API Controllers:**
- `UserController` - `/api/user/*` (login, register, refresh, info, logout)
- `BlogController` - `/api/blog/*` (create, update, delete, list, share)
- `PaymentController` - `/api/payment/*` (create, qrcode, callback, status, refund, cancel, detail, list)
- `ImageController` - `/api/upload/*` (image upload)

## Error Handling

**Strategy:** Centralized via `@RestControllerAdvice GlobalExceptionHandler`

**Patterns:**
- Business exceptions: `throw BusinessException.badRequest("message")`
- Validation errors: Automatic via `@Valid` on `@RequestBody`
- Authentication errors: JWT filter sets 401 JSON response
- Access denied: Spring Security returns 403 JSON response
- Generic errors: Logged server-side, "System error" returned to client

**Error Response Format:**
```json
{ "code": 400, "message": "Validation failed", "data": null }
```

**Public Endpoints (no auth required):**
- `/api/user/login`
- `/api/user/register`
- `/api/blog/share/{shareCode}`
- `/api/payment/callback`
- `/api/payment/qrcode/**`
- `/api/payment/status/**`
- `/api/payment/detail/**`

## Cross-Cutting Concerns

**Logging:** SLF4J with `@Slf4j` annotations, per-layer log levels configured in `application.yml`

**Validation:** Jakarta Bean Validation (`@Valid`) + custom annotations in `validation/` package

**Authentication:** JWT with 7-day access token, 30-day refresh token, stored in Redis on login

**Caching:** Redis for blog caching (24-hour TTL) and payment idempotency locks (30-second TTL)

**Transaction:** `@Transactional` on service methods that modify multiple entities

---

*Architecture analysis: 2026-03-21*
