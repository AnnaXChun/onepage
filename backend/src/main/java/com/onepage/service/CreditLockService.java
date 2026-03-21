package com.onepage.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * 分布式锁服务 - 用于信用操作防重
 * 确保并发信用扣减操作的原子性，防止race condition
 */
@Service
@RequiredArgsConstructor
public class CreditLockService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String CREDIT_LOCK_PREFIX = "credit:lock:";
    private static final Duration LOCK_EXPIRE = Duration.ofMinutes(5);

    /**
     * 尝试获取信用操作锁
     * @param userId 用户ID
     * @return 锁标识，如果返回null表示获取失败（锁被其他进程持有）
     */
    public String tryLock(Long userId) {
        String lockKey = CREDIT_LOCK_PREFIX + userId;
        String lockValue = UUID.randomUUID().toString();

        Boolean success = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, LOCK_EXPIRE);

        return Boolean.TRUE.equals(success) ? lockValue : null;
    }

    /**
     * 释放信用操作锁
     * 只有锁值匹配时才释放（防止误删其他进程的锁）
     * @param userId 用户ID
     * @param lockValue 锁标识
     */
    public void unlock(Long userId, String lockValue) {
        String lockKey = CREDIT_LOCK_PREFIX + userId;
        Object currentValue = redisTemplate.opsForValue().get(lockKey);

        if (lockValue.equals(currentValue)) {
            redisTemplate.delete(lockKey);
        }
    }
}
