package com.onepage.service;

import com.onepage.model.Order;
import com.onepage.model.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FulfillmentServiceTest {

    @Mock
    private VipService vipService;

    @Mock
    private UserCreditsService userCreditsService;

    @Mock
    private TemplatePurchaseService templatePurchaseService;

    @InjectMocks
    private FulfillmentService fulfillmentService;

    private Order createOrder(Long userId, String orderNo, String templateName, String templateId) {
        Order order = new Order();
        order.setUserId(userId);
        order.setOrderNo(orderNo);
        order.setTemplateName(templateName);
        order.setTemplateId(templateId);
        order.setStatus(OrderStatus.PAID.getCode());
        return order;
    }

    @Test
    void testVipFulfillment() {
        // Given: VIP subscription order
        Order order = createOrder(1L, "ORDER001", "VIP Subscription - 1 month(s)", null);

        // When
        fulfillmentService.dispatchFulfillment(order);

        // Then
        verify(vipService, times(1)).activateVip(1L);
        verify(userCreditsService, never()).addCredits(any(), any());
        verify(templatePurchaseService, never()).recordPurchase(any(), any(), any());
    }

    @Test
    void testCreditTopupFulfillment() {
        // Given: Credits top-up order
        Order order = createOrder(1L, "ORDER002", "Credits: 100", null);

        // When
        fulfillmentService.dispatchFulfillment(order);

        // Then
        verify(userCreditsService, times(1)).addCredits(eq(1L), eq(new BigDecimal("100")));
        verify(vipService, never()).activateVip(any());
        verify(templatePurchaseService, never()).recordPurchase(any(), any(), any());
    }

    @Test
    void testTemplatePurchaseFulfillment() {
        // Given: Template purchase order
        Order order = createOrder(1L, "ORDER003", "Template Purchase: Blog", "1");

        // When
        fulfillmentService.dispatchFulfillment(order);

        // Then
        verify(templatePurchaseService, times(1)).recordPurchase(1L, "1", "ORDER003");
        verify(vipService, never()).activateVip(any());
        verify(userCreditsService, never()).addCredits(any(), any());
    }

    @Test
    void testUnknownOrderTypeSkipsFulfillment() {
        // Given: Unknown order type (no templateName, no templateId)
        Order order = createOrder(1L, "ORDER004", null, null);
        order.setStatus(OrderStatus.PAID.getCode());

        // When
        fulfillmentService.dispatchFulfillment(order);

        // Then: No fulfillment methods called
        verify(vipService, never()).activateVip(any());
        verify(userCreditsService, never()).addCredits(any(), any());
        verify(templatePurchaseService, never()).recordPurchase(any(), any(), any());
    }
}
