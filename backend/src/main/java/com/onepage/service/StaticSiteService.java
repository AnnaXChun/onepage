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
     * For text blocks, converts Lexical JSON to HTML for rich text rendering.
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, String>> parseBlocks(String blocksJson) {
        if (blocksJson == null || blocksJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<Map<String, Object>> blocks = objectMapper.readValue(blocksJson, new TypeReference<List<Map<String, Object>>>() {});
            return blocks.stream().map(block -> {
                Map<String, String> result = new java.util.HashMap<>();
                for (Map.Entry<String, Object> entry : block.entrySet()) {
                    if ("content".equals(entry.getKey())) {
                        // Convert text block content from Lexical JSON to HTML
                        String type = (String) block.get("type");
                        if ("text".equals(type) || type.startsWith("text-")) {
                            result.put("content", lexicalJsonToHtml(entry.getValue()));
                        } else {
                            result.put("content", entry.getValue() != null ? entry.getValue().toString() : "");
                        }
                    } else {
                        result.put(entry.getKey(), entry.getValue() != null ? entry.getValue().toString() : "");
                    }
                }
                return result;
            }).toList();
        } catch (Exception e) {
            log.error("Failed to parse blocks JSON", e);
            return Collections.emptyList();
        }
    }

    /**
     * Convert Lexical JSON to HTML for rich text rendering.
     * Handles text nodes with format flags (bold, italic, underline) and link nodes.
     */
    @SuppressWarnings("unchecked")
    private String lexicalJsonToHtml(Object content) {
        if (content == null || content.toString().isBlank()) {
            return "";
        }
        try {
            // Parse the Lexical JSON content
            Map<String, Object> lexicalNode = objectMapper.readValue(content.toString(), new TypeReference<Map<String, Object>>() {});
            return nodeToHtml(lexicalNode);
        } catch (Exception e) {
            log.error("Failed to convert Lexical JSON to HTML", e);
            // Fallback: treat as plain text
            return escapeHtml(content.toString());
        }
    }

    /**
     * Convert a single Lexical node to HTML.
     */
    @SuppressWarnings("unchecked")
    private String nodeToHtml(Map<String, Object> node) {
        String type = (String) node.get("type");
        if ("text".equals(type)) {
            return textNodeToHtml(node);
        } else if ("link".equals(type)) {
            return linkNodeToHtml(node);
        } else if ("block".equals(type)) {
            // Block node - process children
            List<Map<String, Object>> children = (List<Map<String, Object>>) node.get("children");
            if (children == null || children.isEmpty()) {
                return "";
            }
            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> child : children) {
                sb.append(nodeToHtml(child));
            }
            return sb.toString();
        }
        // Unknown node type - try children
        List<Map<String, Object>> children = (List<Map<String, Object>>) node.get("children");
        if (children != null && !children.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> child : children) {
                sb.append(nodeToHtml(child));
            }
            return sb.toString();
        }
        return "";
    }

    /**
     * Convert a Lexical text node to HTML with format flags.
     * Format flags: 1=bold, 2=italic, 4=underline
     */
    private String textNodeToHtml(Map<String, Object> node) {
        String text = (String) node.get("text");
        if (text == null) return "";

        int format = 0;
        Object formatObj = node.get("format");
        if (formatObj instanceof Number) {
            format = ((Number) formatObj).intValue();
        }

        StringBuilder sb = new StringBuilder();
        boolean bold = (format & 1) != 0;
        boolean italic = (format & 2) != 0;
        boolean underline = (format & 4) != 0;

        if (bold) sb.append("<strong>");
        if (italic) sb.append("<em>");
        if (underline) sb.append("<u>");

        sb.append(escapeHtml(text));

        if (underline) sb.append("</u>");
        if (italic) sb.append("</em>");
        if (bold) sb.append("</strong>");

        return sb.toString();
    }

    /**
     * Convert a Lexical link node to HTML anchor tag.
     */
    @SuppressWarnings("unchecked")
    private String linkNodeToHtml(Map<String, Object> node) {
        String href = (String) node.get("href");
        if (href == null || href.isBlank()) return "";

        String target = (String) node.get("target");
        boolean newTab = "_blank".equals(target);

        StringBuilder sb = new StringBuilder();
        sb.append("<a href=\"").append(escapeHtml(href)).append("\"");
        if (newTab) {
            sb.append(" target=\"_blank\" rel=\"noopener noreferrer\"");
        }
        sb.append(">");

        // Process children
        List<Map<String, Object>> children = (List<Map<String, Object>>) node.get("children");
        if (children != null) {
            for (Map<String, Object> child : children) {
                sb.append(nodeToHtml(child));
            }
        }

        sb.append("</a>");
        return sb.toString();
    }

    /**
     * Escape HTML special characters for safe rendering.
     */
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&#39;");
    }
}
