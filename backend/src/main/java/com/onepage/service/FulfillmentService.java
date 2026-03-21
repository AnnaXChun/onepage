package com.onepage.service;

import com.onepage.model.Order;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class FulfillmentService {

    private final VipService vipService;
    private final UserCreditsService userCreditsService;
    private final TemplatePurchaseService templatePurchaseService;

    /**
     * Dispatch fulfillment based on order type.
     * Called by OrderService.confirmPayment() after status is set to PAID.
     *
     * Order type detection:
     * - templateName.startsWith("VIP Subscription") -> VIP activation
     * - templateName.startsWith("Credits:") -> Credits top-up
     * - templateId != null -> Template purchase via WeChat Pay
     *
     * PAY-01, PAY-02, PAY-03
     */
    public void dispatchFulfillment(Order order) {
        String templateName = order.getTemplateName();
        String templateId = order.getTemplateId();

        if (templateName != null && templateName.startsWith("VIP Subscription")) {
            // VIP order - activate VIP subscription
            vipService.activateVip(order.getUserId());
            log.info("VIP activated for user {} via order {}", order.getUserId(), order.getOrderNo());

        } else if (templateName != null && templateName.startsWith("Credits:")) {
            // Credits top-up - add credits to user balance
            BigDecimal credits = extractCreditsFromTemplateName(templateName);
            userCreditsService.addCredits(order.getUserId(), credits);
            log.info("Credits {} added for user {} via order {}", credits, order.getUserId(), order.getOrderNo());

        } else if (templateId != null) {
            // Template purchase via direct WeChat Pay (not credits)
            // Use recordPurchase - does NOT deduct credits since payment already made
            templatePurchaseService.recordPurchase(order.getUserId(), templateId, order.getOrderNo());
            log.info("Template {} purchased for user {} via order {}", templateId, order.getUserId(), order.getOrderNo());

        } else {
            log.warn("Unknown order type for fulfillment: orderNo={}, templateId={}, templateName={}",
                order.getOrderNo(), templateId, templateName);
        }
    }

    /**
     * Extract credits amount from templateName like "Credits: 10".
     * Credits amount equals the numeric value in templateName.
     * The order amount (price paid) may differ from credits amount if there's a discount.
     */
    private BigDecimal extractCreditsFromTemplateName(String templateName) {
        try {
            // Format: "Credits: 10" or "Credits: 100"
            String amountStr = templateName.replace("Credits:", "").trim();
            return new BigDecimal(amountStr);
        } catch (NumberFormatException e) {
            log.error("Failed to parse credits from templateName: {}", templateName);
            // Fallback: use amount as credits (1 credit = 1 RMB)
            return BigDecimal.ZERO;
        }
    }
}
