package com.onepage.controller;

import com.onepage.dto.AIWriteRequest;
import com.onepage.service.AIWriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/write")
@RequiredArgsConstructor
public class AIWriteController {

    private final AIWriteService aiWriteService;

    @PostMapping
    public ResponseEntity<?> write(@RequestBody AIWriteRequest request) {
        // WRT-02: Generate content based on existing text
        // WRT-03: Replace or Append based on mode
        if (request.getBlockId() == null || request.getExistingText() == null) {
            return ResponseEntity.badRequest().body("blockId and existingText required");
        }
        if (request.getMode() == null) {
            request.setMode("replace");
        }

        String result = aiWriteService.write(
            request.getBlockId(),
            request.getExistingText(),
            request.getMode()
        );

        return ResponseEntity.ok(new AIWriteResponse(result));
    }

    public record AIWriteResponse(String content) {}
}
