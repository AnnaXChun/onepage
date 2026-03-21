package com.onepage.messaging;

import com.onepage.dto.PdfJobMessage;
import com.onepage.service.CreditLockService;
import com.onepage.service.PdfGenerationService;
import com.onepage.service.PdfJobService;
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
    private final CreditLockService creditLockService;
    private final PdfJobService pdfJobService;

    /**
     * Process PDF generation jobs from queue.
     * PDF-03, PDF-04, PDF-05: CRITICAL FIX - credit deduction happens BEFORE PDF generation
     * to prevent race condition where deduction failure could result in free PDF.
     */
    @RabbitListener(queues = "pdf.job.queue")
    public void processPdfJob(PdfJobMessage message) {
        log.info("Processing PDF job: jobId={}, userId={}, blogId={}, isPreview={}",
            message.getJobId(), message.getUserId(), message.getBlogId(), message.isPreview());

        String lockValue = null;

        // For paid exports, deduct credits BEFORE generation (fix race condition)
        if (!message.isPreview()) {
            lockValue = creditLockService.tryLock(message.getUserId());
            if (lockValue == null) {
                throw new RuntimeException("Could not acquire credit lock for user " + message.getUserId());
            }
            try {
                // Deduct FIRST - if this fails, we don't generate PDF
                BigDecimal pdfCost = userCreditsService.getPdfCost();
                userCreditsService.deductCredits(message.getUserId(), pdfCost);
                log.info("Deducted {} credits from user {} BEFORE PDF generation",
                    pdfCost, message.getUserId());
            } catch (Exception e) {
                creditLockService.unlock(message.getUserId(), lockValue);
                log.error("Credit deduction failed, PDF not generated: jobId={}", message.getJobId(), e);
                throw e;
            }
        }

        try {
            // NOW generate PDF (credits already deducted for paid exports)
            byte[] pdfBytes = message.isPreview()
                ? pdfGenerationService.generatePdfPreview(message.getBlogId())
                : pdfGenerationService.generatePdf(message.getBlogId());

            // Validate PDF quality (must be > 1KB)
            if (pdfBytes == null || pdfBytes.length < 1024) {
                throw new RuntimeException("Generated PDF is too small/invalid");
            }

            // For preview jobs, store in Redis with 1h TTL
            if (message.isPreview()) {
                pdfGenerationService.storePreviewInRedis(message.getJobId(), pdfBytes);
                log.info("Preview PDF stored in Redis: jobId={}", message.getJobId());
            }

            // Store for download (24h expiration for exports)
            String downloadUrl = pdfGenerationService.storeForDownload(message.getJobId(), pdfBytes);

            // Update job status to completed
            pdfJobService.completeJob(message.getJobId(), downloadUrl);

            log.info("PDF job completed: jobId={}, downloadUrl={}", message.getJobId(), downloadUrl);

        } catch (Exception e) {
            // If paid export failed AFTER credit was deducted, we need to refund
            if (!message.isPreview()) {
                // Refund the credits
                try {
                    BigDecimal pdfCost = userCreditsService.getPdfCost();
                    userCreditsService.addCredits(message.getUserId(), pdfCost);
                    log.info("Refunded {} credits to user {} after PDF generation failure",
                        pdfCost, message.getUserId());
                } catch (Exception refundEx) {
                    log.error("CRITICAL: Failed to refund credits for jobId={}", message.getJobId(), refundEx);
                }
                // Release lock
                if (lockValue != null) {
                    creditLockService.unlock(message.getUserId(), lockValue);
                }
            }
            // Mark job as failed
            pdfJobService.failJob(message.getJobId());
            throw e;
        }

        // Release lock for paid exports after success
        if (!message.isPreview() && lockValue != null) {
            creditLockService.unlock(message.getUserId(), lockValue);
        }
    }
}
