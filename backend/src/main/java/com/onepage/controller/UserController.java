package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.LoginRequest;
import com.onepage.dto.RefreshTokenRequest;
import com.onepage.dto.RegisterRequest;
import com.onepage.dto.Result;
import com.onepage.exception.BusinessException;
import com.onepage.model.User;
import com.onepage.service.UserService;
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
