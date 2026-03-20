package com.onepage.controller;

import com.onepage.dto.LoginRequest;
import com.onepage.dto.Result;
import com.onepage.model.User;
import com.onepage.service.UserService;
import com.onepage.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public Result<Map<String, String>> register(@RequestBody Map<String, String> params) {
        try {
            String token = userService.register(
                params.get("username"),
                params.get("password"),
                params.get("email")
            );
            return Result.success(Map.of("token", token));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/login")
    public Result<Map<String, String>> login(@RequestBody LoginRequest request) {
        try {
            String token = userService.login(request);
            return Result.success(Map.of("token", token));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/info")
    public Result<User> getUserInfo(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            User user = userService.getUserInfo(userId);
            user.setPassword(null);
            return Result.success(user);
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/logout")
    public Result<Void> logout(HttpServletRequest request) {
        try {
            Long userId = getUserIdFromRequest(request);
            userService.logout(userId);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    private Long getUserIdFromRequest(HttpServletRequest request) {
        String token = request.getHeader("Authorization");
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtUtil.getUserIdFromToken(token);
    }
}
