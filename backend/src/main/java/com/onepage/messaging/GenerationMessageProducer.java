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

    public record GenerationMessage(
        Long blogId,
        String imageUrl,
        String description,
        String[] colorPalette,
        String dominantColor
    ) {}
}
