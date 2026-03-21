package com.onepage.controller;

import com.onepage.model.Blog;
import com.onepage.service.SiteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    /**
     * Serve published blog static HTML by username.
     * Accessible at GET /host/{username}
     */
    @GetMapping("/{username}")
    public void servePublishedSite(@PathVariable String username, HttpServletResponse response) throws IOException {
        try {
            Blog blog = siteService.getPublishedBlogByUsername(username);
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
}
