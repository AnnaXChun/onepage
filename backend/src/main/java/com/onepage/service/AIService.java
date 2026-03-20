package com.onepage.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIService {

    private final RabbitTemplate rabbitTemplate;

    @Value("${upload.path}")
    private String uploadPath;

    public String enhanceImage(MultipartFile file) {
        log.info("AI image enhancement requested for file: {}", file.getOriginalFilename());
        // 预留AI图片美化接口
        // 实际实现可以对接AI服务（如Stable Diffusion、Midjourney等）
        return null;
    }

    public Map<String, Object> generateBlogFromImage(MultipartFile file) {
        log.info("AI blog generation requested for file: {}", file.getOriginalFilename());
        // 预留AI博客生成接口
        // 实际实现可以对接LLM服务生成博客内容
        Map<String, Object> result = new HashMap<>();
        result.put("title", "AI生成的博客标题");
        result.put("content", "AI生成的内容");
        return result;
    }

    public void sendToQueue(Long blogId, String imageUrl) {
        Map<String, Object> message = new HashMap<>();
        message.put("blogId", blogId);
        message.put("imageUrl", imageUrl);
        message.put("timestamp", System.currentTimeMillis());
        rabbitTemplate.convertAndSend(
            "blog.generate.exchange",
            "blog.generate",
            message
        );
    }
}
