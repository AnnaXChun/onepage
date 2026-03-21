# Phase 10: Payments & VIP - Research

**Researched:** 2026-03-21
**Domain:** WeChat Pay integration, order fulfillment, VIP subscription, template purchase
**Confidence:** HIGH (code analysis of existing implementation)

## Summary

Phase 10 must complete the payment loop by triggering order fulfillment after WeChat Pay confirms payment. Currently, `OrderService.confirmPayment()` only updates order status to PAID but never invokes `VipService.activateVip()`, `UserCreditsService.addCredits()`, or `TemplatePurchaseService`. The critical gap is that after a successful payment callback, no fulfillment services are called -- users pay but never receive their VIP, credits, or template access.

**Primary recommendation:** Create a `FulfillmentService` that dispatches to the correct fulfillment handler based on order type, invoked synchronously inside `OrderService.confirmPayment()` after status update. This keeps fulfillment atomic with payment confirmation and leverages existing idempotency checks.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PAY-01 | WeChat Pay callback handles successful payment and credits user account | `WeChatPayService.processCreditTopupCallback()` exists but disconnected from payment confirmation flow |
| PAY-02 | VIP subscription (10 RMB/month) grants access to all templates | `VipService.activateVip()` exists but never called after payment |
| PAY-03 | Template purchases give lifetime one-time access to that template | `UserTemplatePurchase` table exists; `TemplatePurchaseService.purchaseTemplate()` exists but never called |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| wxpay-sdk | 0.0.3 | WeChat Pay SDK integration | Already in project |
| Spring Security | (Spring Boot 3.2) | JWT auth, endpoint security | Already in project |
| Redis | (via Spring Data) | Distributed locks, idempotency | Already in project |
| RabbitMQ | 3.x | Message queuing (available but not used for payments) | Already configured but unused for payment fulfillment |

### Supporting Services (Existing)
| Service | Purpose | Key Methods |
|---------|---------|--------------|
| `OrderService` | Order CRUD, state machine, payment initiation | `confirmPayment(orderNo, txId, tradeNo)` |
| `VipService` | VIP activation/expiry, template access check | `activateVip(userId)`, `isVipActive(userId)` |
| `UserCreditsService` | Credit balance management | `addCredits(userId, amount)`, `deductCredits(userId, amount)` |
| `TemplatePurchaseService` | Template purchase recording | `purchaseTemplate(userId, templateId, orderNo)` |
| `PaymentLockService` | Redis distributed locks for payment | `tryLock(orderNo)`, idempotency keys |

### Configuration (application.yml)
```yaml
# WeChat Pay - currently empty (sandbox/mock mode)
wechat:
  appid: ${WECHAT_APPID:}
  mchid: ${WECHAT_MCHID:}
  apikey: ${WECHAT_APIKEY:}
  notifyUrl: ${WECHAT_NOTIFY_URL:}
  sandbox: false
```

## Architecture Patterns

### Existing Payment Flow (BROKEN)
```
WeChat Pay → /callback → OrderService.confirmPayment() → status=PAID only
                                                        ↓
                                              NO FULFILLMENT TRIGGERED
```

### Required Payment Flow (AFTER FIX)
```
WeChat Pay → /callback → OrderService.confirmPayment() → status=PAID
                                                        ↓
                                              FulfillmentService.dispatch(order)
                                                        ↓
                              ┌──────────────────────────┼──────────────────────────┐
                              ↓                          ↓                          ↓
                    templateId != null          templateName.startsWith        templateName.startsWith
                    && !templateName.startsWith ("VIP Subscription")          ("Credits:")
                    ("VIP") && !templateName
                    .startsWith("Credits:")              ↓                          ↓
                              ↓                   VipService.activateVip()  UserCreditsService.addCredits()
                    TemplatePurchaseService
                    .purchaseTemplate()
```

