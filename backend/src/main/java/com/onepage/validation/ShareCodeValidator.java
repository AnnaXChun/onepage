package com.onepage.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class ShareCodeValidator implements ConstraintValidator<ValidShareCode, String> {

    // Alphanumeric, 4-32 chars
    private static final Pattern SHARE_CODE_PATTERN = Pattern.compile("^[A-Za-z0-9]{4,32}$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return false;
        }
        return SHARE_CODE_PATTERN.matcher(value).matches();
    }
}
