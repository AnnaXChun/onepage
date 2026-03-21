package com.onepage.service;

import com.onepage.dto.GenerationRequest;
import com.onepage.dto.GenerationResult;
import com.onepage.exception.BusinessException;
import com.onepage.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.ChatModel;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIGenerationService {

    private final ChatModel chatModel;

    public GenerationResult generate(GenerationRequest request) {
        validateRequest(request);

        String prompt = buildPrompt(request);
        String content = callMiniMax(prompt);

        return parseAndAssemble(content, request);
    }

    private void validateRequest(GenerationRequest request) {
        if (request.getBlogId() == null) {
            throw BusinessException.badRequest("blogId is required");
        }
        if (request.getDescription() == null || request.getDescription().isBlank()) {
            throw BusinessException.badRequest("description is required");
        }
        if (request.getColorPalette() == null || request.getColorPalette().length == 0) {
            throw BusinessException.badRequest("color palette is required");
        }
    }

    private String buildPrompt(GenerationRequest request) {
        return String.format(
                "Generate a single-page website content based on:\nDescription: %s\nColor Palette: %s\n\nOutput JSON with title, paragraphs, and image placements.",
                request.getDescription(),
                String.join(", ", request.getColorPalette())
        );
    }

    private String callMiniMax(String prompt) {
        try {
            return chatModel.call(prompt);
        } catch (Exception e) {
            log.error("MiniMax API call failed", e);
            throw BusinessException.internal("AI generation failed: " + e.getMessage());
        }
    }

    private GenerationResult parseAndAssemble(String content, GenerationRequest request) {
        // AI-07: Parse MiniMax JSON response and assemble blocks with confidence scores
        // Higher confidence for direct extraction, lower for AI inference
        List<GenerationResult.BlockData> blocks = new ArrayList<>();

        try {
            // Try to parse JSON from the content
            // MiniMax returns structured text that can be parsed as JSON
            String jsonContent = extractJson(content);

            if (jsonContent != null && !jsonContent.isEmpty()) {
                com.alibaba.fastjson2.JSONObject json = com.alibaba.fastjson2.JSON.parseObject(jsonContent);

                // Parse blocks array
                com.alibaba.fastjson2.JSONArray blocksArray = json.getJSONArray("blocks");
                if (blocksArray != null) {
                    for (int i = 0; i < blocksArray.size(); i++) {
                        com.alibaba.fastjson2.JSONObject blockObj = blocksArray.getJSONObject(i);
                        String type = blockObj.getString("type");
                        String blockContent = blockObj.getString("content");
                        int position = blockObj.getIntValue("position", i);

                        // Calculate confidence based on content quality
                        float confidence = calculateConfidence(blockContent);

                        blocks.add(GenerationResult.BlockData.builder()
                                .type(type != null ? type : "text-paragraph")
                                .content(blockContent != null ? blockContent : "")
                                .position(position)
                                .style(blockObj.getJSONObject("style"))
                                .confidence(confidence)
                                .build());
                    }
                }

                // Also check for title/paragraphs at root level for backward compatibility
                if (blocks.isEmpty()) {
                    String title = json.getString("title");
                    if (title != null && !title.isEmpty()) {
                        blocks.add(GenerationResult.BlockData.builder()
                                .type("text-h1")
                                .content(title)
                                .position(0)
                                .confidence(0.9f)
                                .build());
                    }

                    String paragraph = json.getString("paragraph");
                    if (paragraph != null && !paragraph.isEmpty()) {
                        blocks.add(GenerationResult.BlockData.builder()
                                .type("text-paragraph")
                                .content(paragraph)
                                .position(1)
                                .confidence(0.85f)
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse MiniMax JSON response, using fallback parsing: {}", e.getMessage());
            // Fallback: try to extract content from raw text
            blocks = fallbackParse(content);
        }

        // Calculate overall confidence
        float overallConfidence = blocks.isEmpty() ? 0.0f :
                blocks.stream().map(GenerationResult.BlockData::getConfidence).reduce(0f, Float::sum) / blocks.size();

        return GenerationResult.builder()
                .blocks(blocks)
                .overallConfidence(overallConfidence)
                .build();
    }

    /**
     * Extract JSON object from MiniMax response (handles markdown code blocks).
     */
    private String extractJson(String content) {
        if (content == null) return null;

        // Handle markdown code blocks: ```json ... ```
        int jsonStart = content.indexOf("{");
        int jsonEnd = content.lastIndexOf("}");

        if (jsonStart >= 0 && jsonEnd > jsonStart) {
            return content.substring(jsonStart, jsonEnd + 1);
        }
        return null;
    }

    /**
     * Calculate confidence based on content quality signals.
     * - Substantial content (50+ chars): 0.85
     * - Brief content (< 50 chars): 0.70
     * - Empty content: 0.0
     */
    private float calculateConfidence(String content) {
        if (content == null || content.trim().isEmpty()) {
            return 0.0f;
        }
        int length = content.trim().length();
        if (length >= 50) {
            return 0.85f;
        }
        return 0.70f;
    }

    /**
     * Fallback parsing when JSON parsing fails - extract meaningful text blocks.
     */
    private List<GenerationResult.BlockData> fallbackParse(String content) {
        List<GenerationResult.BlockData> blocks = new ArrayList<>();

        if (content == null || content.trim().isEmpty()) {
            return blocks;
        }

        // Split by double newlines or numbered sections
        String[] sections = content.split("\\n\\n+|#+\\s*");

        int position = 0;
        for (String section : sections) {
            String trimmed = section.trim();
            if (trimmed.isEmpty()) continue;

            // Determine block type
            String type = "text-paragraph";
            if (position == 0 && trimmed.length() < 100) {
                type = "text-h1";
            } else if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
                type = "text-list";
            }

            blocks.add(GenerationResult.BlockData.builder()
                    .type(type)
                    .content(trimmed)
                    .position(position++)
                    .confidence(0.6f) // Lower confidence for fallback parsing
                    .build());
        }

        return blocks;
    }
}