package com.onepage.controller;

import com.onepage.dto.ProfileDTO;
import com.onepage.dto.Result;
import com.onepage.service.UserService;
import lombok.RequiredArgsConstructor;
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
}