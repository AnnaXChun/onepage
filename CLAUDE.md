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
