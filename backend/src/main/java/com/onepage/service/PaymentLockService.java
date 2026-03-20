package com.onepage.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.UUID;

/**
 * 分布式锁服务 - 用于支付防重
 */
@Service
@RequiredArgsConstructor
public class PaymentLockService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String PAYMENT_LOCK_PREFIX = "payment:lock:";
    private static final String IDEMPOTENT_KEY_PREFIX = "payment:idempotent:";
    private static final Duration LOCK_EXPIRE = Duration.ofMinutes(5);
    private static final Duration IDEMPOTENT_EXPIRE = Duration.ofHours(24);

    /**
     * 尝试获取支付锁
     * @param orderNo 订单号
     * @return 锁标识，如果返回null表示获取失败
     */
    public String tryLock(String orderNo) {
        String lockKey = PAYMENT_LOCK_PREFIX + orderNo;
        String lockValue = UUID.randomUUID().toString();

        Boolean success = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, LOCK_EXPIRE);

        return Boolean.TRUE.equals(success) ? lockValue : null;
    }

    /**
     * 释放支付锁
     * @param orderNo 订单号
     * @param lockValue 锁标识
     */
    public void unlock(String orderNo, String lockValue) {
        String lockKey = PAYMENT_LOCK_PREFIX + orderNo;
        Object currentValue = redisTemplate.opsForValue().get(lockKey);

        if (lockValue.equals(currentValue)) {
            redisTemplate.delete(lockKey);
        }
    }

    /**
     * 检查支付幂等键是否存在
     * @param idempotentKey 幂等键
     * @return true if exists
     */
    public boolean checkIdempotentKey(String idempotentKey) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(IDEMPOTENT_KEY_PREFIX + idempotentKey));
    }

    /**
     * 存储支付幂等键
     * @param idempotentKey 幂等键
     * @param result 结果数据
     */
    public void storeIdempotentKey(String idempotentKey, Object result) {
        redisTemplate.opsForValue().set(
                IDEMPOTENT_KEY_PREFIX + idempotentKey,
                result,
                IDEMPOTENT_EXPIRE
        );
    }

    /**
     * 获取幂等键对应的结果
     * @param idempotentKey 幂等键
     * @return 结果数据
     */
    public Object getIdempotentResult(String idempotentKey) {
        return redisTemplate.opsForValue().get(IDEMPOTENT_KEY_PREFIX + idempotentKey);
    }
}
