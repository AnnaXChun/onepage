package com.onepage.messaging;

import com.onepage.dto.GenerationRequest;
import com.onepage.dto.GenerationResult;
import com.onepage.service.AIGenerationService;
import com.onepage.service.BlockAssemblyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GenerationMessageConsumer {

    private final AIGenerationService generationService;
    private final BlockAssemblyService blockAssemblyService;
    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = "blog.generate.queue")
    public void handleGenerationRequest(GenerationMessageProducer.GenerationMessage message) {
        Long blogId = message.blogId();
        try {
            sendProgress(blogId, "STARTING", 0);

            GenerationRequest request = GenerationRequest.builder()
                .blogId(blogId)
                .imageUrl(message.imageUrl())
                .description(message.description())
                .colorPalette(message.colorPalette())
                .dominantColor(message.dominantColor())
                .build();

            sendProgress(blogId, "GENERATING", 25);
            GenerationResult result = generationService.generate(request);

            sendProgress(blogId, "ASSEMBLING_BLOCKS", 75);
            blockAssemblyService.assembleBlocks(result, blogId);

            sendProgress(blogId, "COMPLETED", 100);
            log.info("Generation completed for blogId: {}", blogId);

        } catch (Exception e) {
            log.error("Generation failed for blogId: {}", blogId, e);
            sendProgress(blogId, "FAILED", 0);
        }
    }

    private void sendProgress(Long blogId, String stage, int percent) {
        messagingTemplate.convertAndSend(
            "/topic/progress/" + blogId,
            new ProgressUpdate(stage, percent)
        );
    }

    public record ProgressUpdate(String stage, int percent) {}
}
