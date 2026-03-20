package com.onepage.model;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("orders")
public class Order {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String orderNo;

    private Long userId;

    private Long templateId;

    private String templateName;

    private String paymentMethod;

    private String tradeNo;

    private String transactionId;

    private BigDecimal amount;

    private Integer status;

    private String paymentIdempotentKey;

    private LocalDateTime createTime;

    private LocalDateTime updateTime;

    private LocalDateTime payTime;

    private LocalDateTime expireTime;

    private String remark;

    public OrderStatus getOrderStatus() {
        return OrderStatus.fromCode(this.status);
    }

    public boolean canPay() {
        OrderStatus status = getOrderStatus();
        return status == OrderStatus.PENDING;
    }

    public boolean canRefund() {
        OrderStatus status = getOrderStatus();
        return status == OrderStatus.PAID;
    }

    public boolean isExpired() {
        return expireTime != null && LocalDateTime.now().isAfter(expireTime);
    }
}
