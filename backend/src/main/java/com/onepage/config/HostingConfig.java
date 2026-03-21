package com.onepage.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Hosting configuration for subdomain-based blog serving.
 * Controls environment-aware subdomain routing (dev vs prod).
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "hosting")
public class HostingConfig {

    /**
     * Base domain for hosting (e.g., localhost:8080 for dev, vibe.com for prod).
     */
    private String baseDomain = "localhost:8080";

    /**
     * Whether to use subdomain routing (vs path-based).
     */
    private boolean useSubdomain = true;

    /**
     * Environment: "dev" or "prod".
     */
    private String environment = "dev";
}
