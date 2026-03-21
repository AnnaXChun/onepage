package com.onepage.dto;

import com.onepage.validation.ValidOrderAmount;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateOrderRequest {

    @NotBlank(message = "Template ID cannot be empty")
    @Size(max = 100, message = "Template ID cannot exceed 100 characters")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Invalid template ID format")
    private String templateId;

    @Size(max = 200, message = "Template name cannot exceed 200 characters")
    private String templateName;

    @Pattern(regexp = "^[A-Za-z0-9_]+$", message = "Invalid payment method")
    private String paymentMethod;

    @NotNull(message = "Amount cannot be null")
    @ValidOrderAmount
    private BigDecimal amount;
}
