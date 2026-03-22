package com.onepage.controller;

import com.onepage.mapper.UserMapper;
import com.onepage.model.Blog;
import com.onepage.model.User;
import com.onepage.service.AnalyticsService;
import com.onepage.service.SitemapService;
import com.onepage.service.SiteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * Public controller for serving published blogs via subdomain hosting.
 * No authentication required - serves static HTML content.
 */
@RestController
@RequestMapping("/host")
@RequiredArgsConstructor
@Slf4j
public class SiteController {

    private final SiteService siteService;
    private final AnalyticsService analyticsService;
    private final SitemapService sitemapService;
    private final UserMapper userMapper;

    @Value("${app.site.base-url:http://localhost:8080}")
    private String siteBaseUrl;

    /**
     * Serve published blog static HTML by username.
     * Accessible at GET /host/{username}
     */
    @GetMapping("/{username}")
    public void servePublishedSite(
            @PathVariable String username,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {
        try {
            Blog blog = siteService.getPublishedBlogByUsername(username);

            // Record analytics - non-blocking via @Async
            String clientIp = getClientIp(request);
            String userAgent = request.getHeader("User-Agent");
            String referer = request.getHeader("Referer");
            analyticsService.recordPageView(blog.getId(), clientIp, userAgent, referer);

            response.setContentType("text/html;charset=UTF-8");
            response.setStatus(HttpStatus.OK.value());
            response.getWriter().write(blog.getHtmlContent());
        } catch (Exception e) {
            log.warn("Failed to serve site for username: {}", username, e);
            response.setContentType("text/plain;charset=UTF-8");
            response.setStatus(HttpStatus.NOT_FOUND.value());
            response.getWriter().write("Site not found");
        }
    }

    /**
     * Serve sitemap.xml for a user's published blogs.
     * GET /host/{username}/sitemap.xml
     * SEO-02
     */
    @GetMapping("/{username}/sitemap.xml")
    public void serveSitemap(
            @PathVariable String username,
            HttpServletResponse response) throws IOException {
        try {
            String sitemapXml = sitemapService.generateSitemap(username, siteBaseUrl);
            response.setContentType("application/xml;charset=UTF-8");
            response.setStatus(HttpStatus.OK.value());
            response.getWriter().write(sitemapXml);
        } catch (Exception e) {
            log.error("Failed to generate sitemap for username: {}", username, e);
            response.setContentType("application/xml;charset=UTF-8");
            response.setStatus(HttpStatus.OK.value());
            response.getWriter().write("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>");
        }
    }

    /**
     * Serve robots.txt for a user.
     * GET /host/{username}/robots.txt
     * SEO-03
     */
    @GetMapping("/{username}/robots.txt")
    public void serveRobotsTxt(
            @PathVariable String username,
            HttpServletResponse response) throws IOException {
        try {
            // Look up user's custom robots.txt
            User user = userMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<User>()
                    .eq(User::getUsername, username)
            );

            String robotsContent;
            if (user != null && user.getRobotsTxt() != null && !user.getRobotsTxt().isBlank()) {
                robotsContent = user.getRobotsTxt();
            } else {
                // Default robots.txt - allow all and reference sitemap
                robotsContent = "User-agent: *\n" +
                        "Allow: /\n" +
                        "Sitemap: " + siteBaseUrl + "/host/" + username + "/sitemap.xml";
            }

            response.setContentType("text/plain;charset=UTF-8");
            response.setStatus(HttpStatus.OK.value());
            response.getWriter().write(robotsContent);
        } catch (Exception e) {
            log.error("Failed to serve robots.txt for username: {}", username, e);
            response.setContentType("text/plain;charset=UTF-8");
            response.setStatus(HttpStatus.OK.value());
            response.getWriter().write("User-agent: *\nAllow: /");
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }
}
