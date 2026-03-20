package com.onepage.model;

public enum OrderStatus {
    PENDING("待支付", 0),
    PAYING("支付中", 1),
    PAID("已支付", 2),
    REFUNDING("退款中", 3),
    REFUNDED("已退款", 4),
    FAILED("支付失败", 5),
    CANCELLED("已取消", 6),
    EXPIRED("已过期", 7);

    private final String text;
    private final Integer code;

    OrderStatus(String text, Integer code) {
        this.text = text;
        this.code = code;
    }

    public String getText() {
        return text;
    }

    public Integer getCode() {
        return code;
    }

    public static OrderStatus fromCode(Integer code) {
        for (OrderStatus status : values()) {
            if (status.code.equals(code)) {
                return status;
            }
        }
        return PENDING;
    }
}
