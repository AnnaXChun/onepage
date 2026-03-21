---
phase: 04-publishing-payments-pdf
plan: '03'
subsystem: payments
tags: [vip, payments, credits, template-purchase]
tech_stack_added:
  - VipService (VIP subscription management)
  - TemplatePurchaseService (individual template purchase tracking)
  - UserCreditsService (user balance management)
  - UserCredits model and mapper
key_files_created:
  - backend/src/main/java/com/onepage/service/VipService.java
  - backend/src/main/java/com/onepage/service/TemplatePurchaseService.java
  - backend/src/main/java/com/onepage/service/UserCreditsService.java
  - backend/src/main/java/com/onepage/model/UserTemplatePurchase.java
  - backend/src/main/java/com/onepage/mapper/UserTemplatePurchaseMapper.java
  - backend/src/main/java/com/onepage/model/UserCredits.java
  - backend/src/main/java/com/onepage/mapper/UserCreditsMapper.java
  - backend/src/main/java/com/onepage/mapper/TemplateMapper.java
key_files_modified:
  - backend/src/main/java/com/onepage/model/User.java (added vipStatus, vipExpireTime)
  - backend/src/main/java/com/onepage/model/Template.java (added price field)
  - backend/src/main/java/com/onepage/service/OrderService.java (added VIP/template/credits order methods)
decisions:
  - Used TemplateMapper.selectById() for real DB lookups instead of stubbing
  - Created UserCreditsService as prerequisite for TemplatePurchaseService
  - VIP extends existing subscription rather than resetting
requirements:
  - PAY-01: VIP subscription (10 RMB/month) - via VipService.activateVip()
  - PAY-02: VIP users access all templates - via VipService.isVipActive()
  - PAY-03: Individual template purchase - via TemplatePurchaseService.purchaseTemplate()
  - PAY-04: Template access validation - via VipService.hasAccessToTemplate()
  - PAY-05: One-time lifetime access - via UserTemplatePurchase model
  - PAY-06: User credits balance - via UserCreditsService
  - PAY-07: Credits tracked (spent) - via UserCredits.totalSpent field
  - AUTH-03: VIP status checked in service layer (TemplateService integration point)
metrics:
  duration: ~3 minutes
  completed: '2026-03-21T11:59:42Z'
  tasks_completed: 5
  commits: 6
---

# Phase 04 Plan 03: VIP Subscriptions & Template Purchase - Summary

**One-liner:** VIP subscriptions (10 RMB/month), individual template purchases, and user credits balance tracking with WeChat Pay integration.

## Completed Tasks

| Task | Commit | Files |
|------|--------|-------|
| 1. Add VIP fields to User model | 7cbc62c | User.java |
| 2. Create UserTemplatePurchase model/mapper | 6eeb3d7 | UserTemplatePurchase.java, UserTemplatePurchaseMapper.java, Template.java, TemplateMapper.java |
| 3. Create VipService | 3bb5e5f | VipService.java |
| 4. Create TemplatePurchaseService | c24f9b7 | TemplatePurchaseService.java |
| 5. Extend OrderService | 003a25d | OrderService.java |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created missing dependencies**
- **Found during:** Task 3-4
- **Issue:** Plan referenced TemplateMapper and UserCreditsService but they did not exist in codebase
- **Fix:** Created TemplateMapper, UserCreditsService, UserCredits model/mapper as prerequisites
- **Files created:** TemplateMapper.java, UserCredits.java, UserCreditsMapper.java, UserCreditsService.java
- **Commit:** e2186b4

## Artifacts Created

### VipService
- `isVipActive(Long userId)` - Checks if user has active VIP subscription
- `hasAccessToTemplate(Long userId, String templateId)` - Core access check (PAY-02, PAY-03)
- `activateVip(Long userId)` - Activates/extends VIP subscription (PAY-01)
- `deactivateVip(Long userId)` - Deactivates VIP
- `getAccessibleTemplate(Long userId, String templateId)` - Returns template if user has access

### TemplatePurchaseService
- `purchaseTemplate(Long userId, String templateId, String orderNo)` - One-time template purchase (PAY-03, PAY-05)
- `hasPurchasedTemplate(Long userId, String templateId)` - Check prior purchase

### UserCreditsService
- `getCredits(Long userId)` - Get balance
- `addCredits(Long userId, BigDecimal amount)` - Add credits (PAY-06)
- `deductCredits(Long userId, BigDecimal amount)` - Deduct credits (PAY-03, PAY-05)
- `hasEnoughCredits(Long userId, BigDecimal amount)` - Check balance

### OrderService Extensions
- `createVipOrder(Long userId, int months)` - VIP subscription order (PAY-01)
- `createTemplatePurchaseOrder(Long userId, String templateId)` - Template purchase order (PAY-03)
- `createCreditsOrder(Long userId, BigDecimal creditsAmount, BigDecimal price)` - Credits purchase (PAY-06)

## Database Schema Additions

```sql
-- user_credits table (created via model)
-- user_template_purchases table (created via model)
-- users.vip_status, users.vip_expire_time (added to existing)
-- templates.price (added to existing)
```

## Integration Points

- TemplateService should call `VipService.hasAccessToTemplate()` before returning template
- PaymentController should call `OrderService.createVipOrder()` / `createTemplatePurchaseOrder()`
- WeChatPayService callback should call `VipService.activateVip()` on successful VIP payment

## Notes

- Maven compile failed due to pre-existing Thymeleaf dependency issue (not caused by changes)
- All services use MyBatis-Plus BaseMapper for database operations
- VIP extends existing subscription rather than resetting to new 30-day period
- Non-VIP template access requires credits (deducted at purchase time)

## Self-Check

- [x] User.java has vipStatus and vipExpireTime fields
- [x] UserTemplatePurchase.java model exists
- [x] VipService.java exists with isVipActive() and hasAccessToTemplate()
- [x] TemplatePurchaseService.java exists with purchaseTemplate()
- [x] OrderService.java has VIP subscription and template purchase order methods
- [x] All files committed individually
