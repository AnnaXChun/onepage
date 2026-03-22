package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.EmailRequest;
import com.onepage.dto.LoginRequest;
import com.onepage.dto.RefreshTokenRequest;
import com.onepage.dto.RegisterRequest;
import com.onepage.dto.Result;
import com.onepage.dto.UpdateEmailRequest;
import com.onepage.exception.BusinessException;
import com.onepage.model.User;
import com.onepage.service.UserCreditsService;
import com.onepage.service.UserService;

import java.math.BigDecimal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserCreditsService userCreditsService;

    @PostMapping("/register")
    public Result<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        Map<String, String> tokens = userService.register(
                request.getUsername(),
                request.getPassword(),
                request.getEmail()
        );
        return Result.success(tokens);
    }

    @PostMapping("/login")
    public Result<Map<String, String>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, String> tokens = userService.login(request);
        return Result.success(tokens);
    }

    @PostMapping("/refresh")
    public Result<Map<String, String>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        Map<String, String> tokens = userService.refreshToken(request);
        return Result.success(tokens);
    }

    @GetMapping("/info")
    public Result<User> getUserInfo() {
        JwtUserPrincipal principal = getCurrentUser();
        if (principal == null) {
            throw BusinessException.unauthorized("Please login first");
        }
        User user = userService.getUserInfo(principal.getUserId());
        return Result.success(user);
    }

    @PostMapping("/logout")
    public Result<Void> logout() {
        JwtUserPrincipal principal = getCurrentUser();
        if (principal != null) {
            userService.logout(principal.getUserId());
        }
        return Result.success();
    }

    @GetMapping("/credits")
    public Result<BigDecimal> getCredits(Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        BigDecimal balance = userCreditsService.getCredits(principal.getUserId());
        return Result.success(balance);
    }

    /**
     * Update robots.txt for the current user.
     * PUT /api/user/robots
     * SEO-03
     */
    @PutMapping("/robots")
    public Result<Void> updateRobotsTxt(@RequestBody Map<String, String> request) {
        JwtUserPrincipal principal = getCurrentUser();
        if (principal == null) {
            throw BusinessException.unauthorized("Please login first");
        }

        String robotsTxt = request.get("robotsTxt");
        userService.updateRobotsTxt(principal.getUserId(), robotsTxt);
        return Result.success();
    }

    /**
     * Verify email with token.
     * POST /api/user/verify-email?token=xxx
     */
    @PostMapping("/verify-email")
    public Result<Void> verifyEmail(@RequestParam String token) {
        userService.verifyEmail(token);
        return Result.success();
    }

    /**
     * Resend verification email.
     * POST /api/user/resend-verification
     */
    @PostMapping("/resend-verification")
    public Result<Void> resendVerification(@Valid @RequestBody EmailRequest request) {
        userService.resendVerificationEmail(request.getEmail());
        return Result.success();
    }

    /**
     * Update user email address.
     * PUT /api/user/email
     */
    @PutMapping("/email")
    public Result<Void> updateEmail(@Valid @RequestBody UpdateEmailRequest request) {
        JwtUserPrincipal principal = getCurrentUser();
        if (principal == null) {
            throw BusinessException.unauthorized("Please login first");
        }
        userService.updateEmail(principal.getUserId(), request.getEmail());
        return Result.success();
    }

    /**
     * Get current authenticated user from SecurityContext.
     */
    private JwtUserPrincipal getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof JwtUserPrincipal principal) {
            return principal;
        }
        return null;
    }
}
