package com.onepage.controller;

import com.onepage.dto.Result;
import com.onepage.exception.BusinessException;
import com.onepage.service.AIService;
import com.onepage.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/image")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;
    private final AIService aiService;

    @PostMapping("/upload")
    public Result<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = imageService.uploadImage(file);
            return Result.success(Map.of("url", imageUrl));
        } catch (IOException e) {
            throw BusinessException.internal("Failed to upload image: " + e.getMessage());
        }
    }

    @PostMapping("/enhance")
    public Result<Map<String, String>> enhanceImage(@RequestParam("file") MultipartFile file) {
        String enhancedUrl = aiService.enhanceImage(file);
        if (enhancedUrl != null) {
            return Result.success(Map.of("url", enhancedUrl));
        }
        throw BusinessException.internal("AI service is currently unavailable");
    }

    @DeleteMapping("/delete")
    public Result<Void> deleteImage(@RequestBody Map<String, String> params) {
        String imageUrl = params.get("url");
        imageService.deleteImage(imageUrl);
        return Result.success();
    }
}
