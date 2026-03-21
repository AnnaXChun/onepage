package com.onepage.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = OrderAmountValidator.class)
@Documented
public @interface ValidOrderAmount {
    String message() default "Invalid order amount";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
