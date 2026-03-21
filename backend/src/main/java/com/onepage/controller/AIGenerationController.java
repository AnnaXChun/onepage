package com.onepage.controller;

import com.onepage.messaging.GenerationMessageProducer;
import com.onepage.dto.GenerationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/generate")
@RequiredArgsConstructor
public class AIGenerationController {

    private final GenerationMessageProducer messageProducer;

    @PostMapping
    public ResponseEntity<?> startGeneration(@RequestBody GenerationRequest request) {
        if (request.getBlogId() == null) {
            return ResponseEntity.badRequest().body("blogId required");
        }
        if (request.getImageUrl() == null || request.getDescription() == null) {
            return ResponseEntity.badRequest().body("imageUrl and description required");
        }

        messageProducer.sendGenerationRequest(
            request.getBlogId(),
            request.getImageUrl(),
            request.getDescription(),
            request.getColorPalette(),
            request.getDominantColor()
        );

        return ResponseEntity.accepted().body(new GenerationResponse(request.getBlogId(), "QUEUED"));
    }

    @GetMapping("/status/{jobId}")
    public ResponseEntity<?> getStatus(@PathVariable Long jobId) {
        return ResponseEntity.ok(new GenerationResponse(jobId, "PROCESSING"));
    }

    @PostMapping("/regenerate/{blogId}/{blockIndex}")
    public ResponseEntity<?> regenerateBlock(
            @PathVariable Long blogId,
            @PathVariable Integer blockIndex,
            @RequestBody GenerationRequest request) {
        // Queue single block regeneration via RabbitMQ
        messageProducer.sendRegenerateRequest(blogId, blockIndex, request);
        return ResponseEntity.accepted().body(new GenerationResponse(blogId, "QUEUED"));
    }

    public record GenerationResponse(Long jobId, String status) {}
}
