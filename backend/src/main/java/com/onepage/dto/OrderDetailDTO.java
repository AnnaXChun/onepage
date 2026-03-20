package com.onepage.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderDetailDTO {
    private Long id;
    private String orderNo;
    private Long userId;
    private Long templateId;
    private String templateName;
    private BigDecimal amount;
    private String status;
    private String statusText;
    private String paymentMethod;
    private LocalDateTime createTime;
    private LocalDateTime payTime;
    private LocalDateTime expireTime;
    private Integer expireMinutes;
    private String tradeNo;
    private String transactionId;
}
