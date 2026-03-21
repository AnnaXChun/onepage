package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.PdfPreviewResponse;
import com.onepage.dto.Result;
import com.onepage.exception.BusinessException;
import com.onepage.messaging.PdfJobProducer;
import com.onepage.model.Blog;
import com.onepage.model.PdfJob;
import com.onepage.service.BlogService;
import com.onepage.service.CreditLockService;
import com.onepage.service.PdfGenerationService;
import com.onepage.service.PdfJobService;
import com.onepage.service.UserCreditsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
@Slf4j
public class PdfController {

    private final PdfJobProducer pdfJobProducer;
    private final PdfGenerationService pdfGenerationService;
    private final BlogService blogService;
    private final UserCreditsService userCreditsService;
    private final PdfJobService pdfJobService;
    private final CreditLockService creditLockService;

    private static final BigDecimal PDF_COST = new BigDecimal("0.3");

    /**
     * Request PDF preview (free, no charge).
     * PDF-01, PDF-06: Preview shown before charging
     */
    @GetMapping("/preview/{blogId}")
    public Result<PdfPreviewResponse> requestPreview(
            @PathVariable Long blogId,
            @AuthenticationPrincipal JwtUserPrincipal principal) {

        Blog blog = blogService.getBlogById(blogId);
        if (blog == null) {
            throw BusinessException.blogNotFound();
        }
        if (!blog.getUserId().equals(principal.getUserId())) {
            throw BusinessException.forbidden();
        }

        String jobId = pdfJobProducer.queuePdfGeneration(
            principal.getUserId(),
            blogId,
            blog.getShareCode(),
            true
        );

        // Create PdfJob record for tracking (Task 3)
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);
        pdfJobService.createJob(jobId, principal.getUserId(), blogId, 1, expiresAt);

        PdfPreviewResponse response = new PdfPreviewResponse();
        response.setJobId(jobId);
        response.setPreviewUrl("/api/pdf/preview/" + jobId);
        response.setMessage("Preview generation queued. Preview link expires in 1 hour.");
        response.setExpiresAt(expiresAt);

