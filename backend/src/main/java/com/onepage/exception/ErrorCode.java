package com.onepage.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ErrorCode {
    // Auth errors (1xxx)
    UNAUTHORIZED(1001, "Not logged in"),
    INVALID_CREDENTIALS(1002, "Invalid username or password"),
    TOKEN_EXPIRED(1003, "Token expired"),
    TOKEN_INVALID(1004, "Invalid token"),

    // User errors (2xxx)
    USER_NOT_FOUND(2001, "User not found"),
    EMAIL_ALREADY_EXISTS(2002, "Email already registered"),
    EMAIL_NOT_VERIFIED(2003, "Please verify your email first"),
    USERNAME_ALREADY_EXISTS(2004, "Username already taken"),

    // Blog errors (3xxx)
    BLOG_NOT_FOUND(3001, "Blog not found"),

    // Payment errors (5xxx)
    ORDER_NOT_FOUND(5001, "Order not found"),
    PAYMENT_FAILED(5002, "Payment failed"),
    ORDER_EXPIRED(5003, "Order expired"),
    INSUFFICIENT_CREDITS(5004, "Insufficient credits"),

    // System errors (9xxx)
    SYSTEM_ERROR(9999, "System error"),
    INVALID_PARAMETER(9001, "Invalid parameter");

    private final int code;
    private final String message;
}