### Order Type Detection
Based on code analysis of `OrderService`:
| Order Type | templateId | templateName Pattern | Fulfillment Action |
|------------|------------|---------------------|-------------------|
| VIP Subscription | `null` | `"VIP Subscription - X month(s)"` | `vipService.activateVip(userId)` |
| Credits Top-up | `null` | `"Credits: X"` | `userCreditsService.addCredits(userId, amount)` |
| Template Purchase | set (e.g., `"1"`) | `"Template Purchase: {name}"` | `templatePurchaseService.purchaseTemplate(userId, templateId, orderNo)` |

### Synchronous vs Asynchronous Fulfillment

**Recommendation: Synchronous within `confirmPayment()` transaction**

Arguments for synchronous:
1. WeChat Pay callbacks should be idempotent -- if already PAID, fulfillment was already done
2. `confirmPayment()` already has idempotency check: `if (order.getStatus().equals(OrderStatus.PAID)) return order;`
3. Simpler architecture -- no new RabbitMQ queues needed
4. RabbitMQ is already configured but unused for payments -- introducing it adds complexity

Arguments for async (RabbitMQ):
1. If fulfillment fails, payment confirmation is rolled back -- but fulfillment services rarely fail
2. Better decoupling -- but this is a small system

**Decision: Synchronous.** The existing idempotency check in `confirmPayment()` is sufficient. If the order is already PAID, the fulfillment was already done on the prior callback. No double-fulfillment risk.

### Anti-Patterns to Avoid

1. **Don't call fulfillment BEFORE status update** -- if status update fails, fulfillment is already done (non-atomic)
2. **Don't create separate fulfillment transaction** -- if fulfillment fails after status update, rollback is complex
3. **Don't poll for payment status to trigger fulfillment** -- `status/{orderNo}` polling is for frontend only, not backend logic

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Payment idempotency | Custom deduplication | Existing `PaymentLockService.checkIdempotentKey()` + PAID status check | Already implemented and tested |
| Distributed lock for payment | Custom Redis locks | `PaymentLockService.tryLock(orderNo)` | Already implemented with correct TTL |
| VIP status check | Manual query | `VipService.isVipActive(userId)` | Handles null/expired edge cases |
| Credit balance check | Direct SQL | `UserCreditsService.getCredits(userId)` | Creates record if not exists |

## Common Pitfalls

### Pitfall 1: Fulfillment called twice on duplicate callback
**What goes wrong:** WeChat Pay may retry callback multiple times. If fulfillment is outside idempotency check, user gets double VIP months or double credits.
**Why it happens:** `confirmPayment()` idempotency check returns early if PAID -- but if fulfillment is called AFTER the check, it's already past the guard.
**How to avoid:** Wrap ALL fulfillment inside the idempotency guard, or check PAID status before any fulfillment. Pattern:
```java
if (order.getStatus().equals(OrderStatus.PAID.getCode())) {
    log.info("Order already paid, skipping fulfillment: {}", orderNo);
    return order;
}
// ... fulfillment logic
```

### Pitfall 2: Template purchase credits vs direct payment confusion
**What goes wrong:** `TemplatePurchaseService.purchaseTemplate()` deducts credits, but `OrderService.createTemplatePurchaseOrder()` creates a direct WeChat Pay order. Two different payment flows for the same thing.
**Why it happens:** Design inconsistency from prior phases.
**How to avoid:** Clarify the order type system:
- **Credits orders** (template purchase via credits): `templateName.startsWith("Credits:")` -- deduct from credit balance
- **Direct payment orders** (VIP, template via WeChat): `templateId != null` for template purchase via direct payment

### Pitfall 3: VIP activation doesn't extend existing subscription
**What goes wrong:** If a user is already VIP and pays for another month, their VIP should be extended, not reset.
**Why it happens:** `VipService.activateVip()` already handles this case (extends if `vipExpireTime.isAfter(now)`), but this is not called at all currently.
**How to avoid:** Ensure `activateVip()` is called after VIP order payment.

### Pitfall 4: Frontend doesn't refresh after payment success
**What goes wrong:** Frontend polls `/payment/status/{orderNo}`, sees PAID, calls `onSuccess()` which just delays 1.5s then navigates. User's VIP status or credits balance is not refreshed.
**Why it happens:** `Payment.jsx` line 77: `setTimeout(() => onSuccess(), 1500)` -- no state refresh.
**How to avoid:** After `onSuccess()`, frontend should call `/user/info` or `/payment/vip/status` to refresh user context.

