package com.onepage.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.onepage.dto.LoginRequest;
import com.onepage.dto.RefreshTokenRequest;
import com.onepage.exception.BusinessException;
import com.onepage.exception.ErrorCode;
import com.onepage.mapper.UserMapper;
import com.onepage.model.User;
import com.onepage.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class UserService extends ServiceImpl<UserMapper, User> {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, Object> redisTemplate;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    /**
     * Register a new user. Password is hashed with BCrypt.
     * Returns both access and refresh tokens.
     */
    public Map<String, String> register(String username, String password, String email) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, username);
        User existUser = this.getOne(wrapper);
        if (existUser != null) {
            throw BusinessException.badRequest(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        // Check email uniqueness
        checkEmailUniqueness(email);

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);
        user.setStatus(1);
        user.setCreateTime(LocalDateTime.now());
        user.setUpdateTime(LocalDateTime.now());
        user.setEmailVerified(false);
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationExpiresAt(LocalDateTime.now().plusHours(24));
        this.save(user);

        // Send verification email
        emailService.sendVerificationEmail(email, username, user.getVerificationToken());

        Map<String, String> tokens = jwtTokenProvider.generateTokenPair(user.getId(), username);
        redisTemplate.opsForValue().set(
                "user:token:" + user.getId(),
                tokens.get("accessToken"),
                7,
                TimeUnit.DAYS
        );
        return tokens;
    }

    /**
     * Authenticate user with username/password.
     * Returns both access and refresh tokens.
     */
    public Map<String, String> login(LoginRequest request) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getUsername, request.getUsername());
        User user = this.getOne(wrapper);

        if (user == null) {
            throw BusinessException.invalidCredentials();
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw BusinessException.invalidCredentials();
        }

        if (user.getStatus() != 1) {
            throw BusinessException.forbidden("User account is disabled");
        }

        // Check email verification
        if (!user.getEmailVerified()) {
            throw BusinessException.badRequest("EMAIL_NOT_VERIFIED:Please verify your email first. Check your inbox or request a new verification link.");
        }

        Map<String, String> tokens = jwtTokenProvider.generateTokenPair(user.getId(), user.getUsername());
        redisTemplate.opsForValue().set(
                "user:token:" + user.getId(),
                tokens.get("accessToken"),
                7,
                TimeUnit.DAYS
        );
        return tokens;
    }

    /**
     * Refresh tokens using a valid refresh token.
     * Returns new access and refresh token pair.
     */
    public Map<String, String> refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw BusinessException.tokenInvalid();
        }

        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw BusinessException.badRequest("Not a valid refresh token");
        }

        Long userId = jwtTokenProvider.getUserIdFromToken(refreshToken);
        String username = jwtTokenProvider.getUsernameFromToken(refreshToken);

        if (userId == null || username == null) {
            throw BusinessException.tokenInvalid();
        }

        // Verify user still exists and is active
        User user = this.getById(userId);
        if (user == null || user.getStatus() != 1) {
            throw BusinessException.userNotFound();
        }

        return jwtTokenProvider.generateTokenPair(userId, username);
    }

    /**
     * Get user info by ID.
     */
    public User getUserInfo(Long userId) {
        User user = this.getById(userId);
        if (user == null) {
            throw BusinessException.userNotFound();
        }
        user.setPassword(null);
        return user;
    }

    /**
     * Logout - invalidate token in Redis.
     */
    public void logout(Long userId) {
        redisTemplate.delete("user:token:" + userId);
    }

    /**
     * Find user by username.
     * @param username The username to search for
     * @return The user or null if not found
     */
    public User findByUsername(String username) {
        return this.lambdaQuery()
                .eq(User::getUsername, username)
                .one();
    }

    /**
     * Update robots.txt content for a user.
     * SEO-03
     */
    public void updateRobotsTxt(Long userId, String robotsTxt) {
        if (userId == null) {
            throw BusinessException.badRequest("User ID cannot be null");
        }

        User user = this.getById(userId);
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        user.setRobotsTxt(robotsTxt);
        user.setUpdateTime(LocalDateTime.now());
        this.updateById(user);
        log.info("User robots.txt updated: userId={}", userId);
    }

    /**
     * Check email uniqueness - throws if email already registered.
     */
    private void checkEmailUniqueness(String email) {
        if (email == null || email.isBlank()) return;
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, email);
        if (this.count(wrapper) > 0) {
            throw BusinessException.badRequest(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
    }

    /**
     * Verify email with token.
     */
    public void verifyEmail(String token) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getVerificationToken, token);
        User user = this.getOne(wrapper);

        if (user == null) {
            throw BusinessException.badRequest("Invalid verification token");
        }

        if (user.getVerificationExpiresAt() == null || user.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw BusinessException.badRequest("Verification link has expired");
        }

        if (user.getEmailVerified()) {
            return; // Already verified
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setVerificationExpiresAt(null);
        user.setUpdateTime(LocalDateTime.now());
        this.updateById(user);
        log.info("Email verified for user: {}", user.getUsername());
    }

    /**
     * Resend verification email with rate limiting (max 3 per 24 hours).
     */
    public void resendVerificationEmail(String email) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, email);
        User user = this.getOne(wrapper);

        if (user == null) {
            throw BusinessException.notFound("User not found");
        }

        if (user.getEmailVerified()) {
            throw BusinessException.badRequest("Email already verified");
        }

        // Check resend limit (3 per 24 hours)
        LocalDateTime now = LocalDateTime.now();
        if (user.getVerificationResendResetAt() == null || user.getVerificationResendResetAt().isBefore(now)) {
            user.setVerificationResendCount(0);
            user.setVerificationResendResetAt(now.plusHours(24));
        }

        if (user.getVerificationResendCount() >= 3) {
            throw BusinessException.badRequest("Maximum resend limit reached. Please try again after 24 hours.");
        }

        // Generate new token
        String newToken = UUID.randomUUID().toString();
        user.setVerificationToken(newToken);
        user.setVerificationExpiresAt(now.plusHours(24));
        user.setVerificationResendCount(user.getVerificationResendCount() + 1);
        user.setUpdateTime(now);
        this.updateById(user);

        emailService.sendVerificationEmail(user.getEmail(), user.getUsername(), newToken);
        log.info("Verification email resent to: {}", email);
    }

    /**
     * Update user email address and send new verification email.
     */
    public void updateEmail(Long userId, String newEmail) {
        if (newEmail == null || newEmail.isBlank()) {
            throw BusinessException.badRequest("Email cannot be empty");
        }

        // Check email not already taken by another user
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(User::getEmail, newEmail);
        wrapper.ne(User::getId, userId);
        if (this.count(wrapper) > 0) {
            throw BusinessException.badRequest(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = this.getById(userId);
        if (user == null) {
            throw BusinessException.userNotFound();
        }

        user.setEmail(newEmail);
        user.setEmailVerified(false); // Requires re-verification for new email
        user.setVerificationToken(UUID.randomUUID().toString());
        user.setVerificationExpiresAt(LocalDateTime.now().plusHours(24));
        user.setUpdateTime(LocalDateTime.now());
        this.updateById(user);

        emailService.sendVerificationEmail(newEmail, user.getUsername(), user.getVerificationToken());
        log.info("Email updated for user {}: {}", userId, newEmail);
    }
}
