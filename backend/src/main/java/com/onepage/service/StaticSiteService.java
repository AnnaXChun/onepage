package com.onepage.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class StaticSiteService {

    private final TemplateEngine templateEngine;
    private final ObjectMapper objectMapper;

    private static final String BLOG_TEMPLATE = "static-site/blog-template";

    /**
     * Generate static HTML from blog blocks JSON.
     * @param title Blog title
     * @param coverImage Cover image URL
     * @param blocksJson JSON string of blocks array
     * @param metaTitle Custom SEO meta title (falls back to title if null)
     * @param metaDescription Custom SEO meta description (falls back to content excerpt if null)
     * @param siteUrl Base URL for og:url (e.g., http://localhost:8080 or production domain)
     * @param username Username for constructing og:url path
     * @return Static HTML string
     */
    public String generateStaticHtml(String title, String coverImage, String blocksJson,
                                     String metaTitle, String metaDescription, String siteUrl, String username) {
        try {
            List<Map<String, String>> blocks = parseBlocks(blocksJson);

            Context context = new Context();
            context.setVariable("title", title);
            context.setVariable("coverImage", coverImage);
            context.setVariable("blocks", blocks);

            // SEO fields - use custom values or fall back to defaults
            context.setVariable("metaTitle", metaTitle != null ? metaTitle : title);
            context.setVariable("metaDescription", metaDescription != null ? metaDescription : truncateForMeta(contentExcerpt(blocks)));
            context.setVariable("siteUrl", siteUrl != null ? siteUrl : "http://localhost:8080");
            context.setVariable("ogImage", coverImage != null ? coverImage : "");
            context.setVariable("username", username != null ? username : "");

            String html = templateEngine.process(BLOG_TEMPLATE, context);
            log.info("Generated static HTML for blog: {}", title);
            return html;
        } catch (Exception e) {
            log.error("Failed to generate static HTML for blog: {}", title, e);
            throw new RuntimeException("Failed to generate static HTML", e);
        }
    }

    /**
     * Legacy method for backward compatibility - generates HTML without SEO fields.
     */
    public String generateStaticHtml(String title, String coverImage, String blocksJson) {
        return generateStaticHtml(title, coverImage, blocksJson, null, null, null, null);
    }

    /**
     * Extract a plain text excerpt from blocks for meta description fallback.
     */
    private String contentExcerpt(List<Map<String, String>> blocks) {
        if (blocks == null || blocks.isEmpty()) {
            return "";
        }
        StringBuilder text = new StringBuilder();
        for (Map<String, String> block : blocks) {
            String type = block.get("type");
            if ("text".equals(type) || "text-paragraph".equals(type)) {
                String content = block.get("content");
                if (content != null) {
                    text.append(content).append(" ");
                }
            }
        }
        return text.toString().trim();
    }

    /**
     * Truncate string for meta description (max 160 chars).
     */
    private String truncateForMeta(String text) {
        if (text == null || text.length() <= 160) {
            return text;
        }
        return text.substring(0, 157) + "...";
    }

    /**
     * Parse blocks JSON into list of block maps.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, String>> parseBlocks(String blocksJson) {
        if (blocksJson == null || blocksJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(blocksJson, new TypeReference<List<Map<String, String>>>() {});
        } catch (Exception e) {
            log.error("Failed to parse blocks JSON", e);
            return Collections.emptyList();
        }
    }
}
