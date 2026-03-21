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
     * @return Static HTML string
     */
    public String generateStaticHtml(String title, String coverImage, String blocksJson) {
        try {
            List<Map<String, String>> blocks = parseBlocks(blocksJson);

            Context context = new Context();
            context.setVariable("title", title);
            context.setVariable("coverImage", coverImage);
            context.setVariable("blocks", blocks);

            String html = templateEngine.process(BLOG_TEMPLATE, context);
            log.info("Generated static HTML for blog: {}", title);
            return html;
        } catch (Exception e) {
            log.error("Failed to generate static HTML for blog: {}", title, e);
            throw new RuntimeException("Failed to generate static HTML", e);
        }
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
