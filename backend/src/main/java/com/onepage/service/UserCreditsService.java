package com.onepage.service;

import com.onepage.exception.BusinessException;
import com.onepage.mapper.UserCreditsMapper;
import com.onepage.model.UserCredits;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCreditsService {

    private final UserCreditsMapper userCreditsMapper;

    private static final BigDecimal DEFAULT_CREDITS = new BigDecimal("0.00");

    /**
     * Get user credits balance.
     */
    public BigDecimal getCredits(Long userId) {
        UserCredits credits = userCreditsMapper.selectByUserId(userId);
        if (credits == null) {
            return DEFAULT_CREDITS;
        }
        return credits.getBalance() != null ? credits.getBalance() : DEFAULT_CREDITS;
    }

    /**
     * Add credits to user balance.
     * PAY-06: Credits purchase
     */
    @Transactional
    public void addCredits(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Invalid credit amount");
        }

        UserCredits credits = userCreditsMapper.selectByUserId(userId);
        if (credits == null) {
            // Create new credits record
            credits = new UserCredits();
            credits.setUserId(userId);
            credits.setBalance(amount);
            credits.setTotalSpent(BigDecimal.ZERO);
            userCreditsMapper.insert(credits);
        } else {
            // Update existing balance
            credits.setBalance(credits.getBalance().add(amount));
            userCreditsMapper.updateById(credits);
        }

        log.info("Added {} credits to user {}", amount, userId);
    }

    /**
     * Deduct credits from user balance.
     * PAY-03, PAY-05: Template purchase deducts credits
     */
    @Transactional
    public void deductCredits(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Invalid deduction amount");
        }

        BigDecimal currentBalance = getCredits(userId);
        if (currentBalance.compareTo(amount) < 0) {
            throw BusinessException.badRequest("Insufficient credits balance");
        }

        UserCredits credits = userCreditsMapper.selectByUserId(userId);
        if (credits != null) {
            credits.setBalance(credits.getBalance().subtract(amount));
            // Track total spent
            if (credits.getTotalSpent() != null) {
                credits.setTotalSpent(credits.getTotalSpent().add(amount));
            } else {
                credits.setTotalSpent(amount);
            }
            userCreditsMapper.updateById(credits);
        }

        log.info("Deducted {} credits from user {}", amount, userId);
    }

    /**
     * Check if user has enough credits.
     */
    public boolean hasEnoughCredits(Long userId, BigDecimal amount) {
        return getCredits(userId).compareTo(amount) >= 0;
    }
}
