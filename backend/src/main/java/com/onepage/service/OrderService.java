package com.onepage.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.dto.OrderDetailDTO;
import com.onepage.exception.BusinessException;
import com.onepage.mapper.OrderMapper;
import com.onepage.mapper.TemplateMapper;
import com.onepage.model.Order;
import com.onepage.model.OrderStatus;
import com.onepage.model.Template;
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
    private final IdempotentService idempotentService;
    private final VipService vipService;
    private final TemplateMapper templateMapper;
    private final TemplatePurchaseService templatePurchaseService;

    private static final String PAYMENT_LOCK_PREFIX = "lock:order:";
    private static final String PAYMENT_IDEMPOTENT_PREFIX = "idempotent:payment:";
    private static final int ORDER_EXPIRE_MINUTES = 30;

    // BigDecimal monetary limits
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("99999");
    private static final BigDecimal MIN_AMOUNT = new BigDecimal("0.01");

    @Transactional
    public Order createOrder(Long userId, String templateId, String templateName, String paymentMethod, BigDecimal amount) {
        // 1. Validate userId
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }

        // 2. Validate templateId
        if (templateId == null || templateId.isBlank()) {
            throw BusinessException.badRequest("Template ID cannot be empty");
        }
        if (templateId.length() > 100) {
            throw BusinessException.badRequest("Template ID is too long");
        }
        if (!templateId.matches("^[A-Za-z0-9_-]+$")) {
            throw BusinessException.badRequest("Invalid template ID format");
        }

        // 3. Validate templateName
        if (templateName != null && templateName.length() > 200) {
            throw BusinessException.badRequest("Template name is too long");
        }

        // 4. Validate amount using BigDecimal
        validateAmount(amount);

        // 5. Validate paymentMethod
        if (paymentMethod == null || paymentMethod.isBlank()) {
            paymentMethod = "wechat"; // default
        }
        if (!paymentMethod.matches("^[A-Za-z0-9_]+$")) {
            throw BusinessException.badRequest("Invalid payment method");
        }

        // 6. Check for existing pending order
        Order pendingOrder = baseMapper.findPendingOrder(userId, LocalDateTime.now());
        if (pendingOrder != null) {
            log.info("User {} has existing unpaid order: {}", userId, pendingOrder.getOrderNo());
            return pendingOrder;
        }

        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setTemplateId(templateId);
        order.setTemplateName(templateName != null ? templateName : "VIP Template");
        order.setPaymentMethod(paymentMethod);
        order.setAmount(amount);
        order.setStatus(OrderStatus.PENDING.getCode());
        order.setPaymentIdempotentKey(generateIdempotentKey());
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        order.setExpireTime(LocalDateTime.now().plusMinutes(ORDER_EXPIRE_MINUTES));

        this.save(order);
        log.info("Order created: {}, user: {}, amount: {}", order.getOrderNo(), userId, amount);

        return order;
    }

    /**
     * Validate monetary amount with comprehensive checks.
     */
    private void validateAmount(BigDecimal amount) {
        if (amount == null) {
            throw BusinessException.badRequest("Order amount cannot be null");
        }
        // Must be positive
        if (amount.compareTo(MIN_AMOUNT) < 0) {
            throw BusinessException.badRequest("Order amount must be at least " + MIN_AMOUNT);
        }
        // Must not exceed maximum
        if (amount.compareTo(MAX_AMOUNT) > 0) {
            throw BusinessException.badRequest("Order amount exceeds maximum limit of " + MAX_AMOUNT);
        }
        // No more than 2 decimal places (no floating-point precision issues)
        if (amount.scale() > 2) {
            throw BusinessException.badRequest("Amount cannot have more than 2 decimal places");
        }
        // Must not be zero or negative
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Invalid order amount");
        }
    }

    public Order getOrderById(Long id) {
        if (id == null) {
            throw BusinessException.badRequest("Order ID cannot be null");
        }
        return this.getById(id);
    }

    public Order getOrderByOrderNo(String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw BusinessException.badRequest("Order number cannot be empty");
        }
        if (orderNo.length() > 100) {
            throw BusinessException.badRequest("Invalid order number");
        }
        return baseMapper.findByOrderNo(orderNo);
    }

    public List<Order> getOrdersByUserId(Long userId) {
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }
        return baseMapper.findByUserId(userId);
    }

    public OrderDetailDTO getOrderDetail(String orderNo) {
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            return null; // Caller handles null
        }
        return convertToDetailDTO(order);
    }

    /**
     * Initiate payment with Redis distributed lock for idempotency.
     */
    @Transactional
    public Order initiatePayment(String orderNo, String paymentMethod) {
        // 1. Validate inputs
        if (orderNo == null || orderNo.isBlank()) {
            throw BusinessException.badRequest("Order number cannot be empty");
        }
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw BusinessException.badRequest("Payment method cannot be empty");
        }

        // 2. Acquire distributed lock
        String lockKey = PAYMENT_LOCK_PREFIX + orderNo;
        Boolean acquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", 30, TimeUnit.SECONDS);

        if (!Boolean.TRUE.equals(acquired)) {
            throw BusinessException.badRequest("Order is being processed, please try again later");
        }

        try {
            Order order = getOrderByOrderNo(orderNo);
            if (order == null) {
                throw BusinessException.orderNotFound();
            }

            // Order status validation
            if (!order.canPay()) {
                OrderStatus status = order.getOrderStatus();
                throw BusinessException.badRequest("Order cannot be paid in current status: " + status.getText());
            }

            // Check expiration
            if (order.isExpired()) {
                order.setStatus(OrderStatus.EXPIRED.getCode());
                order.setUpdateTime(LocalDateTime.now());
                this.updateById(order);
                throw BusinessException.orderExpired();
            }

            // Store idempotent key in Redis
            if (order.getPaymentIdempotentKey() != null) {
                String idempotentKey = PAYMENT_IDEMPOTENT_PREFIX + order.getPaymentIdempotentKey();
                redisTemplate.opsForValue().set(idempotentKey, orderNo, 24, TimeUnit.HOURS);
            }

            // Update status to PAYING
            order.setStatus(OrderStatus.PAYING.getCode());
            order.setPaymentMethod(paymentMethod);
            order.setUpdateTime(LocalDateTime.now());
            this.updateById(order);

            log.info("Payment initiated: {}, method: {}", orderNo, paymentMethod);
            return order;

        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    /**
     * Confirm payment success - callback processing with idempotency.
     */
    @Transactional
    public Order confirmPayment(String orderNo, String transactionId, String tradeNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw BusinessException.badRequest("Order number cannot be empty");
        }

        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw BusinessException.orderNotFound();
        }

        // Idempotency check - if already paid, return existing order
        if (order.getStatus().equals(OrderStatus.PAID.getCode())) {
            log.info("Order already paid, skipping: {}", orderNo);
            return order;
        }

        // Only PAYING status can be confirmed
        if (!order.getStatus().equals(OrderStatus.PAYING.getCode())) {
            throw BusinessException.badRequest("Order status is incorrect, cannot confirm payment");
        }

        // Validate transaction IDs
        if (transactionId != null && transactionId.length() > 200) {
            throw BusinessException.badRequest("Invalid transaction ID");
        }
        if (tradeNo != null && tradeNo.length() > 200) {
            throw BusinessException.badRequest("Invalid trade number");
        }

        order.setStatus(OrderStatus.PAID.getCode());
        order.setTransactionId(transactionId);
        order.setTradeNo(tradeNo);
        order.setPayTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        // Clear idempotent key
        if (order.getPaymentIdempotentKey() != null) {
            redisTemplate.delete(PAYMENT_IDEMPOTENT_PREFIX + order.getPaymentIdempotentKey());
        }

        log.info("Payment confirmed: {}, transactionId: {}", orderNo, transactionId);
        return order;
    }

    /**
     * Payment failure handling.
     */
    @Transactional
    public Order paymentFailed(String orderNo, String reason) {
        if (orderNo == null || orderNo.isBlank()) {
            throw BusinessException.badRequest("Order number cannot be empty");
        }
        if (reason != null && reason.length() > 500) {
            reason = reason.substring(0, 500); // Truncate long reasons
        }

        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw BusinessException.orderNotFound();
        }

        order.setStatus(OrderStatus.FAILED.getCode());
        order.setRemark(reason);
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        log.info("Payment failed: {}, reason: {}", orderNo, reason);
        return order;
    }

    /**
     * Apply for refund.
     */
    @Transactional
    public Order applyRefund(String orderNo, String reason) {
        if (orderNo == null || orderNo.isBlank()) {
            throw BusinessException.badRequest("Order number cannot be empty");
        }
        if (reason != null && reason.length() > 500) {
            reason = reason.substring(0, 500);
        }

        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw BusinessException.orderNotFound();
        }

        if (!order.canRefund()) {
            throw BusinessException.badRequest("Order cannot be refunded in current status");
        }

        order.setStatus(OrderStatus.REFUNDING.getCode());
        order.setRemark(reason);
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        log.info("Refund applied: {}, reason: {}", orderNo, reason);
        return order;
    }

    /**
     * Confirm refund.
     */
    @Transactional
    public Order confirmRefund(String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw BusinessException.badRequest("Order number cannot be empty");
        }

        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw BusinessException.orderNotFound();
        }

        order.setStatus(OrderStatus.REFUNDED.getCode());
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        log.info("Refund confirmed: {}", orderNo);
        return order;
    }

    /**
     * Query payment status.
     */
    public String queryPaymentStatus(String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            return "INVALID_ORDER";
        }
        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            return "ORDER_NOT_FOUND";
        }
        return order.getOrderStatus().getText();
    }

    /**
     * Cancel order.
     */
    @Transactional
    public Order cancelOrder(String orderNo) {
        if (orderNo == null || orderNo.isBlank()) {
            throw BusinessException.badRequest("Order number cannot be empty");
        }

        Order order = getOrderByOrderNo(orderNo);
        if (order == null) {
            throw BusinessException.orderNotFound();
        }

        if (!order.canPay()) {
            throw BusinessException.badRequest("Order cannot be cancelled in current status");
        }

        order.setStatus(OrderStatus.CANCELLED.getCode());
        order.setUpdateTime(LocalDateTime.now());
        this.updateById(order);

        log.info("Order cancelled: {}", orderNo);
        return order;
    }

    /**
     * Process expired orders.
     */
    @Transactional
    public int expireOrders() {
        List<Order> expiredOrders = baseMapper.findExpiredOrders(LocalDateTime.now());
        for (Order order : expiredOrders) {
            order.setStatus(OrderStatus.EXPIRED.getCode());
            order.setUpdateTime(LocalDateTime.now());
            this.updateById(order);
            log.info("Order expired: {}", order.getOrderNo());
        }
        return expiredOrders.size();
    }

    /**
     * Check payment idempotency.
     */
    public boolean checkPaymentIdempotent(String idempotentKey) {
        if (idempotentKey == null || idempotentKey.isBlank()) {
            return false;
        }
        String key = PAYMENT_IDEMPOTENT_PREFIX + idempotentKey;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Create a VIP subscription order.
     * PAY-01
     */
    public Order createVipOrder(Long userId, int months) {
        BigDecimal amount = vipService.getVipMonthlyPrice().multiply(new BigDecimal(months));

        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setTemplateId(null);
        order.setTemplateName("VIP Subscription - " + months + " month(s)");
        order.setAmount(amount);
        order.setStatus(OrderStatus.PENDING.getCode());
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        order.setExpireTime(LocalDateTime.now().plusMinutes(ORDER_EXPIRE_MINUTES));

        this.save(order);
        log.info("Created VIP order: orderNo={}, userId={}, amount={}", order.getOrderNo(), userId, amount);
        return order;
    }

    /**
     * Create a template purchase order.
     * PAY-03
     */
    public Order createTemplatePurchaseOrder(Long userId, String templateId) {
        Template template = templateMapper.selectById(templateId);
        if (template == null) {
            throw BusinessException.badRequest("Template not found");
        }
        BigDecimal amount = template.getPrice();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Template is free");
        }

        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setTemplateId(templateId);
        order.setTemplateName("Template Purchase: " + template.getName());
        order.setAmount(amount);
        order.setStatus(OrderStatus.PENDING.getCode());
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        order.setExpireTime(LocalDateTime.now().plusMinutes(ORDER_EXPIRE_MINUTES));

        this.save(order);
        log.info("Created template purchase order: orderNo={}, userId={}, templateId={}, amount={}",
            order.getOrderNo(), userId, templateId, amount);
        return order;
    }

    /**
     * Create a credits purchase order.
     * PAY-06
     */
    public Order createCreditsOrder(Long userId, BigDecimal creditsAmount, BigDecimal price) {
        Order order = new Order();
        order.setOrderNo(generateOrderNo());
        order.setUserId(userId);
        order.setTemplateId(null);
        order.setTemplateName("Credits: " + creditsAmount);
        order.setAmount(price);
        order.setStatus(OrderStatus.PENDING.getCode());
        order.setCreateTime(LocalDateTime.now());
        order.setUpdateTime(LocalDateTime.now());
        order.setExpireTime(LocalDateTime.now().plusMinutes(ORDER_EXPIRE_MINUTES));

        this.save(order);
        log.info("Created credits order: orderNo={}, userId={}, credits={}, price={}",
            order.getOrderNo(), userId, creditsAmount, price);
        return order;
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
