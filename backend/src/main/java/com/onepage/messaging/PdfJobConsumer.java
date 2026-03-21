package com.onepage.messaging;

import com.onepage.dto.PdfJobMessage;
import com.onepage.service.PdfGenerationService;
import com.onepage.service.UserCreditsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
@Slf4j
public class PdfJobConsumer {

    private final PdfGenerationService pdfGenerationService;
    private final UserCreditsService userCreditsService;

    /**
     * Process PDF generation jobs from queue.
     * PDF-03, PDF-04, PDF-05
     */
    @RabbitListener(queues = "pdf.job.queue")
    public void processPdfJob(PdfJobMessage message) {
        log.info("Processing PDF job: jobId={}, userId={}, blogId={}, isPreview={}",
            message.getJobId(), message.getUserId(), message.getBlogId(), message.isPreview());

        try {
            // Generate PDF
            byte[] pdfBytes;
            if (message.isPreview()) {
                pdfBytes = pdfGenerationService.generatePdfPreview(message.getBlogId());
            } else {
                pdfBytes = pdfGenerationService.generatePdf(message.getBlogId());
            }

            // Store for download (always 24h expiration)
            String downloadUrl = pdfGenerationService.storeForDownload(message.getJobId(), pdfBytes);

            // Deduct credits only for non-preview (final) PDFs
            if (!message.isPreview()) {
                BigDecimal pdfCost = userCreditsService.getPdfCost();
                userCreditsService.deductCredits(message.getUserId(), pdfCost);
                log.info("Deducted {} credits from user {} for PDF job {}",
                    pdfCost, message.getUserId(), message.getJobId());
            }

            log.info("PDF job completed: jobId={}, downloadUrl={}", message.getJobId(), downloadUrl);

        } catch (Exception e) {
            log.error("PDF job failed: jobId={}", message.getJobId(), e);
            // Could implement retry logic or dead letter queue here
            throw e; // Re-throw to trigger RabbitMQ retry mechanism
        }
    }
}
