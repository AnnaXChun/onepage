# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- Java 17 - Backend server, business logic, data access
- TypeScript 5.4 - Frontend React application
- JavaScript (ES2020) - Frontend runtime target

**Secondary:**
- SQL - Database schema definitions

## Runtime

**Backend:**
- JVM 17 - Spring Boot 3.2.0 requires Java 17+

**Frontend:**
- Node.js - Build and development (Vite dev server)

**Package Manager:**
- Maven 3.x - Backend dependency management
- npm - Frontend dependency management
- Lockfile: `frontend/package-lock.json` present

## Frameworks

**Backend Core:**
- Spring Boot 3.2.0 - Application framework
  - Spring Web - REST API endpoints
  - Spring Security - Authentication/authorization
  - Spring Data Redis - Redis integration
  - Spring AMQP - RabbitMQ message queue

**Backend Data/ORM:**
- MyBatis-Plus 3.5.5 - Database ORM with active record pattern
  - MySQL Driver - `mysql-connector-j` for MySQL 8

**Frontend Core:**
- React 18.2.0 - UI framework
- React Router 6.20.0 - Client-side routing
- Vite 5.0.8 - Build tool and dev server

**Frontend Styling:**
- TailwindCSS 3.3.6 - Utility-first CSS framework
- PostCSS 8.4.32 - CSS transformation
- Autoprefixer 10.4.16 - Vendor prefix generation

**Build/Dev Tools:**
- TypeScript 5.4 - Type checking
- @vitejs/plugin-react 4.2.1 - React JSX support

## Key Dependencies

**Authentication & Security:**
- jjwt 0.12.5 - JWT token generation and validation
  - jjwt-api, jjwt-impl, jjwt-jackson
- Spring Security - Password encoding, session management

**Payments:**
- wxpay-sdk 0.0.3 - WeChat Pay SDK integration

**Utilities:**
- Hutool 5.8.22 - ID generation, date/time utilities
- Lombok 1.18.30 - Boilerplate reduction (getters, setters, builders)

**Frontend HTTP:**
- Axios 1.6.2 - HTTP client for API calls

**Frontend QR Code:**
- qrcode.react 4.2.0 - Payment QR code rendering

## Configuration

**Backend Configuration:**
- `backend/src/main/resources/application.yml` - Main Spring Boot configuration
- `backend/config.yaml` - Local development configuration reference
- Environment variables supported for all sensitive values

**Frontend Configuration:**
- `frontend/vite.config.ts` - Vite build configuration
  - Path alias: `@/` maps to `./src/`
  - Dev server on port 5173
- `frontend/tsconfig.json` - TypeScript configuration
  - Target: ES2020
  - Strict mode enabled
- `frontend/tailwind.config.js` - Tailwind CSS configuration
  - Custom fluid typography and spacing scales
  - Custom animations (fade-in, slide-up, scale-in, glow-pulse)

**Build Output:**
- Frontend build: `dist/` directory (Vite default)

## Platform Requirements

**Development:**
- Node.js 18+ (for Vite)
- Java 17+
- MySQL 8
- Redis 6+
- RabbitMQ 3.x

**Production:**
- Linux server with JVM 17 runtime
- MySQL 8 database
- Redis server
- RabbitMQ server

---

*Stack analysis: 2026-03-21*
