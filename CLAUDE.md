# Vibe Onepage - Development Guide

## Project Overview
Single page website builder - users upload an image and generate a personal blog site with shareable links.

## Tech Stack
- **Frontend**: React 18 + Vite + TailwindCSS
- **Backend**: SpringBoot 3 + MyBatis-Plus
- **Database**: MySQL 8
- **Cache**: Redis
- **Queue**: RabbitMQ

## Frontend Design

**CRITICAL**: All frontend development MUST follow the frontend-design skill guidelines located at `.claude/frontend-design-skill/`.

### Design Direction
- **Purpose**: Help non-technical users create beautiful single-page websites
- **Tone**: Modern, bold, distinctive - NOT generic AI aesthetics
- **Aesthetic**: Refined dark theme with subtle purple/blue accents, avoiding cyan-on-dark, purple-to-blue gradients, neon accents

### Typography (from skill)
- Use distinctive fonts: Plus Jakarta Sans, Outfit, or similar
- Use fluid typography with `clamp()`
- Create clear hierarchy: 5-size system (xs, sm, base, lg, xl+)
- DO NOT use: Inter, Roboto, Arial, Open Sans, system defaults

### Color (from skill)
- Use OKLCH color space
- Tint neutrals toward brand hue (subtle purple/blue hint)
- NEVER use pure black (#000) or pure white (#fff)
- Follow 60-30-10 rule: neutrals 60%, secondary 30%, accent 10%

### Layout (from skill)
- Create visual rhythm through varied spacing
- Use fluid spacing with `clamp()`
- Embrace asymmetry - don't center everything
- Break the grid intentionally for emphasis
- DO NOT use: glassmorphism everywhere, rounded cards with generic shadows

### Motion (from skill)
- Use exponential easing (ease-out-quart/quint/expo)
- Animate only transform and opacity
- One well-orchestrated page load with staggered reveals
- DO NOT use: bounce/elastic easing, animating layout properties

## Git Workflow
1. Each feature/fix = separate commit
2. Commit message format: `type: description`
   - `feat:`, `fix:`, `docs:`, `refactor:`, `style:`
3. Push to remote after each commit
4. Use meaningful branch names: `feature/order-system`, `fix/payment-bug`

## API Base URL
- Backend: `http://localhost:8080/api/v1`

## Key Endpoints
### User
- POST `/user/register` - Register
- POST `/user/login` - Login
- GET `/user/info` - Get user info

### Blog
- POST `/blog/create` - Create blog
- GET `/blog/share/{shareCode}` - Get by share code
- GET `/blog/list` - List user blogs

### Payment
- POST `/payment/create` - Create order
- POST `/payment/qrcode` - Get payment QR code
- GET `/payment/status/{orderNo}` - Query status
- GET `/payment/detail/{orderNo}` - Order detail
- POST `/payment/refund` - Apply refund

## Order Status Flow
```
PENDING → PAYING → PAID → REFUNDING → REFUNDED
   ↓        ↓
CANCELLED  FAILED
```

## Team Instructions
1. Read `.claude/frontend-design-skill/SKILL.md` before any frontend work
2. Consult reference files in `.claude/frontend-design-skill/reference/` for:
   - typography.md - Font selection and scales
   - color-and-contrast.md - OKLCH, palettes, theming
   - spatial-design.md - Grid, rhythm, container queries
   - motion-design.md - Timing, easing, reduced motion
   - interaction-design.md - Forms, focus, loading
   - responsive-design.md - Mobile-first, fluid design
   - ux-writing.md - Labels, errors, empty states

3. Run `git add . && git commit -m "type: description" && git push` after each significant change

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Vibe Onepage**

A drag-and-drop single-page website builder SaaS. Users select a template (Blog, Resume, Personal Intro, etc.), optionally use AI to generate a personalized site from an image + text description, then edit and publish to a hosted subdomain. Some templates are free, others paid per-use or via VIP subscription.

**Target users:** Non-technical individuals who want a personal website quickly — job seekers, freelancers, small business owners, bloggers.

**Core Value:** Users can have a beautiful, personalized website live in minutes — not hours — by combining AI-assisted generation with an intuitive block-level editor.

### Constraints

- **Tech stack**: Spring Boot + React (existing — do not change)
- **AI provider**: MiniMax (specified by user)
- **Domain**: No domain yet; use localhost ports in dev, swap domain later
- **Budget**: Low-cost operation; keep infrastructure minimal
- **Timeline**: Hot endpoints must handle 500 QPS (verified with JMeter)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- Java 17 - Backend server, business logic, data access
- TypeScript 5.4 - Frontend React application
- JavaScript (ES2020) - Frontend runtime target
- SQL - Database schema definitions
## Runtime
- JVM 17 - Spring Boot 3.2.0 requires Java 17+
- Node.js - Build and development (Vite dev server)
- Maven 3.x - Backend dependency management
- npm - Frontend dependency management
- Lockfile: `frontend/package-lock.json` present
## Frameworks
- Spring Boot 3.2.0 - Application framework
- MyBatis-Plus 3.5.5 - Database ORM with active record pattern
- React 18.2.0 - UI framework
- React Router 6.20.0 - Client-side routing
- Vite 5.0.8 - Build tool and dev server
- TailwindCSS 3.3.6 - Utility-first CSS framework
- PostCSS 8.4.32 - CSS transformation
- Autoprefixer 10.4.16 - Vendor prefix generation
- TypeScript 5.4 - Type checking
- @vitejs/plugin-react 4.2.1 - React JSX support
## Key Dependencies
- jjwt 0.12.5 - JWT token generation and validation
- Spring Security - Password encoding, session management
- wxpay-sdk 0.0.3 - WeChat Pay SDK integration
- Hutool 5.8.22 - ID generation, date/time utilities
- Lombok 1.18.30 - Boilerplate reduction (getters, setters, builders)
- Axios 1.6.2 - HTTP client for API calls
- qrcode.react 4.2.0 - Payment QR code rendering
## Configuration
- `backend/src/main/resources/application.yml` - Main Spring Boot configuration
- `backend/config.yaml` - Local development configuration reference
- Environment variables supported for all sensitive values
- `frontend/vite.config.ts` - Vite build configuration
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/tailwind.config.js` - Tailwind CSS configuration
- Frontend build: `dist/` directory (Vite default)
## Platform Requirements
- Node.js 18+ (for Vite)
- Java 17+
- MySQL 8
- Redis 6+
- RabbitMQ 3.x
- Linux server with JVM 17 runtime
- MySQL 8 database
- Redis server
- RabbitMQ server
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Project Overview
## Frontend Conventions
### Naming Patterns
- React components: PascalCase (e.g., `Button.tsx`, `Header.tsx`, `ErrorBoundary.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.ts`, `useAuth.ts`)
- Services: camelCase (e.g., `api.ts`)
- Types: camelCase (e.g., `models.d.ts`, `api.d.ts`)
- Config: camelCase (e.g., `env.ts`, `templates.ts`)
- Context: PascalCase (e.g., `AuthContext.tsx`, `BlogContext.jsx`)
- camelCase for variables and functions
- PascalCase for React components and TypeScript types/interfaces
- Interface naming: PascalCase (e.g., `AuthUser`, `ButtonProps`)
- Type naming: PascalCase (e.g., `ApiResponse<T>`)
### Code Style
- Tool: Not configured (no ESLint/Prettier)
- TailwindCSS for styling with custom CSS variables
- OKLCH color space with CSS custom properties
- Custom easing: `ease-out-quart` defined in global.css
### Import Organization
- `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)
### Component Patterns
### Error Handling
- Axios interceptor handles 401 responses (clears auth, dispatches event)
- API calls use try/catch with specific error handling
- ErrorBoundary class component for component tree errors
### Logging
- `frontend/src/App.tsx` (lines 117, 124, 154, etc.)
- `frontend/src/pages/Auth/Login.jsx` - none in component, but overall inconsistent
- `frontend/src/pages/Home/Home.tsx`
### State Management
- AuthContext for authentication state (`src/context/AuthContext.tsx`)
- BlogContext for blog state (`src/context/BlogContext.jsx`)
- LanguageProvider for i18n (`src/i18n/index.jsx`)
### Styling Conventions
- CSS variables defined in `global.css` using OKLCH
- Custom animations defined in tailwind.config.js
- No arbitrary values - use consistent spacing/color tokens
## Backend Conventions
### Java Code Style
- Classes: PascalCase (e.g., `UserController`, `UserService`)
- Methods: camelCase (e.g., `getUserInfo`, `createBlog`)
- Variables: camelCase (e.g., `userId`, `accessToken`)
- Constants: UPPER_SNAKE_CASE (e.g., `BLOG_CACHE_PREFIX`)
### Spring Boot Patterns
### Error Handling
### Validation Patterns
### Logging
### DTO Pattern
### Model Pattern
## Cross-Cutting Concerns
### Security
- Stateless session management
- BCrypt password encoding
- Token stored in Redis with 7-day expiration
- CORS configured for specific origins
- Content sanitization in BlogService (strips script/iframe tags)
- URL sanitization (only allows http/https/relative/data URLs)
- Template ID regex validation: `^[A-Za-z0-9_-]+$`
### API Response Format
## Missing Conventions
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Controller-Service-Repository (Mapper) three-layer architecture
- JWT-based stateless authentication with Spring Security
- Redis for caching (blogs) and distributed locks (payments)
- RabbitMQ configured but not actively used in current code
- Response wrapper pattern (`Result<T>`) for consistent API responses
- BusinessException-based error handling with global exception handler
## Layers
- Purpose: Handle HTTP requests/responses, input validation, authentication extraction
- Location: `backend/src/main/java/com/onepage/controller/`
- Contains: `UserController.java`, `BlogController.java`, `PaymentController.java`, `ImageController.java`
- Depends on: Service layer
- Used by: Frontend, external API consumers
- Purpose: Business logic, transaction management, data transformation
- Location: `backend/src/main/java/com/onepage/service/`
- Contains: `UserService.java`, `BlogService.java`, `OrderService.java`, `WeChatPayService.java`, `IdempotentService.java`, `ImageService.java`, `AIService.java`, `PaymentLockService.java`
- Depends on: Mapper layer, Redis, JWT provider
- Used by: Controller layer
- Purpose: Database access abstraction using MyBatis-Plus
- Location: `backend/src/main/java/com/onepage/mapper/`
- Contains: `UserMapper.java`, `BlogMapper.java`, `OrderMapper.java`
- Depends on: MyBatis-Plus base mapper
- Used by: Service layer
- Purpose: Domain objects mapped to database tables
- Location: `backend/src/main/java/com/onepage/model/`
- Contains: `User.java`, `Blog.java`, `Order.java`, `OrderStatus.java`, `Template.java`
- Used by: All layers
- Purpose: Data transfer objects for API requests/responses
- Location: `backend/src/main/java/com/onepage/dto/`
- Contains: `Result.java`, `BlogDTO.java`, `LoginRequest.java`, `RegisterRequest.java`, `OrderDetailDTO.java`, `PaymentDTO.java`, `CreateOrderRequest.java`, `RefundRequest.java`, `RefreshTokenRequest.java`
- Used by: Controller and Service layers
- Purpose: Spring configuration, security, filters
- Location: `backend/src/main/java/com/onepage/config/`
- Contains: `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `JwtUserPrincipal.java`, `CorsConfig.java`, `RedisConfig.java`, `JacksonConfig.java`, `RabbitMQConfig.java`, `WeChatPayConfig.java`
- Used by: Application bootstrap
- Purpose: Centralized error handling
- Location: `backend/src/main/java/com/onepage/exception/`
- Contains: `GlobalExceptionHandler.java`, `BusinessException.java`, `ErrorCode.java`
- Used by: All layers via `throw BusinessException.*`
- Purpose: Custom bean validation annotations
- Location: `backend/src/main/java/com/onepage/validation/`
- Contains: `ValidEmail.java`, `EmailValidator.java`, `ValidPassword.java`, `PasswordValidator.java`, `ValidShareCode.java`, `ShareCodeValidator.java`, `ValidOrderAmount.java`, `OrderAmountValidator.java`
- Used by: Controller layer via `@Valid`
- Purpose: Shared utilities (JWT handling)
- Location: `backend/src/main/java/com/onepage/util/`
- Contains: `JwtUtil.java`, `JwtTokenProvider.java`
- Used by: Config layer, Service layer
## Data Flow
```
```
## Key Abstractions
- Purpose: Standardized API response format
- Examples: `Result.success(data)`, `Result.error(400, "message")`
- Pattern: `{ code: number, message: string, data: T }`
- Purpose: Typed business errors with ErrorCode enum
- Examples: `BusinessException.badRequest()`, `BusinessException.unauthorized()`, `BusinessException.blogNotFound()`
- Pattern: Thrown throughout service layer, caught by `GlobalExceptionHandler`
- Purpose: Security context principal containing authenticated user info
- Location: `com.onepage.config.JwtUserPrincipal`
- Pattern: `{ userId: Long, username: String }`
- Purpose: Base service class providing CRUD via injected mapper
- Pattern: `BlogService extends ServiceImpl<BlogMapper, Blog>`
## Entry Points
- Location: `backend/src/main/java/com/onepage/OnePageApplication.java`
- Triggers: Spring Boot application startup via `SpringApplication.run()`
- Responsibilities: Component scan, MyBatis-Plus mapper scan (`@MapperScan`), Jackson configuration
- Location: `frontend/src/main.tsx`
- Triggers: Vite dev server or production build
- Responsibilities: React app bootstrap with `BrowserRouter` wrapping `App` component
- `UserController` - `/api/user/*` (login, register, refresh, info, logout)
- `BlogController` - `/api/blog/*` (create, update, delete, list, share)
- `PaymentController` - `/api/payment/*` (create, qrcode, callback, status, refund, cancel, detail, list)
- `ImageController` - `/api/upload/*` (image upload)
## Error Handling
- Business exceptions: `throw BusinessException.badRequest("message")`
- Validation errors: Automatic via `@Valid` on `@RequestBody`
- Authentication errors: JWT filter sets 401 JSON response
- Access denied: Spring Security returns 403 JSON response
- Generic errors: Logged server-side, "System error" returned to client
```json
```
- `/api/user/login`
- `/api/user/register`
- `/api/blog/share/{shareCode}`
- `/api/payment/callback`
- `/api/payment/qrcode/**`
- `/api/payment/status/**`
- `/api/payment/detail/**`
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
