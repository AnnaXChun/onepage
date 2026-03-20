package com.onepage.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateOrderRequest {
    private Long templateId;
    private String paymentMethod;
    private BigDecimal amount;
}
