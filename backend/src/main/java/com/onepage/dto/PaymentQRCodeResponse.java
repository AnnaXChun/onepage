package com.onepage.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PaymentQRCodeResponse {
    private String orderNo;
    private String qrcodeUrl;
    private String paymentUrl;
    private LocalDateTime expireTime;
}
