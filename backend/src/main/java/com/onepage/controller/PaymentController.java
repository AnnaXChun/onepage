package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.OrderDetailDTO;
import com.onepage.dto.Result;
import com.onepage.exception.BusinessException;
import com.onepage.model.Order;
import com.onepage.service.OrderService;
import com.onepage.service.WeChatPayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final OrderService orderService;
    private final WeChatPayService weChatPayService;

    @PostMapping("/create")
    public Result<OrderDetailDTO> createOrder(@Valid @RequestBody Map<String, Object> params) {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw BusinessException.unauthorized("Please login first");
        }

        Object templateIdObj = params.get("templateId");
        if (templateIdObj == null || templateIdObj.toString().isEmpty()) {
            throw BusinessException.badRequest("Template ID cannot be empty");
        }
        String templateId = templateIdObj.toString();

        Object amountObj = params.get("amount");
        if (amountObj == null || amountObj.toString().isEmpty()) {
            throw BusinessException.badRequest("Amount cannot be empty");
        }
        BigDecimal amount = new BigDecimal(amountObj.toString());

        String templateName = (String) params.getOrDefault("templateName", "VIP模板");
        String paymentMethod = (String) params.getOrDefault("paymentMethod", "wechat");

        Order order = orderService.createOrder(userId, templateId, templateName, paymentMethod, amount);
        OrderDetailDTO detail = orderService.getOrderDetail(order.getOrderNo());

        return Result.success(detail);
    }

    @PostMapping("/qrcode")
    public Result<Map<String, Object>> getPaymentQRCode(@RequestBody Map<String, String> params) {
        String orderNo = params.get("orderNo");
        String paymentMethod = params.getOrDefault("paymentMethod", "wechat");

        orderService.initiatePayment(orderNo, paymentMethod);

        Order order = orderService.getOrderByOrderNo(orderNo);
        if (order == null) {
            throw BusinessException.orderNotFound();
        }

        Map<String, Object> qrcodeResult;
        if ("wechat".equals(paymentMethod)) {
            qrcodeResult = weChatPayService.createPrepayOrder(
                    orderNo,
                    order.getAmount(),
                    order.getTemplateName()
            );
        } else {
            qrcodeResult = new HashMap<>();
            qrcodeResult.put("success", true);
            qrcodeResult.put("orderNo", orderNo);
            qrcodeResult.put("qrcodeUrl", "alipay://pay?order=" + orderNo);
        }

        if (Boolean.TRUE.equals(qrcodeResult.get("success"))) {
            Map<String, Object> result = new HashMap<>();
            result.put("orderNo", orderNo);
            result.put("qrcodeUrl", qrcodeResult.get("qrcodeUrl"));
            result.put("expireTime", order.getExpireTime());
            result.put("mock", qrcodeResult.getOrDefault("mock", false));
            return Result.success(result);
        } else {
            throw BusinessException.paymentFailed((String) qrcodeResult.getOrDefault("message", "Failed to get payment code"));
        }
    }

    @PostMapping("/callback")
    public Result<Map<String, String>> paymentCallback(@RequestBody Map<String, String> params) {
        log.info("收到支付回调: {}", params);

        String orderNo = params.get("out_trade_no");
        String transactionId = params.get("transaction_id");
        String tradeNo = params.get("trade_no");

        if (!weChatPayService.verifyCallback(params)) {
            log.warn("支付回调签名验证失败: {}", orderNo);
            throw BusinessException.badRequest("Signature verification failed");
        }

        orderService.confirmPayment(orderNo, transactionId, tradeNo);

        Map<String, String> result = new HashMap<>();
        result.put("message", "success");
        return Result.success(result);
    }

    @PostMapping("/notify")
    public String paymentNotify(@RequestBody Map<String, String> params) {
        try {
            log.info("收到支付通知: {}", params);
            String orderNo = params.get("out_trade_no");
            String transactionId = params.get("transaction_id");

            if (weChatPayService.verifyCallback(params)) {
                orderService.confirmPayment(orderNo, transactionId, "SUCCESS");
                return "success";
            }
            return "fail";
        } catch (Exception e) {
            log.error("支付通知处理失败: {}", e.getMessage());
            return "fail";
        }
    }

    @GetMapping("/status/{orderNo}")
    public Result<Map<String, Object>> queryPaymentStatus(@PathVariable String orderNo) {
        OrderDetailDTO detail = orderService.getOrderDetail(orderNo);
        if (detail == null) {
            throw BusinessException.orderNotFound();
        }

        if ("PAYING".equals(detail.getStatus())) {
            String tradeState = weChatPayService.queryOrderStatus(orderNo);

            if ("SUCCESS".equals(tradeState)) {
                orderService.confirmPayment(orderNo, "mock_tx_" + orderNo, tradeState);
                detail = orderService.getOrderDetail(orderNo);
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("status", detail.getStatus());
        result.put("statusText", detail.getStatusText());
        result.put("expireMinutes", detail.getExpireMinutes());

        return Result.success(result);
    }

    @PostMapping("/refund")
    public Result<OrderDetailDTO> applyRefund(@Valid @RequestBody Map<String, String> params) {
        Long userId = getCurrentUserId();
        String orderNo = params.get("orderNo");
        String reason = params.getOrDefault("reason", "用户申请退款");

        Order order = orderService.getOrderByOrderNo(orderNo);
        if (order == null) {
            throw BusinessException.orderNotFound();
        }

        if (userId != null && !order.getUserId().equals(userId)) {
            throw BusinessException.forbidden("No permission to operate this order");
        }

        orderService.applyRefund(orderNo, reason);
        OrderDetailDTO detail = orderService.getOrderDetail(orderNo);

        return Result.success(detail);
    }

    @PostMapping("/cancel")
    public Result<OrderDetailDTO> cancelOrder(@RequestBody Map<String, String> params) {
        Long userId = getCurrentUserId();
        String orderNo = params.get("orderNo");

        Order order = orderService.getOrderByOrderNo(orderNo);
        if (order == null) {
            throw BusinessException.orderNotFound();
        }

        if (userId != null && !order.getUserId().equals(userId)) {
            throw BusinessException.forbidden("No permission to operate this order");
        }

        orderService.cancelOrder(orderNo);
        OrderDetailDTO detail = orderService.getOrderDetail(orderNo);

        return Result.success(detail);
    }

    @GetMapping("/detail/{orderNo}")
    public Result<OrderDetailDTO> getOrderDetail(@PathVariable String orderNo) {
        OrderDetailDTO detail = orderService.getOrderDetail(orderNo);
        if (detail == null) {
            throw BusinessException.orderNotFound();
        }
        return Result.success(detail);
    }

    @GetMapping("/list")
    public Result<List<OrderDetailDTO>> listMyOrders() {
        Long userId = getCurrentUserId();
        if (userId == null) {
            throw BusinessException.unauthorized("Please login first");
        }
        List<Order> orders = orderService.getOrdersByUserId(userId);
        List<OrderDetailDTO> details = orders.stream()
                .map(order -> orderService.getOrderDetail(order.getOrderNo()))
                .toList();
        return Result.success(details);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtUserPrincipal principal) {
            return principal.getUserId();
        }
        return null;
    }
}
