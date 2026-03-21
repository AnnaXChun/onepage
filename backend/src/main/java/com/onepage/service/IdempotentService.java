package com.onepage.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * Idempotent operation service using Redis.
 * Prevents duplicate operations (e.g., duplicate payments, duplicate blog creations).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotentService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final long DEFAULT_EXPIRE_SECONDS = 3600; // 1 hour

    /**
     * Try to acquire an idempotent lock for the given key.
     * Returns true if the key was newly set (first attempt), false if it already exists (duplicate).
     *
     * @param key           the idempotent key (e.g., "idempotent:payment:order123")
     * @param expireSeconds TTL for the key
     * @return true if acquired (first attempt), false if already exists (duplicate)
     */
    public boolean tryAcquire(String key, long expireSeconds) {
        Boolean success = redisTemplate.opsForValue()
                .setIfAbsent(key, "1", expireSeconds, TimeUnit.SECONDS);
        return Boolean.TRUE.equals(success);
    }

    /**
     * Try to acquire an idempotent lock with default TTL.
     *
     * @param key the idempotent key
     * @return true if acquired (first attempt), false if already exists
     */
    public boolean tryAcquire(String key) {
        return tryAcquire(key, DEFAULT_EXPIRE_SECONDS);
    }

    /**
     * Check if an idempotent key already exists.
     *
     * @param key the idempotent key
     * @return true if the key exists (operation was already performed)
     */
    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Release an idempotent key (rarely used, mainly for testing or rollback scenarios).
     *
     * @param key the idempotent key
     */
    public void release(String key) {
        redisTemplate.delete(key);
    }

    /**
     * Execute an operation with idempotency protection.
     *
     * @param key            idempotent key
     * @param expireSeconds TTL
     * @param operation      the operation to execute
     * @param <T>            return type
     * @return result of the operation, or null if duplicate
     */
    public <T> T executeWithIdempotency(String key, long expireSeconds, java.util.function.Supplier<T> operation) {
        if (!tryAcquire(key, expireSeconds)) {
            log.warn("Duplicate operation detected for key: {}", key);
            return null;
        }
        try {
            return operation.get();
        } catch (Exception e) {
            release(key);
            throw e;
        }
    }
}
