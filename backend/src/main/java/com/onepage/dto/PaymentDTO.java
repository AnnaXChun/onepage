package com.onepage.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class CreateOrderRequest {
    private Long templateId;
    private String paymentMethod;
    private BigDecimal amount;
}

@Data
class PaymentQRCodeResponse {
    private String orderNo;
    private String qrcodeUrl;
    private String paymentUrl;
    private LocalDateTime expireTime;
}

@Data
class RefundRequest {
    private String orderNo;
    private String reason;
}
