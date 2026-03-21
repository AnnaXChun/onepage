package com.onepage.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.code = errorCode.getCode();
    }

    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.code = errorCode.getCode();
    }

    // Factory methods for common error types
    public static BusinessException unauthorized(String message) {
        return new BusinessException(ErrorCode.UNAUTHORIZED.getCode(), message);
    }

    public static BusinessException forbidden(String message) {
        return new BusinessException(403, message);
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(404, message);
    }

    public static BusinessException notFound(ErrorCode errorCode) {
        return new BusinessException(errorCode);
    }

    public static BusinessException badRequest(String message) {
        return new BusinessException(400, message);
    }

    public static BusinessException badRequest(ErrorCode errorCode) {
        return new BusinessException(errorCode);
    }

    public static BusinessException internal(String message) {
        return new BusinessException(ErrorCode.SYSTEM_ERROR.getCode(), message);
    }

    public static BusinessException invalidCredentials() {
        return new BusinessException(ErrorCode.INVALID_CREDENTIALS);
    }

    public static BusinessException tokenExpired() {
        return new BusinessException(ErrorCode.TOKEN_EXPIRED);
    }

    public static BusinessException tokenInvalid() {
        return new BusinessException(ErrorCode.TOKEN_INVALID);
    }

    public static BusinessException userNotFound() {
        return new BusinessException(ErrorCode.USER_NOT_FOUND);
    }

    public static BusinessException blogNotFound() {
        return new BusinessException(ErrorCode.BLOG_NOT_FOUND);
    }

    public static BusinessException orderNotFound() {
        return new BusinessException(ErrorCode.ORDER_NOT_FOUND);
    }

    public static BusinessException paymentFailed(String message) {
        return new BusinessException(ErrorCode.PAYMENT_FAILED.getCode(), message);
    }

    public static BusinessException orderExpired() {
        return new BusinessException(ErrorCode.ORDER_EXPIRED);
    }
}
