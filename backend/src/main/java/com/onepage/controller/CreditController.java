package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.Result;
import com.onepage.service.UserCreditsService;
import com.onepage.service.WeChatPayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/credit")
@RequiredArgsConstructor
@Slf4j
public class CreditController {

    private final WeChatPayService weChatPayService;
    private final UserCreditsService userCreditsService;

    @Value("${credit.packages}")
    private String creditPackages; // JSON array of packages

    /**
     * Get available credit packages.
     */
    @GetMapping("/packages")
    public Result<String> getPackages() {
        return Result.success(creditPackages);
    }

    /**
     * Create a credit top-up order.
     * POST /api/v1/credit/topup
     * Body: { "credits": 10 }
     */
    @PostMapping("/topup")
    public Result<Map<String, Object>> createTopupOrder(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        Long userId = principal.getUserId();

        Integer credits = (Integer) request.get("credits");
        if (credits == null || credits <= 0) {
            return Result.error(400, "Invalid credits amount");
        }

        // Calculate price (1 credit = 1 RMB)
        BigDecimal amount = new BigDecimal(credits);

        // Generate order number
        String orderNo = "CRD" + System.currentTimeMillis() + userId;

        // Create WeChat Pay prepay order
        Map<String, Object> payResult = weChatPayService.createPrepayOrder(
                orderNo,
                amount,
                "Credit Top-up: " + credits + " credits"
        );

        Map<String, Object> result = new HashMap<>();
        result.put("orderNo", orderNo);
        result.put("credits", credits);
        result.put("amount", amount);
        result.put("qrcodeUrl", payResult.get("qrcodeUrl"));
        result.put("mock", payResult.get("mock"));

        log.info("Created credit top-up order: {} for user {} - {} credits",
                 orderNo, userId, credits);

        return Result.success(result);
    }

    /**
     * Get current credit balance.
     */
    @GetMapping("/balance")
    public Result<BigDecimal> getBalance(Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        BigDecimal balance = userCreditsService.getCredits(principal.getUserId());
        return Result.success(balance);
    }
}
