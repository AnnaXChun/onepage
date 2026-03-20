package com.onepage.controller;

import com.onepage.dto.OrderDetailDTO;
import com.onepage.dto.Result;
import com.onepage.model.Order;
import com.onepage.service.OrderService;
import com.onepage.service.WeChatPayService;
import com.onepage.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final JwtUtil jwtUtil;

    /**
     * 创建支付订单
     */
    @PostMapping("/create")
    public Result<OrderDetailDTO> createOrder(
            @RequestBody Map<String, Object> params,
            HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            Long templateId = Long.parseLong(params.get("templateId").toString());
            String templateName = (String) params.getOrDefault("templateName", "VIP模板");
            String paymentMethod = (String) params.getOrDefault("paymentMethod", "wechat");
            BigDecimal amount = new BigDecimal(params.get("amount").toString());

            Order order = orderService.createOrder(userId, templateId, templateName, paymentMethod, amount);
            OrderDetailDTO detail = orderService.getOrderDetail(order.getOrderNo());

            return Result.success(detail);
        } catch (Exception e) {
            log.error("创建订单失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取支付二维码
     */
    @PostMapping("/qrcode")
    public Result<Map<String, Object>> getPaymentQRCode(
            @RequestBody Map<String, String> params,
            HttpServletRequest request) {
        try {
            String orderNo = params.get("orderNo");
            String paymentMethod = params.getOrDefault("paymentMethod", "wechat");

            // 发起支付
            orderService.initiatePayment(orderNo, paymentMethod);

            // 获取订单信息
            Order order = orderService.getOrderByOrderNo(orderNo);
            if (order == null) {
                return Result.error("订单不存在");
            }

            Map<String, Object> qrcodeResult;
            if ("wechat".equals(paymentMethod)) {
                qrcodeResult = weChatPayService.createPrepayOrder(
                    orderNo,
                    order.getAmount(),
                    order.getTemplateName()
                );
            } else {
                // 模拟其他支付方式
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
                return Result.error((String) qrcodeResult.getOrDefault("message", "获取支付码失败"));
            }
        } catch (Exception e) {
            log.error("获取支付二维码失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 支付回调
     */
    @PostMapping("/callback")
    public Result<Map<String, String>> paymentCallback(@RequestBody Map<String, String> params) {
        try {
            log.info("收到支付回调: {}", params);

            String orderNo = params.get("out_trade_no");
            String transactionId = params.get("transaction_id");
            String tradeNo = params.get("trade_no");

            // 验证回调签名（微信）
            if (!weChatPayService.verifyCallback(params)) {
                log.warn("支付回调签名验证失败: {}", orderNo);
                return Result.error("签名验证失败");
            }

            // 确认支付
            orderService.confirmPayment(orderNo, transactionId, tradeNo);

            Map<String, String> result = new HashMap<>();
            result.put("message", "success");
            return Result.success(result);
        } catch (Exception e) {
            log.error("支付回调处理失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 查询支付状态
     */
    @GetMapping("/status/{orderNo}")
    public Result<Map<String, Object>> queryPaymentStatus(@PathVariable String orderNo) {
        try {
            OrderDetailDTO detail = orderService.getOrderDetail(orderNo);
            if (detail == null) {
                return Result.error("订单不存在");
            }

            // 如果是支付中，查询实际支付状态
            if ("PAYING".equals(detail.getStatus())) {
                Order order = orderService.getOrderByOrderNo(orderNo);
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
        } catch (Exception e) {
            log.error("查询支付状态失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 申请退款
     */
    @PostMapping("/refund")
    public Result<OrderDetailDTO> applyRefund(
            @RequestBody Map<String, String> params,
            HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            String orderNo = params.get("orderNo");
            String reason = params.getOrDefault("reason", "用户申请退款");

            Order order = orderService.getOrderByOrderNo(orderNo);
            if (order == null) {
                return Result.error("订单不存在");
            }

            if (!order.getUserId().equals(userId)) {
                return Result.error("无权限操作");
            }

            orderService.applyRefund(orderNo, reason);
            OrderDetailDTO detail = orderService.getOrderDetail(orderNo);

            return Result.success(detail);
        } catch (Exception e) {
            log.error("申请退款失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 取消订单
     */
    @PostMapping("/cancel")
    public Result<OrderDetailDTO> cancelOrder(
            @RequestBody Map<String, String> params,
            HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            String orderNo = params.get("orderNo");

            Order order = orderService.getOrderByOrderNo(orderNo);
            if (order == null) {
                return Result.error("订单不存在");
            }

            if (!order.getUserId().equals(userId)) {
                return Result.error("无权限操作");
            }

            orderService.cancelOrder(orderNo);
            OrderDetailDTO detail = orderService.getOrderDetail(orderNo);

            return Result.success(detail);
        } catch (Exception e) {
            log.error("取消订单失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取订单详情
     */
    @GetMapping("/detail/{orderNo}")
    public Result<OrderDetailDTO> getOrderDetail(@PathVariable String orderNo) {
        try {
            OrderDetailDTO detail = orderService.getOrderDetail(orderNo);
            if (detail == null) {
                return Result.error("订单不存在");
            }
            return Result.success(detail);
        } catch (Exception e) {
            log.error("获取订单详情失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    /**
     * 获取用户订单列表
     */
    @GetMapping("/list")
    public Result<List<OrderDetailDTO>> listMyOrders(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            List<Order> orders = orderService.getOrdersByUserId(userId);
            List<OrderDetailDTO> details = orders.stream()
                    .map(order -> orderService.getOrderDetail(order.getOrderNo()))
                    .toList();
            return Result.success(details);
        } catch (Exception e) {
            log.error("获取订单列表失败: {}", e.getMessage());
            return Result.error(e.getMessage());
        }
    }

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtUtil.getUserIdFromToken(token);
    }
}
