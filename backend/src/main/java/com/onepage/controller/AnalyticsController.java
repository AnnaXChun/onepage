package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.AnalyticsDTO;
import com.onepage.dto.Result;
import com.onepage.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * Get analytics stats for all user's published blogs.
     * GET /api/analytics?period=7d
     * ANAL-03
     */
    @GetMapping
    public Result<List<AnalyticsDTO>> getUserAnalytics(
            @AuthenticationPrincipal JwtUserPrincipal principal,
            @RequestParam(defaultValue = "7d") String period) {
        List<AnalyticsDTO> stats = analyticsService.getUserBlogsStats(principal.getUserId(), period);
        return Result.success(stats);
    }

    /**
     * Get analytics stats for a specific blog.
     * GET /api/analytics/blog/{blogId}?period=7d
     * ANAL-01, ANAL-02
     */
    @GetMapping("/blog/{blogId}")
    public Result<AnalyticsDTO> getBlogAnalytics(
            @PathVariable Long blogId,
            @RequestParam(defaultValue = "7d") String period) {
        AnalyticsDTO stats = analyticsService.getBlogStats(blogId, period);
        return Result.success(stats);
    }
}