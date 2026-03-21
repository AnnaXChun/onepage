package com.onepage.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GenerationMessageProducer {

    private final RabbitTemplate rabbitTemplate;

    public void sendGenerationRequest(Long blogId, String imageUrl, String description,
                                      String[] colorPalette, String dominantColor) {
        log.info("Sending generation request to queue for blogId: {}", blogId);
        rabbitTemplate.convertAndSend(
            "blog.generate.exchange",
            "blog.generate",
            new GenerationMessage(blogId, imageUrl, description, colorPalette, dominantColor)
        );
    }

    public void sendRegenerateRequest(Long blogId, Integer blockIndex, com.onepage.dto.GenerationRequest request) {
        log.info("Sending regenerate request to queue for blogId: {}, blockIndex: {}", blogId, blockIndex);
        rabbitTemplate.convertAndSend(
            "blog.generate.exchange",
            "blog.generate",
            new RegenerateMessage(blogId, blockIndex, request.getDescription(), request.getColorPalette(), request.getDominantColor())
        );
    }

    public record GenerationMessage(
        Long blogId,
        String imageUrl,
        String description,
        String[] colorPalette,
        String dominantColor
    ) {}

    public record RegenerateMessage(
        Long blogId,
        Integer blockIndex,
        String description,
        String[] colorPalette,
        String dominantColor
    ) {}
}
