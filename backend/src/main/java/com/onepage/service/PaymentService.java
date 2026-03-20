package com.onepage.service;

import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.mapper.OrderMapper;
import com.onepage.model.Order;
import com.onepage.model.OrderStatus;
import com.onepage.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 支付服务 - 实现订单状态机与防重设计
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService extends ServiceImpl<OrderMapper, Order> {

    private final PaymentLockService paymentLockService;

    /**
     * 订单状态机转换映射
     * key: 当前状态 -> value: 允许转换到的目标状态
     */
    private static final Map<OrderStatus, OrderStatus[]> STATE_MACHINE = new ConcurrentHashMap<>();

    static {
        STATE_MACHINE.put(OrderStatus.PENDING, new OrderStatus[]{OrderStatus.PAYING, OrderStatus.CANCELLED, OrderStatus.EXPIRED});
        STATE_MACHINE.put(OrderStatus.PAYING, new OrderStatus[]{OrderStatus.PAID, OrderStatus.FAILED});
        STATE_MACHINE.put(OrderStatus.PAID, new OrderStatus[]{OrderStatus.REFUNDING});
        STATE_MACHINE.put(OrderStatus.REFUNDING, new OrderStatus[]{OrderStatus.REFUNDED, OrderStatus.PAID});
    }

    /**
     * 创建订单
     */
    @Transactional
    public Order createOrder(Long userId, String paymentMethod, BigDecimal amount, Long templateId, String templateName) {
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setPaymentMethod(paymentMethod);
        order.setAmount(amount);
        order.setTemplateId(templateId);
        order.setTemplateName(templateName);
        order.setStatus(OrderStatus.PENDING.getCode());
        // 生成支付幂等键
        order.setPaymentIdempotentKey(generateIdempotentKey());
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        // 设置订单过期时间（30分钟）
        order.setExpireTime(LocalDateTime.now().plusMinutes(30));

        this.save(order);
        log.info("创建订单: orderNo={}, userId={}, amount={}", order.getOrderNo(), userId, amount);
        return order;
    }

    /**
     * 发起支付 - 使用分布式锁防止重复支付
     * @param orderNo 订单号
     * @param idempotentKey 幂等键（可选）
     * @return 支付结果，包含预支付信息
     */
    @Transactional
    public PaymentResult initiatePayment(String orderNo, String idempotentKey) {
        // 1. 尝试获取分布式锁
        String lockValue = paymentLockService.tryLock(orderNo);
        if (lockValue == null) {
            // 检查是否已有处理中的支付
            Order existingOrder = getOrderByNo(orderNo);
            if (existingOrder != null && existingOrder.getOrderStatus() == OrderStatus.PAYING) {
                return PaymentResult.failure("支付处理中，请勿重复提交");
            }
            return PaymentResult.failure("系统繁忙，请稍后重试");
        }

        try {
            // 2. 查询订单
            Order order = getOrderByNo(orderNo);
            if (order == null) {
                return PaymentResult.failure("订单不存在");
            }

            // 3. 验证订单状态
            if (!canPay(order)) {
                return PaymentResult.failure("订单状态不允许支付，当前状态: " + order.getOrderStatus().getText());
            }

            // 4. 检查是否已过期
            if (order.isExpired()) {
                updateOrderStatus(orderNo, OrderStatus.EXPIRED);
                return PaymentResult.failure("订单已过期");
            }

            // 5. 幂等性检查 - 如果提供了幂等键，检查是否已处理
            if (idempotentKey != null && paymentLockService.checkIdempotentKey(idempotentKey)) {
                Object cachedResult = paymentLockService.getIdempotentResult(idempotentKey);
                if (cachedResult != null) {
                    return (PaymentResult) cachedResult;
                }
            }

            // 6. 状态转换: PENDING -> PAYING
            if (!transitionStatus(order, OrderStatus.PAYING)) {
                return PaymentResult.failure("订单状态转换失败");
            }

            // 7. 调用微信支付统一下单
            Map<String, String> payParams = buildWeChatPayParams(order);
            // TODO: 实际调用微信支付 SDK
            // WXPay wxpay = new WXPay(config);
            // Map<String, String> response = wxpay.unifiedOrder(payParams);

            // 模拟微信支付返回
            String prepayId = "prepay_" + System.currentTimeMillis();
            String payUrl = "weixin://wxpay/bizpayurl?pr=" + prepayId;

            // 8. 存储幂等结果
            if (idempotentKey != null) {
                PaymentResult result = PaymentResult.success(orderNo, prepayId, payUrl);
                paymentLockService.storeIdempotentKey(idempotentKey, result);
            }

            log.info("发起支付成功: orderNo={}, prepayId={}", orderNo, prepayId);
            return PaymentResult.success(orderNo, prepayId, payUrl);

        } catch (Exception e) {
            log.error("发起支付异常: orderNo={}", orderNo, e);
            // 状态转换回 PENDING
            Order order = getOrderByNo(orderNo);
            if (order != null && order.getOrderStatus() == OrderStatus.PAYING) {
                updateOrderStatus(orderNo, OrderStatus.PENDING);
            }
            return PaymentResult.failure("支付发起失败: " + e.getMessage());
        } finally {
            // 9. 释放锁
            paymentLockService.unlock(orderNo, lockValue);
        }
    }

    /**
     * 处理微信支付回调
     */
    @Transactional
    public boolean handlePaymentNotify(String orderNo, String transactionId, String tradeNo) {
        // 1. 获取分布式锁
        String lockValue = paymentLockService.tryLock(orderNo);
        if (lockValue == null) {
            log.warn("支付回调处理锁获取失败: orderNo={}", orderNo);
            return false;
        }

        try {
            Order order = getOrderByNo(orderNo);
            if (order == null) {
                log.error("支付回调订单不存在: orderNo={}", orderNo);
                return false;
            }

            // 2. 只有 PAYING 状态才能转为 PAID
            if (order.getOrderStatus() != OrderStatus.PAYING) {
                log.warn("支付回调订单状态不正确: orderNo={}, status={}", orderNo, order.getOrderStatus());
                return order.getOrderStatus() == OrderStatus.PAID; // 已支付则返回成功
            }

            // 3. 状态转换: PAYING -> PAID
            order.setTransactionId(transactionId);
            order.setTradeNo(tradeNo);
            order.setPayTime(LocalDateTime.now());
            order.setStatus(OrderStatus.PAID.getCode());
            order.setUpdateTime(LocalDateTime.now());

            this.updateById(order);
            log.info("支付成功: orderNo={}, transactionId={}", orderNo, transactionId);
            return true;

        } finally {
            paymentLockService.unlock(orderNo, lockValue);
        }
    }

    /**
     * 申请退款
     */
    @Transactional
    public RefundResult applyRefund(String orderNo, String reason) {
        // 1. 获取分布式锁
        String lockValue = paymentLockService.tryLock(orderNo);
        if (lockValue == null) {
            return RefundResult.failure("系统繁忙，请稍后重试");
        }

        try {
            Order order = getOrderByNo(orderNo);
            if (order == null) {
                return RefundResult.failure("订单不存在");
            }

            // 2. 验证是否可以退款
            if (!canRefund(order)) {
                return RefundResult.failure("订单状态不允许退款，当前状态: " + order.getOrderStatus().getText());
            }

            // 3. 状态转换: PAID -> REFUNDING
            if (!transitionStatus(order, OrderStatus.REFUNDING)) {
                return RefundResult.failure("订单状态转换失败");
            }

            order.setRemark(reason);
            order.setUpdateTime(LocalDateTime.now());
            this.updateById(order);

            // 4. 调用微信支付退款接口
            // TODO: 实际调用微信支付退款
            // WXPay wxpay = new WXPay(config);
            // Map<String, String> refundParams = buildRefundParams(order);

            // 模拟退款
            String refundId = "refund_" + System.currentTimeMillis();

            log.info("退款申请成功: orderNo={}, refundId={}", orderNo, refundId);
            return RefundResult.success(orderNo, refundId);

        } catch (Exception e) {
            log.error("退款申请异常: orderNo={}", orderNo, e);
            // 回滚状态
            Order order = getOrderByNo(orderNo);
            if (order != null && order.getOrderStatus() == OrderStatus.REFUNDING) {
                updateOrderStatus(orderNo, OrderStatus.PAID);
            }
            return RefundResult.failure("退款申请失败: " + e.getMessage());
        } finally {
            paymentLockService.unlock(orderNo, lockValue);
        }
    }

    /**
     * 处理微信退款回调
     */
    @Transactional
    public boolean handleRefundNotify(String orderNo, String refundId, int refundStatus) {
        String lockValue = paymentLockService.tryLock(orderNo);
        if (lockValue == null) {
            return false;
        }

        try {
            Order order = getOrderByNo(orderNo);
            if (order == null || order.getOrderStatus() != OrderStatus.REFUNDING) {
                return order != null && order.getOrderStatus() == OrderStatus.REFUNDED;
            }

            // 退款成功: REFUNDING -> REFUNDED
            if (refundStatus == 2) { // 微信退款成功状态
                order.setStatus(OrderStatus.REFUNDED.getCode());
                order.setUpdateTime(LocalDateTime.now());
                this.updateById(order);
                log.info("退款成功: orderNo={}, refundId={}", orderNo, refundId);
            } else {
                // 退款失败，回滚到 PAID
                order.setStatus(OrderStatus.PAID.getCode());
                order.setUpdateTime(LocalDateTime.now());
                this.updateById(order);
                log.warn("退款失败: orderNo={}, refundId={}, status={}", orderNo, refundId, refundStatus);
            }
            return true;

        } finally {
            paymentLockService.unlock(orderNo, lockValue);
        }
    }

    /**
     * 取消订单
     */
    @Transactional
    public boolean cancelOrder(String orderNo) {
        Order order = getOrderByNo(orderNo);
        if (order == null) {
            return false;
        }

        if (!canCancel(order)) {
            return false;
        }

        return transitionStatus(order, OrderStatus.CANCELLED);
    }

    /**
     * 检查订单是否可以支付
     */
    public boolean canPay(Order order) {
        if (order == null) return false;
        return order.getOrderStatus() == OrderStatus.PENDING && !order.isExpired();
    }

    /**
     * 检查订单是否可以退款
     */
    public boolean canRefund(Order order) {
        if (order == null) return false;
        return order.getOrderStatus() == OrderStatus.PAID;
    }

    /**
     * 检查订单是否可以取消
     */
    public boolean canCancel(Order order) {
        if (order == null) return false;
        return order.getOrderStatus() == OrderStatus.PENDING;
    }

    /**
     * 状态转换
     */
    private boolean transitionStatus(Order order, OrderStatus targetStatus) {
        OrderStatus currentStatus = order.getOrderStatus();
        OrderStatus[] allowedTargets = STATE_MACHINE.get(currentStatus);

        if (allowedTargets == null) {
            return false;
        }

        for (OrderStatus allowed : allowedTargets) {
            if (allowed == targetStatus) {
                order.setStatus(targetStatus.getCode());
                order.setUpdateTime(LocalDateTime.now());
                this.updateById(order);
                log.info("订单状态转换: orderNo={}, {} -> {}",
                        order.getOrderNo(), currentStatus.getText(), targetStatus.getText());
                return true;
            }
        }

        log.warn("订单状态不允许转换: orderNo={}, {} -> {}",
                order.getOrderNo(), currentStatus.getText(), targetStatus.getText());
        return false;
    }

    /**
     * 更新订单状态（直接设置）
     */
    public void updateOrderStatus(String orderNo, OrderStatus status) {
        Order order = getOrderByNo(orderNo);
        if (order != null) {
            order.setStatus(status.getCode());
            order.setUpdateTime(LocalDateTime.now());
            this.updateById(order);
        }
    }

    /**
     * 根据订单号查询订单
     */
    public Order getOrderByNo(String orderNo) {
        return this.lambdaQuery().eq(Order::getOrderNo, orderNo).one();
    }

    /**
     * 生成订单号
     */
    private String generateOrderNo() {
        return "OP" + System.currentTimeMillis() + IdUtil.fastSimpleUUID().substring(0, 8).toUpperCase();
    }

    /**
     * 生成支付幂等键
     */
    private String generateIdempotentKey() {
        return IdUtil.fastSimpleUUID();
    }

    /**
     * 构建微信支付统一下单参数
     */
    private Map<String, String> buildWeChatPayParams(Order order) {
        // TODO: 实现微信支付统一下单参数构建
        return Map.of(
                "body", order.getTemplateName() != null ? order.getTemplateName() : "OnePage模板购买",
                "out_trade_no", order.getOrderNo(),
                "total_fee", String.valueOf(order.getAmount().multiply(new BigDecimal("100")).intValue()),
                "spbill_create_ip", "127.0.0.1",
                "notify_url", "http://your-domain/api/payment/notify",
                "trade_type", "NATIVE"
        );
    }

    /**
     * 构建微信支付退款参数
     */
    private Map<String, String> buildRefundParams(Order order) {
        // TODO: 实现微信支付退款参数构建
        return Map.of(
                "out_trade_no", order.getOrderNo(),
                "out_refund_no", "R" + order.getOrderNo(),
                "total_fee", String.valueOf(order.getAmount().multiply(new BigDecimal("100")).intValue()),
                "refund_fee", String.valueOf(order.getAmount().multiply(new BigDecimal("100")).intValue())
        );
    }

    /**
     * 支付结果
     */
    @lombok.Data
    public static class PaymentResult {
        private boolean success;
        private String message;
        private String orderNo;
        private String prepayId;
        private String payUrl;

        public static PaymentResult success(String orderNo, String prepayId, String payUrl) {
            PaymentResult result = new PaymentResult();
            result.setSuccess(true);
            result.setMessage("支付发起成功");
            result.setOrderNo(orderNo);
            result.setPrepayId(prepayId);
            result.setPayUrl(payUrl);
            return result;
        }

        public static PaymentResult failure(String message) {
            PaymentResult result = new PaymentResult();
            result.setSuccess(false);
            result.setMessage(message);
            return result;
        }
    }

    /**
     * 退款结果
     */
    @lombok.Data
    public static class RefundResult {
        private boolean success;
        private String message;
        private String orderNo;
        private String refundId;

        public static RefundResult success(String orderNo, String refundId) {
            RefundResult result = new RefundResult();
            result.setSuccess(true);
            result.setMessage("退款申请成功");
            result.setOrderNo(orderNo);
            result.setRefundId(refundId);
            return result;
        }

        public static RefundResult failure(String message) {
            RefundResult result = new RefundResult();
            result.setSuccess(false);
            result.setMessage(message);
            return result;
        }
    }
}
