package com.onepage.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.math.BigDecimal;

public class OrderAmountValidator implements ConstraintValidator<ValidOrderAmount, BigDecimal> {

    private static final BigDecimal MAX_AMOUNT = new BigDecimal("99999");
    private static final BigDecimal MIN_AMOUNT = new BigDecimal("0.01");

    @Override
    public boolean isValid(BigDecimal value, ConstraintValidatorContext context) {
        if (value == null) {
            return false;
        }
        // Must be positive
        if (value.compareTo(MIN_AMOUNT) < 0) {
            return false;
        }
        // Must not exceed maximum
        if (value.compareTo(MAX_AMOUNT) > 0) {
            return false;
        }
        // No more than 2 decimal places
        if (value.scale() > 2) {
            return false;
        }
        return true;
    }
}
