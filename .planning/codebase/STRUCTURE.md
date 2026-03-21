# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```
/Users/chunxiang/Desktop/Vibe/Onepage/
├── backend/                          # Spring Boot application
│   ├── src/main/java/com/onepage/
│   │   ├── OnePageApplication.java   # Main entry point
│   │   ├── config/                   # Configuration classes
│   │   ├── controller/                # REST controllers
│   │   ├── service/                  # Business logic
│   │   ├── mapper/                   # MyBatis-Plus mappers
│   │   ├── model/                   # Entity classes
│   │   ├── dto/                     # Data transfer objects
│   │   ├── exception/               # Exception handling
│   │   ├── validation/              # Custom validators
│   │   └── util/                    # Utilities
│   ├── src/main/resources/
│   │   ├── application.yml          # App configuration
│   │   └── schema.sql               # Database schema
│   └── pom.xml                       # Maven dependencies
├── frontend/                         # React + Vite application
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # Root component with routing
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Page components
│   │   ├── context/                 # React context providers
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # API client (api.ts)
│   │   ├── config/                  # App configuration
│   │   ├── types/                   # TypeScript type definitions
│   │   ├── styles/                  # Global CSS
│   │   └── i18n/                    # Internationalization
│   ├── public/                      # Static assets (templates)
│   └── package.json
└── .claude/                          # Project documentation
    └── frontend-design-skill/        # Frontend design guidelines
