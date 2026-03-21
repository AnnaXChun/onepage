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
        // Placeholder: parse JSON and assemble blocks with confidence scores
        // AI-07: Higher confidence for direct extraction, lower for inferred
        return GenerationResult.builder()
                .blocks(new ArrayList<>())
                .overallConfidence(0.0f)
                .build();
    }
}