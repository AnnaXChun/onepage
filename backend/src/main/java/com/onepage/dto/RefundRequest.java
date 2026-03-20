package com.onepage.dto;

import lombok.Data;

@Data
public class RefundRequest {
    private String orderNo;
    private String reason;
}