```

## Directory Purposes

**Backend `config/`:**
- Purpose: Spring configuration classes, security, filters
- Key files: `SecurityConfig.java`, `JwtAuthenticationFilter.java`, `CorsConfig.java`, `RedisConfig.java`
- Note: JWT-related configs here, not in `util/`

**Backend `controller/`:**
- Purpose: REST API endpoints, request validation, response formatting
- Key files: `UserController.java`, `BlogController.java`, `PaymentController.java`, `ImageController.java`

**Backend `service/`:**
- Purpose: Business logic, transactions, external service integration
- Key files: `UserService.java`, `BlogService.java`, `OrderService.java`, `WeChatPayService.java`

**Backend `mapper/`:**
- Purpose: MyBatis-Plus database access
- Key files: `UserMapper.java`, `BlogMapper.java`, `OrderMapper.java`

**Backend `model/`:**
- Purpose: JPA/MyBatis entities mapped to database tables
- Key files: `User.java`, `Blog.java`, `Order.java`, `OrderStatus.java`

**Backend `dto/`:**
- Purpose: Request/response data structures
- Key files: `Result.java`, `BlogDTO.java`, `LoginRequest.java`, `OrderDetailDTO.java`

**Backend `exception/`:**
- Purpose: Centralized error handling
- Key files: `GlobalExceptionHandler.java`, `BusinessException.java`, `ErrorCode.java`

**Backend `validation/`:**
- Purpose: Custom Bean Validation annotations
- Key files: `ValidEmail.java`, `ValidPassword.java`, `ValidShareCode.java`

**Frontend `components/`:**
- Purpose: Reusable React components
- Subdirs: `Header/`, `common/`, `Preview/`, `Payment/`, `ShareLink/`, `TemplateGallery/`, `TemplateSelect/`, `Upload/`

**Frontend `pages/`:**
- Purpose: Page-level components, routing destinations
- Subdirs: `Home/`, `Auth/`, `BlogView/`, `Orders/`, `Templates/`
- Note: Some pages also defined inline in `App.tsx` (UploadPage, TemplatePage, PreviewPage, PaymentPage, SuccessPage)

**Frontend `context/`:**
- Purpose: React context for global state
- Key files: `BlogContext.tsx`, `AuthContext.tsx`

**Frontend `services/`:**
- Purpose: API client configuration and endpoint functions
- Key files: `api.ts` (axios instance with interceptors)

**Frontend `types/`:**
- Purpose: TypeScript type definitions
- Key files: `models.d.ts`, `api.d.ts`, `context.d.ts`

## Key File Locations

**Entry Points:**
- `backend/src/main/java/com/onepage/OnePageApplication.java`: Spring Boot main class
- `frontend/src/main.tsx`: React app bootstrap
- `frontend/src/App.tsx`: Root component with React Router routes

**Configuration:**
- `backend/src/main/resources/application.yml`: Server, DB, Redis, JWT, CORS config
- `frontend/src/config/env.ts`: Environment variables
- `frontend/src/config/templates.ts`: Template definitions
- `frontend/tailwind.config.js`: Tailwind CSS configuration

**Core Logic:**
- `backend/src/main/java/com/onepage/service/UserService.java`: User auth business logic
- `backend/src/main/java/com/onepage/service/BlogService.java`: Blog CRUD + caching
- `backend/src/main/java/com/onepage/service/OrderService.java`: Payment order management
- `frontend/src/services/api.ts`: Axios API client

**Database:**
- `backend/src/main/resources/schema.sql`: Table creation DDL
- `backend/src/main/java/com/onepage/mapper/`: MyBatis-Plus mapper interfaces

**Testing:** Not detected (no test directories or test files found)

## Naming Conventions

**Backend Java:**
- Classes: PascalCase (`UserService`, `BlogController`, `JwtAuthenticationFilter`)
- Methods: camelCase (`createBlog`, `getUserInfo`, `validateToken`)
- Variables: camelCase (`userId`, `shareCode`, `accessToken`)
- Constants: UPPER_SNAKE_CASE (`BLOG_CACHE_PREFIX`, `MAX_TITLE_LENGTH`)
- Packages: lowercase with dots (`com.onepage.service`, `com.onepage.config`)

**Frontend TypeScript/React:**
- Files: PascalCase for components (`Home.tsx`, `Header.tsx`), camelCase for others (`api.ts`, `useAuth.ts`)
- Components: PascalCase (`function Home()`, `function Header()`)
- Hooks: camelCase with `use` prefix (`useAuth`, `useBlog`)
- Variables: camelCase (`uploadedImage`, `selectedTemplate`)
- Type definitions: PascalCase (`User`, `Blog`, `ApiResponse`)

**API Paths:**
- Format: `/api/{resource}/{action}` (e.g., `/api/blog/create`, `/api/payment/qrcode`)
- RESTful: GET/POST/PUT/DELETE verbs on `/api/blog/{id}`

## Where to Add New Code

**New Feature (Backend):**
1. Create DTO in `dto/` if API input/output needed
2. Add method to existing Service or create new Service in `service/`
3. Add endpoint to existing Controller or create new Controller in `controller/`
4. Add entity in `model/` if database table needed
5. Add mapper in `mapper/` if custom DB queries needed

**New Feature (Frontend):**
1. Create component in `components/` or page in `pages/`
2. Add route in `App.tsx` inside `<Routes>`
3. Add API function in `services/api.ts`
4. Add types in `types/` if needed

**New Component/Module:**
- Backend: Follow controller-service-mapper pattern
- Frontend: Follow existing component patterns with props interface

**Utilities:**
- Backend: Add to `util/` package
- Frontend: Add to `hooks/` or `services/`

## Special Directories

**`frontend/public/templates/`:**
- Purpose: Static HTML template files for blog rendering
- Generated: No
- Committed: Yes
- Contains: 10 template directories (gallery-display, creative-card, minimal-simple, paper-fold, retro-wave, glass-morphism, ultra-minimal, neon-pulse, vintage-style, zen-minimal)

**`frontend/dist/`:**
- Purpose: Production build output
- Generated: Yes (by Vite build)
- Committed: No (in .gitignore)

**`backend/target/`:**
- Purpose: Maven build output
- Generated: Yes (by Maven)
- Committed: No (in .gitignore)

**`.claude/frontend-design-skill/`:**
- Purpose: Frontend design guidelines and reference materials
- Generated: No
- Committed: Yes
- Note: Must consult before frontend work per CLAUDE.md

---

*Structure analysis: 2026-03-21*