### Pitfall 5: Order type detection via string matching
**What goes wrong:** `templateName.startsWith("VIP Subscription")` breaks if someone renames the template.
**Why it happens:** No explicit `order_type` or `product_type` field on Order model.
**How to avoid:** Consider adding an `order_type` field (enum: VIP, CREDITS, TEMPLATE) to orders table. But for this phase, string matching is acceptable given the existing code.

## Code Examples

### Current broken confirmPayment (OrderService.java lines 224-268)
```java
@Transactional
public Order confirmPayment(String orderNo, String transactionId, String tradeNo) {
    // ... validation ...
    order.setStatus(OrderStatus.PAID.getCode());
    order.setTransactionId(transactionId);
    order.setTradeNo(tradeNo);
    order.setPayTime(LocalDateTime.now());
    order.setUpdateTime(LocalDateTime.now());
    this.updateById(order);
    // MISSING: Fulfillment dispatch here
    log.info("Payment confirmed: {}, transactionId: {}", orderNo, transactionId);
    return order;
}
```

### Required: Fulfillment dispatch after status update
```java
// After order.setStatus(PAID) and updateById(order):
log.info("Payment confirmed: {}, transactionId: {}", orderNo, transactionId);

// Fulfillment dispatch - AFTER status is confirmed PAID
try {
    fulfillmentService.dispatchFulfillment(order);
} catch (Exception e) {
    log.error("Fulfillment failed for order {}, but payment is confirmed", orderNo, e);
    // Don't rollback - payment is done, fulfillment is idempotent anyway
}

return order;
```

### FulfillmentService pattern (NEW service)
```java
@Service
@RequiredArgsConstructor
public class FulfillmentService {
    private final VipService vipService;
    private final UserCreditsService userCreditsService;
    private final TemplatePurchaseService templatePurchaseService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatchFulfillment(Order order) {
        String templateName = order.getTemplateName();
        String templateId = order.getTemplateId();

        if (templateName != null && templateName.startsWith("VIP Subscription")) {
            // VIP order
            vipService.activateVip(order.getUserId());
            log.info("VIP activated for user {} via order {}", order.getUserId(), order.getOrderNo());
        } else if (templateName != null && templateName.startsWith("Credits:")) {
            // Credits top-up
            BigDecimal credits = extractCreditsFromTemplateName(templateName);
            userCreditsService.addCredits(order.getUserId(), credits);
            log.info("Credits {} added for user {} via order {}", credits, order.getUserId(), order.getOrderNo());
        } else if (templateId != null) {
            // Template purchase (direct payment)
            templatePurchaseService.recordPurchase(order.getUserId(), templateId, order.getOrderNo());
            log.info("Template {} purchased for user {} via order {}", templateId, order.getUserId(), order.getOrderNo());
        } else {
            log.warn("Unknown order type for fulfillment: orderNo={}, templateId={}, templateName={}",
                order.getOrderNo(), templateId, templateName);
        }
    }
}
```

