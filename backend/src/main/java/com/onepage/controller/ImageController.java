package com.onepage.controller;

import com.onepage.dto.Result;
import com.onepage.service.AIService;
import com.onepage.service.ImageService;
import com.onepage.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/image")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;
    private final AIService aiService;
    private final JwtUtil jwtUtil;

    @PostMapping("/upload")
    public Result<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = imageService.uploadImage(file);
            return Result.success(Map.of("url", imageUrl));
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @PostMapping("/enhance")
    public Result<Map<String, String>> enhanceImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        try {
            // 预留AI图片美化接口
            String enhancedUrl = aiService.enhanceImage(file);
            if (enhancedUrl != null) {
                return Result.success(Map.of("url", enhancedUrl));
            }
            return Result.error("AI服务暂不可用");
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/delete")
    public Result<Void> deleteImage(@RequestBody Map<String, String> params) {
        try {
            String imageUrl = params.get("url");
            imageService.deleteImage(imageUrl);
            return Result.success();
        } catch (Exception e) {
            return Result.error(e.getMessage());
        }
    }
}
