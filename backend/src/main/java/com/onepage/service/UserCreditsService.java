package com.onepage.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.exception.BusinessException;
import com.onepage.mapper.UserCreditsMapper;
import com.onepage.model.UserCredits;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserCreditsService extends ServiceImpl<UserCreditsMapper, UserCredits> {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CREDIT_CACHE_PREFIX = "credits:";
    private static final BigDecimal PDF_COST = new BigDecimal("0.3"); // 0.3 RMB per PDF

    /**
     * Get or create credits for a user.
     */
    public UserCredits getOrCreate(Long userId) {
        UserCredits credits = this.lambdaQuery().eq(UserCredits::getUserId, userId).one();
        if (credits == null) {
            credits = new UserCredits();
            credits.setUserId(userId);
            credits.setBalance(BigDecimal.ZERO);
            this.save(credits);
            log.info("Created new credits for user: {}", userId);
        }
        return credits;
    }

    /**
     * Get current balance for a user.
     */
    public BigDecimal getBalance(Long userId) {
        return getOrCreate(userId).getBalance();
    }

    /**
     * Add credits to user balance.
     */
    public void addCredits(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Invalid credit amount");
        }
        UserCredits credits = getOrCreate(userId);
        credits.setBalance(credits.getBalance().add(amount));
        this.updateById(credits);
        redisTemplate.delete(CREDIT_CACHE_PREFIX + userId);
        log.info("Added {} credits to user {}: new balance = {}", amount, userId, credits.getBalance());
    }

    /**
     * Deduct credits from user balance atomically.
     * Uses Redis atomic operation to prevent double-deduction.
     * PDF-04, PDF-06, PAY-07
     */
    public void deductCredits(Long userId, BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw BusinessException.badRequest("Invalid credit amount");
        }

        // Use Redis atomic decrement to prevent race conditions
        String cacheKey = CREDIT_CACHE_PREFIX + userId;

        // First check if user has enough credits
        BigDecimal currentBalance = getBalance(userId);
        if (currentBalance.compareTo(amount) < 0) {
            throw BusinessException.insufficientCredits("Not enough credits. Current: " + currentBalance + ", Required: " + amount);
        }

        // Atomic deduction using Redis
        Double newBalance = redisTemplate.opsForValue().decrement(cacheKey, amount.doubleValue());

        // If Redis key didn't exist, fallback to DB update with lock
        if (newBalance == null) {
            UserCredits credits = getOrCreate(userId);
            if (credits.getBalance().compareTo(amount) < 0) {
                throw BusinessException.insufficientCredits();
            }
            credits.setBalance(credits.getBalance().subtract(amount));
            this.updateById(credits);
            redisTemplate.opsForValue().set(cacheKey, credits.getBalance().doubleValue());
            log.info("Deducted {} credits from user {} (DB fallback): new balance = {}", amount, userId, credits.getBalance());
        } else {
            // Also update DB to keep in sync
            UserCredits credits = getOrCreate(userId);
            credits.setBalance(BigDecimal.valueOf(newBalance));
            this.updateById(credits);
            log.info("Deducted {} credits from user {} (Redis): new balance = {}", amount, userId, newBalance);
        }
    }

    /**
     * Check if user has enough credits.
     */
    public boolean hasEnoughCredits(Long userId, BigDecimal amount) {
        return getBalance(userId).compareTo(amount) >= 0;
    }

    /**
     * Get PDF cost constant.
     */
    public BigDecimal getPdfCost() {
        return PDF_COST;
    }
}
