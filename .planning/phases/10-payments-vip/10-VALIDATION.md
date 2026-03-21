# Phase 10: Payments & VIP - Validation

**Created:** 2026-03-21
**Phase:** 10-payments-vip

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | JUnit 5 (Spring Boot test) |
| Config file | None -- using Spring Boot test slices |
| Quick run command | `mvn test -Dtest=FulfillmentServiceTest` |
| Full suite command | `mvn test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Test Method | File |
|--------|----------|-----------|------------|------|
| PAY-01 | Payment callback triggers credit add | Unit | `testCreditTopupFulfillment` | FulfillmentServiceTest.java |
| PAY-02 | Payment callback triggers VIP activation | Unit | `testVipFulfillment` | FulfillmentServiceTest.java |
| PAY-03 | Payment callback triggers template purchase | Unit | `testTemplatePurchaseFulfillment` | FulfillmentServiceTest.java |
| PAY-01 | Duplicate callback does not double-credit | Unit | `testIdempotentFulfillment` | FulfillmentServiceTest.java |
| PAY-02 | VIP extends existing subscription | Unit | `testExtendVip` | VipServiceTest.java |

### Wave 0 Gaps
- [ ] `backend/src/test/java/com/onepage/service/FulfillmentServiceTest.java` -- tests for fulfillment dispatch
- [ ] `backend/src/test/java/com/onepage/service/VipServiceTest.java` -- VipService tests
- [ ] Framework install: JUnit 5 is included in `spring-boot-starter-test`

### Test Execution
```bash
# Run fulfillment tests only
cd backend && mvn test -Dtest=FulfillmentServiceTest

# Run VIP service tests
cd backend && mvn test -Dtest=VipServiceTest

# Run all phase 10 tests
cd backend && mvn test -Dtest="FulfillmentServiceTest,VipServiceTest"
```
