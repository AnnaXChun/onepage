package com.onepage.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = ShareCodeValidator.class)
@Documented
public @interface ValidShareCode {
    String message() default "Invalid share code format";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
