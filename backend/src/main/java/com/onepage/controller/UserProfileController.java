package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.ProfileDTO;
import com.onepage.dto.Result;
import com.onepage.dto.UpdateProfileRequest;
import com.onepage.exception.BusinessException;
import com.onepage.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserService userService;

    /**
     * Get public profile by username.
     * GET /api/user/profile/{username}
     * Public endpoint - no authentication required.
     * PROF-01, PROF-02, PROF-03, PROF-04, PROF-10
     */
    @GetMapping("/profile/{username}")
    public Result<ProfileDTO> getPublicProfile(@PathVariable String username) {
        ProfileDTO profile = userService.getPublicProfile(username);
        return Result.success(profile);
    }

    /**
     * Update current user's profile.
     * PUT /api/user/profile
     * Requires authentication.
     * PROF-05, PROF-06, PROF-07, PROF-08
     */
    @PutMapping("/profile")
    public Result<Void> updateProfile(@Valid @RequestBody UpdateProfileRequest request) {
        JwtUserPrincipal principal = getCurrentUser();
        if (principal == null) {
            throw BusinessException.unauthorized("Please login first");
        }

        userService.updateProfile(principal.getUserId(), request);
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