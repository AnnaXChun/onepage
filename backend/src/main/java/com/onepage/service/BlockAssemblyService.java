package com.onepage.service;

import com.onepage.dto.GenerationResult;
import com.onepage.model.Blog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlockAssemblyService {

    private final BlogService blogService;

    public void assembleBlocks(GenerationResult result, Long blogId) {
        log.info("Assembling blocks for blogId: {} with {} blocks",
            blogId, result.getBlocks() != null ? result.getBlocks().size() : 0);

        if (result.getBlocks() == null || result.getBlocks().isEmpty()) {
            log.warn("No blocks to assemble for blogId: {}", blogId);
            return;
        }

        // AI-07: Confidence scoring - higher for direct extractions, lower for AI inference
        // Convert GenerationResult.BlockData to block JSON for editor
        List<Map<String, Object>> blocksJson = new ArrayList<>();

        for (GenerationResult.BlockData blockData : result.getBlocks()) {
            Map<String, Object> block = new LinkedHashMap<>();
            block.put("id", UUID.randomUUID().toString());
            block.put("type", mapBlockType(blockData.getType()));
            block.put("content", blockData.getContent() != null ? blockData.getContent() : "");
            block.put("config", new HashMap<>()); // Default empty config
            block.put("confidence", blockData.getConfidence());

            blocksJson.add(block);
            log.debug("Block assembled: type={}, confidence={}", blockData.getType(), blockData.getConfidence());
        }

        // Convert to JSON and persist via BlogService
        String blocksJsonString = com.alibaba.fastjson2.JSON.toJSONString(blocksJson);
        blogService.updateBlogBlocks(blogId, blocksJsonString);

        log.info("Successfully assembled {} blocks for blogId: {}", blocksJson.size(), blogId);
    }

    /**
     * Map AI block type to editor block type.
     */
    private String mapBlockType(String aiType) {
        if (aiType == null) return "text-paragraph";

        return switch (aiType.toLowerCase()) {
            case "text-h1", "h1", "title", "heading1" -> "text-h1";
            case "text-h2", "h2", "heading2", "subtitle" -> "text-h2";
            case "text-list", "ul", "ol", "list" -> "text-list";
            case "image-single", "image", "img", "photo" -> "image-single";
            case "social-links", "social", "links" -> "social-links";
            case "contact", "contact-form" -> "contact";
            case "divider", "hr", "separator" -> "divider";
            default -> "text-paragraph";
        };
    }
}
