package com.onepage.filter;

import com.onepage.config.HostingConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter for extracting subdomain from Host header and routing to SiteController.
 * Dev mode: john.localhost:8080 -> extracts "john"
 * Prod mode: john.vibe.com -> extracts "john"
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
@Slf4j
public class SubdomainFilter extends OncePerRequestFilter {

    private final HostingConfig hostingConfig;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String host = request.getHeader("Host");
        if (host == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String subdomain = extractSubdomain(host);
        if (subdomain != null && isValidUsername(subdomain)) {
            log.debug("Subdomain detected: {} from host: {}", subdomain, host);
            request.getRequestDispatcher("/host/" + subdomain).forward(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extract subdomain from Host header.
     * Supports:
     * - localhost:port format (dev): john.localhost:8080 -> "john"
     * - 127.0.0.1:port format (dev): john.127.0.0.1:8080 -> "john"
     * - domain format (prod): john.vibe.com -> "john"
     */
    private String extractSubdomain(String host) {
        // Remove port if present
        String hostWithoutPort = host.contains(":")
                ? host.substring(0, host.indexOf(":"))
                : host;

        // Handle localhost patterns (dev environment)
        if (hostWithoutPort.contains("localhost") || hostWithoutPort.contains("127.0.0.1")) {
            // For john.localhost:8080 -> split by "." -> ["john", "localhost"]
            if (hostWithoutPort.contains(".")) {
                String[] parts = hostWithoutPort.split("\\.");
                if (parts.length >= 2) {
                    return parts[0];
                }
            }
        }

        // Handle production subdomain pattern (e.g., john.vibe.com)
        if (hostWithoutPort.contains(".")) {
            String[] parts = hostWithoutPort.split("\\.");
            if (parts.length >= 2) {
                // Check if base domain matches expected pattern
                String baseDomain = hostingConfig.getBaseDomain();
                String baseHost = baseDomain.contains(":")
                        ? baseDomain.substring(0, baseDomain.indexOf(":"))
                        : baseDomain;

                // Check if the domain ends with our base domain or is a subdomain
                for (int i = 1; i < parts.length; i++) {
                    String potentialDomain = String.join(".", parts[i]);
                    if (potentialDomain.contains(baseHost) || potentialDomain.equals("vibe.com")) {
                        return parts[0];
                    }
                }
            }
        }

        return null;
    }

    /**
     * Validate username format: alphanumeric + underscore, 3-30 chars.
     */
    private boolean isValidUsername(String subdomain) {
        return subdomain != null
                && subdomain.matches("^[a-zA-Z0-9_]{3,30}$")
                && !subdomain.equals("www")
                && !subdomain.equals("api");
    }
}