### VIP activation already handles extension (VipService.java lines 34-57)
```java
public void activateVip(Long userId) {
    User user = userMapper.selectById(userId);
    LocalDateTime now = LocalDateTime.now();
    LocalDateTime newExpireTime;

    if (Boolean.TRUE.equals(user.getVipStatus()) && user.getVipExpireTime() != null
            && user.getVipExpireTime().isAfter(now)) {
        // Extend existing VIP
        newExpireTime = user.getVipExpireTime().plusDays(VIP_DURATION_DAYS);
    } else {
        // Start new VIP period
        newExpireTime = now.plusDays(VIP_DURATION_DAYS);
    }

    user.setVipStatus(true);
    user.setVipExpireTime(newExpireTime);
    userMapper.updateById(user);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Payment confirmed but no fulfillment | Fulfillment dispatched after confirmPayment | This phase | Completes the payment loop |
| No order type classification | Order type detected via templateId/templateName | This phase | Enables proper routing |
| Frontend polling without state refresh | Frontend refreshes user context after payment | This phase | User sees updated VIP/credits immediately |

**Deprecated/outdated:**
- `PaymentService.java` (duplicate service, Chinese comments) - not actively used, `OrderService` is the active implementation
- Direct payment for template purchases using credit deduction (`TemplatePurchaseService.purchaseTemplate`) - confused with WeChat Pay direct payment flow

## Open Questions

1. **Template purchases via credits vs direct payment**
   - What we know: `TemplatePurchaseService.purchaseTemplate()` deducts credits; `createTemplatePurchaseOrder()` creates a direct WeChat Pay order
   - What's unclear: Are template purchases meant to be paid via credits (then credits are purchased via WeChat Pay), or via direct WeChat Pay?
   - Recommendation: Treat as two separate flows: (1) Buy credits via WeChat Pay, (2) Deduct credits for template purchase. Direct WeChat Pay template purchase is a future enhancement.

2. **Order type field**
   - What we know: Order type is inferred from `templateId` and `templateName` string matching
   - What's unclear: Is there a need for explicit `order_type` enum field?
   - Recommendation: Add `order_type` column (VIP=1, CREDITS=2, TEMPLATE=3) to orders table for clarity, but string matching is acceptable for this phase

3. **Credits amount extraction from order**
   - What we know: Credits orders have `templateName = "Credits: X"` where X is the amount
   - What's unclear: How to reliably extract the numeric amount
   - Recommendation: Parse templateName or store amount in a separate `amount` field (already exists)

4. **Refund handling**
   - What we know: `OrderService.applyRefund()` changes status to REFUNDING but does NOT revoke VIP or remove template purchases
   - What's unclear: Should refunds revoke what was granted?
   - Recommendation: This is a v2 concern; for now refunds only change order status

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 (Spring Boot test) |
| Config file | None -- using Spring Boot test slices |
| Quick run command | `mvn test -Dtest=OrderServiceTest` |
| Full suite command | `mvn test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PAY-01 | Payment callback triggers credit add | Unit | `FulfillmentServiceTest.testCreditTopupFulfillment` | No |
| PAY-02 | Payment callback triggers VIP activation | Unit | `FulfillmentServiceTest.testVipFulfillment` | No |
| PAY-03 | Payment callback triggers template purchase | Unit | `FulfillmentServiceTest.testTemplatePurchaseFulfillment` | No |
| PAY-01 | Duplicate callback does not double-credit | Unit | `FulfillmentServiceTest.testIdempotentFulfillment` | No |
| PAY-02 | VIP extends existing subscription | Unit | `VipServiceTest.testExtendVip` | No |

### Wave 0 Gaps
- [ ] `backend/src/test/java/com/onepage/service/FulfillmentServiceTest.java` -- tests for fulfillment dispatch
- [ ] `backend/src/test/java/com/onepage/service/VipServiceTest.java` -- existing VipService tests
- [ ] Framework install: JUnit 5 is included in `spring-boot-starter-test`

## Sources

### Primary (HIGH confidence - code analysis)
- `OrderService.java` lines 224-268 - confirmPayment is fulfillment-free
- `VipService.java` lines 34-57 - activateVip() never called
- `UserCreditsService.java` lines 47-67 - addCredits() never called in payment flow
- `TemplatePurchaseService.java` lines 30-59 - purchaseTemplate() never called in payment flow
- `WeChatPayService.java` lines 154-188 - processCreditTopupCallback() exists but disconnected

### Secondary (MEDIUM confidence - architecture inference)
- `PaymentController.java` lines 104-140 - callback endpoints only call confirmPayment
- `Payment.jsx` lines 56-88 - frontend polling without state refresh
- `schema.sql` - order table structure, user_credits table

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - existing libraries and patterns
- Architecture: HIGH - clear what needs to change
- Pitfalls: MEDIUM - identified from code analysis, some edge cases require testing

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (30 days - payment architecture is stable)
