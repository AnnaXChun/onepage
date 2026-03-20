package com.onepage.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.dto.OrderDetailDTO;
import com.onepage.mapper.OrderMapper;
import com.onepage.model.Order;
import com.onepage.model.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService extends ServiceImpl<OrderMapper, Order> {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String PAYMENT_LOCK_PREFIX = "lock:order:";
    private static final String PAYMENT_IDEMPOTENT_PREFIX = "idempotent:payment:";
    private static final int ORDER_EXPIRE_MINUTES = 30;

    @Transactional
    public Order createOrder(Long userId, Long templateId, String templateName, String paymentMethod, BigDecimal amount) {
        // 检查是否有未支付的订单
        Order pendingOrder = baseMapper.findPendingOrder(userId, LocalDateTime.now());
        if (pendingOrder != null) {
            log.info("用户 {} 存在未支付订单: {}", userId, pendingOrder.getOrderNo());
            return pendingOrder;
        }

        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setTemplateId(templateId);
        order.setTemplateName(templateName);
        order.setPaymentMethod(paymentMethod);
        order.setAmount(amount);
        order.setStatus(OrderStatus.PENDING.getCode());
        order.setPaymentIdempotentKey(generateIdempotentKey());
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        order.setExpireTime(LocalDateTime.now().plusMinutes(ORDER_EXPIRE_MINUTES));

        this.save(order);
        log.info("创建订单成功: {}, 用户: {}, 金额: {}", order.getOrderNo(), userId, amount);

        return order;
    }

    public Order getOrderById(Long id) {
        return this.getById(id);
    }

    public Order getOrderByOrderNo(String orderNo) {
        return baseMapper.findByOrderNo(orderNo);
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return baseMapper.findByUserId(userId);
    }

    public OrderDetailDTO getOrderDetail(String orderNo) {
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            return null;
        }
        return convertToDetailDTO(order);
    }

    /**
     * 发起支付 - 使用Redis分布式锁防重
     */
    @Transactional
    public Order initiatePayment(String orderNo, String paymentMethod) {
        String lockKey = PAYMENT_LOCK_PREFIX + orderNo;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 30, TimeUnit.SECONDS);

        if (!Boolean.TRUE.equals(acquired)) {
            throw new RuntimeException("订单正在处理中，请稍后重试");
        }

        try {
            Order order = getOrderByOrderNo(orderNo);
            if (order == null) {
                throw new RuntimeException("订单不存在");
            }

            // 订单状态校验
            if (!order.canPay()) {
                OrderStatus status = order.getOrderStatus();
                throw new RuntimeException("订单当前状态不允许支付: " + status.getText());
            }

            // 检查是否过期
            if (order.isExpired()) {
                order.setStatus(OrderStatus.EXPIRED.getCode());
                order.setUpdateTime(LocalDateTime.now());
                this.updateById(order);
                throw new RuntimeException("订单已过期");
            }

            // 检查支付幂等键
            if (order.getPaymentIdempotentKey() != null) {
                String idempotentKey = PAYMENT_IDEMPOTENT_PREFIX + order.getPaymentIdempotentKey();
                redisTemplate.opsForValue().set(idempotentKey, orderNo, 24, TimeUnit.HOURS);
            }

            // 更新状态为支付中
            order.setStatus(OrderStatus.PAYING.getCode());
            order.setPaymentMethod(paymentMethod);
            order.setUpdateTime(LocalDateTime.now());
            this.updateById(order);

            log.info("发起支付成功: {}, 支付方式: {}", orderNo, paymentMethod);
            return order;

        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    /**
     * 确认支付成功 - 回调处理
     */
    @Transactional
    public Order confirmPayment(String orderNo, String transactionId, String tradeNo) {
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        // 幂等性检查
        if (order.getStatus().equals(OrderStatus.PAID.getCode())) {
            log.info("订单已支付，跳过: {}", orderNo);
            return order;
        }

        // 只有支付中状态才能确认
        if (!order.getStatus().equals(OrderStatus.PAYING.getCode())) {
            throw new RuntimeException("订单状态不正确，无法确认支付");
        }

        order.setStatus(OrderStatus.PAID.getCode());
        order.setTransactionId(transactionId);
        order.setTradeNo(tradeNo);
        order.setPayTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        // 清除幂等键
        if (order.getPaymentIdempotentKey() != null) {
            redisTemplate.delete(PAYMENT_IDEMPOTENT_PREFIX + order.getPaymentIdempotentKey());
        }

        log.info("支付确认成功: {}, 交易号: {}", orderNo, transactionId);
        return order;
    }

    /**
     * 支付失败
     */
    @Transactional
    public Order paymentFailed(String orderNo, String reason) {
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        order.setStatus(OrderStatus.FAILED.getCode());
        order.setRemark(reason);
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        log.info("支付失败: {}, 原因: {}", orderNo, reason);
        return order;
    }

    /**
     * 申请退款
     */
    @Transactional
    public Order applyRefund(String orderNo, String reason) {
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        if (!order.canRefund()) {
            throw new RuntimeException("订单当前状态不允许退款");
        }

        order.setStatus(OrderStatus.REFUNDING.getCode());
        order.setRemark(reason);
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        log.info("申请退款: {}, 原因: {}", orderNo, reason);
        return order;
    }

    /**
     * 确认退款
     */
    @Transactional
    public Order confirmRefund(String orderNo) {
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        order.setStatus(OrderStatus.REFUNDED.getCode());
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        log.info("退款完成: {}", orderNo);
        return order;
    }

    /**
     * 查询支付状态
     */
    public String queryPaymentStatus(String orderNo) {
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            return "ORDER_NOT_FOUND";
        }
        return order.getOrderStatus().getText();
    }

    /**
     * 取消订单
     */
    @Transactional
    public Order cancelOrder(String orderNo) {
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }

        if (!order.canPay()) {
            throw new RuntimeException("订单当前状态不允许取消");
        }

        order.setStatus(OrderStatus.CANCELLED.getCode());
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        log.info("订单取消: {}", orderNo);
        return order;
    }

    /**
     * 处理过期订单
     */
    @Transactional
    public int expireOrders() {
        List<Order> expiredOrders = baseMapper.findExpiredOrders(LocalDateTime.now());
        for (Order order : expiredOrders) {
            order.setStatus(OrderStatus.EXPIRED.getCode());
            order.setUpdateTime(LocalDateTime.now());
            this.updateById(order);
            log.info("订单过期: {}", order.getOrderNo());
        }
        return expiredOrders.size();
    }

    /**
     * 检查支付幂等性
     */
    public boolean checkPaymentIdempotent(String idempotentKey) {
        String key = PAYMENT_IDEMPOTENT_PREFIX + idempotentKey;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    private String generateOrderNo() {
        return "OP" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateIdempotentKey() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    private OrderDetailDTO convertToDetailDTO(Order order) {
        OrderDetailDTO dto = new OrderDetailDTO();
        dto.setId(order.getId());
        dto.setOrderNo(order.getOrderNo());
        dto.setUserId(order.getUserId());
        dto.setTemplateId(order.getTemplateId());
        dto.setTemplateName(order.getTemplateName());
        dto.setAmount(order.getAmount());
        dto.setStatus(order.getOrderStatus().name());
        dto.setStatusText(order.getOrderStatus().getText());
        dto.setPaymentMethod(order.getPaymentMethod());
        dto.setCreateTime(order.getCreateTime());
        dto.setPayTime(order.getPayTime());
        dto.setExpireTime(order.getExpireTime());
        dto.setTradeNo(order.getTradeNo());
        dto.setTransactionId(order.getTransactionId());

        if (order.getExpireTime() != null) {
            long minutes = ChronoUnit.MINUTES.between(LocalDateTime.now(), order.getExpireTime());
            dto.setExpireMinutes((int) Math.max(0, minutes));
        }

        return dto;
    }
}
