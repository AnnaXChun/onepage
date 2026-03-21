package com.onepage.messaging;

import com.onepage.dto.PdfJobMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class PdfJobProducer {

    private final RabbitTemplate rabbitTemplate;

    private static final String PDF_JOB_QUEUE = "pdf.job.queue";

    /**
     * Queue a PDF generation job.
     * Returns the job ID for tracking.
     * PDF-03
     */
    public String queuePdfGeneration(Long userId, Long blogId, String shareCode, boolean isPreview) {
        String jobId = UUID.randomUUID().toString();

        PdfJobMessage message = new PdfJobMessage();
        message.setJobId(jobId);
        message.setUserId(userId);
        message.setBlogId(blogId);
        message.setShareCode(shareCode);
        message.setPreview(isPreview);

        rabbitTemplate.convertAndSend(PDF_JOB_QUEUE, message);
        log.info("Queued PDF job: jobId={}, userId={}, blogId={}, isPreview={}",
            jobId, userId, blogId, isPreview);

        return jobId;
    }
}
