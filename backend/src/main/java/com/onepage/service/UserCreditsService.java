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
    private final CreditLockService creditLockService;

    private static final BigDecimal DEFAULT_CREDITS = new BigDecimal("0.00");
    private static final BigDecimal PDF_COST = new BigDecimal("0.30");

    /**
     * Get the cost for PDF export.
     */
    public BigDecimal getPdfCost() {
        return PDF_COST;
    }

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
     * Uses Redis distributed lock to prevent race conditions.
     */
    @Transactional
    public void deductCredits(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Invalid deduction amount");
        }

        // Acquire distributed lock for atomic credit operation
        String lockValue = creditLockService.tryLock(userId);
        if (lockValue == null) {
            throw BusinessException.badRequest("Credit operation in progress, please retry");
        }

        try {
            // Double-check balance inside lock (defensive)
            BigDecimal currentBalance = getCredits(userId);
            if (currentBalance.compareTo(amount) < 0) {
                throw BusinessException.badRequest("Insufficient credits balance");
            }

            UserCredits credits = userCreditsMapper.selectByUserId(userId);
            if (credits == null) {
                throw BusinessException.badRequest("User credits record not found");
            }

            credits.setBalance(credits.getBalance().subtract(amount));
            // Track total spent
            if (credits.getTotalSpent() != null) {
                credits.setTotalSpent(credits.getTotalSpent().add(amount));
            } else {
                credits.setTotalSpent(amount);
            }
            userCreditsMapper.updateById(credits);

            log.info("Atomically deducted {} credits from user {}", amount, userId);
        } finally {
            // ALWAYS release lock in finally block
            creditLockService.unlock(userId, lockValue);
        }
    }

    /**
     * Check if user has enough credits.
     */
    public boolean hasEnoughCredits(Long userId, BigDecimal amount) {
        return getCredits(userId).compareTo(amount) >= 0;
    }
}