        return Result.success(response);
    }

    /**
     * Request final PDF (charged to user balance).
     * PDF-01, PDF-04, PDF-06: CRITICAL - credits deducted BEFORE queuing job
     */
    @PostMapping("/export/{blogId}")
    public Result<PdfPreviewResponse> requestExport(
            @PathVariable Long blogId,
            @AuthenticationPrincipal JwtUserPrincipal principal) {

        Blog blog = blogService.getBlogById(blogId);
        if (blog == null) {
            throw BusinessException.blogNotFound();
        }
        if (!blog.getUserId().equals(principal.getUserId())) {
            throw BusinessException.forbidden();
        }

        // CRITICAL: Deduct credits BEFORE queueing job to prevent race condition
        // If user doesn't have enough credits, they get immediate error without job being queued
        if (!userCreditsService.hasEnoughCredits(principal.getUserId(), PDF_COST)) {
            throw BusinessException.insufficientCredits();
        }

        // Atomic check-and-deduct using Redis lock
        String lockValue = creditLockService.tryLock(principal.getUserId());
        if (lockValue == null) {
            throw BusinessException.badRequest("Credit operation in progress, please retry");
        }

        try {
            // Re-check balance inside lock
            if (!userCreditsService.hasEnoughCredits(principal.getUserId(), PDF_COST)) {
                throw BusinessException.insufficientCredits();
            }
            // Deduct credits atomically
            userCreditsService.deductCredits(principal.getUserId(), PDF_COST);
            log.info("Deducted {} credits from user {} for PDF export", PDF_COST, principal.getUserId());
        } catch (BusinessException e) {
            creditLockService.unlock(principal.getUserId(), lockValue);
            throw e;
        } catch (Exception e) {
            creditLockService.unlock(principal.getUserId(), lockValue);
            throw BusinessException.badRequest("Failed to process credit, please retry");
        } finally {
            // Always release lock
            creditLockService.unlock(principal.getUserId(), lockValue);
        }

        // Only queue job AFTER successful credit deduction
        String jobId = pdfJobProducer.queuePdfGeneration(
            principal.getUserId(),
            blogId,
            blog.getShareCode(),
            false
        );

        // Create job record with 24h expiration
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        pdfJobService.createJob(jobId, principal.getUserId(), blogId, 2, expiresAt);

        PdfPreviewResponse response = new PdfPreviewResponse();
        response.setJobId(jobId);
        response.setPreviewUrl("/api/pdf/status/" + jobId);
        response.setDownloadUrl("/api/pdf/download/" + jobId);  // NEW: direct download URL
        response.setMessage("PDF generation queued. You were charged " + PDF_COST + " credits.");
        response.setExpiresAt(expiresAt);

        return Result.success(response);
    }

    /**
     * Check PDF generation status and get download URL.
     */
    @GetMapping("/status/{jobId}")
    public Result<PdfPreviewResponse> getStatus(@PathVariable String jobId) {
        byte[] pdfBytes = pdfGenerationService.getStoredPdf(jobId);

        PdfPreviewResponse response = new PdfPreviewResponse();
        response.setJobId(jobId);

        if (pdfBytes != null) {
            response.setPreviewUrl("/api/pdf/download/" + jobId);
            response.setMessage("PDF ready for download.");
        } else {
            response.setPreviewUrl(null);
            response.setMessage("PDF generation in progress. Please wait and retry.");
        }

        return Result.success(response);
    }

    /**
     * Serve preview PDF from Redis (1h expiry).
     * Preview URL format: /api/pdf/preview/{jobId}
     * PDF-06: Preview shown before charging
     */
    @GetMapping("/preview/{jobId}")
    public Result<byte[]> servePreview(
            @PathVariable String jobId,
            @AuthenticationPrincipal JwtUserPrincipal principal) {

        // Fetch job from database to verify ownership
        PdfJob job = pdfJobService.getJobByJobId(jobId);
        if (job == null) {
            throw BusinessException.badRequest("Preview not found or expired");
        }

        // Verify ownership - only job owner can access preview
        if (!job.getUserId().equals(principal.getUserId())) {
            log.warn("Unauthorized preview access attempt: userId={}, jobOwner={}, jobId={}",
                principal.getUserId(), job.getUserId(), jobId);
            throw BusinessException.forbidden();
        }

        // Verify job is for preview (jobType = 1)
        if (job.getJobType() != 1) {
            throw BusinessException.badRequest("Invalid job type for preview endpoint");
        }

        // Check if preview has expired (1h for preview)
        if (job.getExpiresAt() != null && LocalDateTime.now().isAfter(job.getExpiresAt())) {
            throw BusinessException.badRequest("Preview link has expired");
        }

        byte[] pdfBytes = pdfGenerationService.getPreviewFromRedis(jobId);
        if (pdfBytes == null) {
            throw BusinessException.badRequest("Preview not found or expired");
        }
        return Result.success(pdfBytes);
    }

    /**
     * Download generated PDF.
     * PDF-05: Generated PDF downloadable via link (expires 24h)
     * CRITICAL: Validates user ownership before serving PDF
     */
    @GetMapping("/download/{jobId}")
    public Result<byte[]> downloadPdf(
            @PathVariable String jobId,
            @AuthenticationPrincipal JwtUserPrincipal principal) {

        // Fetch job from database to verify ownership
        PdfJob job = pdfJobService.getJobByJobId(jobId);
        if (job == null) {
            throw BusinessException.badRequest("PDF not found or expired");
        }

        // Verify ownership - only job owner can download
        if (!job.getUserId().equals(principal.getUserId())) {
            log.warn("Unauthorized PDF download attempt: userId={}, jobOwner={}, jobId={}",
                principal.getUserId(), job.getUserId(), jobId);
            throw BusinessException.forbidden();
        }

        // Verify job is completed
        if (job.getStatus() != 1) { // 1 = completed
            throw BusinessException.badRequest("PDF not ready for download");
        }

        byte[] pdfBytes = pdfGenerationService.getStoredPdf(jobId);
        if (pdfBytes == null) {
            throw BusinessException.badRequest("PDF not found or expired");
        }

        return Result.success(pdfBytes);
    }

    /**
     * Get user's current credit balance.
     */
    @GetMapping("/balance")
    public Result<String> getBalance(@AuthenticationPrincipal JwtUserPrincipal principal) {
        return Result.success(userCreditsService.getCredits(principal.getUserId()).toString());
    }
}
