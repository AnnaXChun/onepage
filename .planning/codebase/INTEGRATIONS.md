# External Integrations

**Analysis Date:** 2026-03-21

## APIs & External Services

**Payment Processing:**
- WeChat Pay - Primary payment provider
  - SDK: `com.github.wxpay:wxpay-sdk:0.0.3`
  - Service: `com.onepage.service.WeChatPayService`
  - Auth: `wechat.appid`, `wechat.mchid`, `wechat.apikey` (env vars)
  - Features: Create prepay orders, query status, verify callbacks
  - Fallback: Mock payment when not configured (sandbox mode)

## Data Storage

**MySQL 8:**
- Database: `onepage` (default)
- Connection: `jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:onepage}`
- ORM: MyBatis-Plus 3.5.5
- Config: `backend/src/main/resources/application.yml` lines 16-20

**Tables:**
- `users` - User accounts with password, email, avatar
- `blogs` - Blog posts with share codes
- `orders` - Payment orders with state machine (PENDING/PAYING/PAID/REFUNDING/REFUNDED/CANCELLED/FAILED/EXPIRED)
- `templates` - Website templates with pricing

**Redis:**
- Purpose: Caching, distributed locks, token storage
- Connection: `spring.data.redis` config in `application.yml`
- Client: Spring Data Redis with Jackson serialization
- Key patterns:
  - `user:token:{userId}` - JWT token invalidation
  - `blog:cache:{id}` - Blog caching
  - `blog:cache:share:{shareCode}` - Share code lookups
  - `payment:lock:{orderNo}` - Distributed payment locks
  - `idempotent:{key}` - Idempotent operation keys
- Config: `com.onepage.config.RedisConfig`

**File Storage:**
- Local filesystem: `./uploads` (configurable via `UPLOAD_PATH`)
- Multipart upload: Max 10MB per file
- Config: `application.yml` lines 39-42

**RabbitMQ:**
- Purpose: Async blog generation queue
- Connection: `spring.rabbitmq` config in `application.yml`
- Queues: `blog.generate.queue`
- Exchanges: `blog.generate.exchange` (Direct)
- Routing Key: `blog.generate`
- Config: `com.onepage.config.RabbitMQConfig`

## Authentication & Identity

**JWT Authentication:**
- Library: io.jsonwebtoken (jjwt 0.12.5)
- Secret: Configurable via `JWT_SECRET` env var
- Token expiration: 7 days (604800000ms)
- Refresh token expiration: 30 days (2592000000ms)
- Storage: Frontend localStorage, backend Redis for invalidation
- Service: `com.onepage.service.UserService`

**Password Security:**
- Spring Security password encoding
- Bcrypt-like mechanism (Spring Security default)

**Frontend Auth Flow:**
- Token stored in localStorage
- Bearer token in Authorization header
- 401 response triggers token cleanup and auth change event
- Service: `frontend/src/services/api.ts`

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Bugsnag, or similar)

**Logs:**
- Backend: SLF4J with Spring Boot defaults
- Log level: `com.onepage: debug` (configured)
- MyBatis SQL logging: Enabled (`log-impl: org.apache.ibatis.logging.stdout.StdOutImpl`)
- Frontend: console.log (no structured logging)

## CI/CD & Deployment

**Hosting:**
- Not detected (no Dockerfile, docker-compose, or cloud configs visible)

**CI Pipeline:**
- Not detected (no GitHub Actions, Jenkins, or similar)

## Environment Configuration

**Required env vars (Backend):**
```
DB_HOST          # MySQL host (default: localhost)
DB_PORT          # MySQL port (default: 3306)
DB_USERNAME      # MySQL username (default: root)
DB_PASSWORD      # MySQL password
DB_NAME          # Database name (default: onepage)

REDIS_HOST       # Redis host (default: localhost)
REDIS_PORT       # Redis port (default: 6379)

RABBITMQ_HOST    # RabbitMQ host (default: localhost)
RABBITMQ_PORT    # RabbitMQ port (default: 5672)
RABBITMQ_USERNAME
RABBITMQ_PASSWORD

JWT_SECRET       # JWT signing secret
JWT_EXPIRATION   # Token TTL in ms (default: 604800000)
CORS_ALLOWED_ORIGINS  # Comma-separated allowed origins

UPLOAD_PATH      # File upload directory (default: ./uploads)

# WeChat Pay (optional - mock mode if not set)
WEIXIN_APP_ID
WEIXIN_MCH_ID
WEIXIN_API_KEY
WEIXIN_NOTIFY_URL
```

**Required env vars (Frontend):**
```
VITE_API_URL     # Backend API URL (default: http://localhost:8080/api)
VITE_PREVIEW_URL # Preview server URL (default: http://localhost:3000)
```

**Config files:**
- `backend/config.yaml` - Local dev config reference
- `frontend/src/config/env.ts` - API URL configuration

## Webhooks & Callbacks

**Incoming:**
- WeChat Pay notify URL: `POST /api/payment/notify`
  - Validates payment success callbacks
  - Service: `WeChatPayService.verifyCallback()`
- WeChat Pay refund notify URL: `POST /api/payment/refund-notify`

**Outgoing:**
- WeChat Pay unified order API - Creates QR code payments
- Order query API - Polls payment status

---

*Integration audit: 2026-03-21*
