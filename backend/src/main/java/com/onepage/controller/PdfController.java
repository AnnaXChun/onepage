package com.onepage.controller;

import com.onepage.config.JwtUserPrincipal;
import com.onepage.dto.PdfPreviewResponse;
import com.onepage.dto.Result;
import com.onepage.exception.BusinessException;
import com.onepage.messaging.PdfJobProducer;
import com.onepage.model.Blog;
import com.onepage.service.BlogService;
import com.onepage.service.PdfGenerationService;
import com.onepage.service.UserCreditsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
@Slf4j
public class PdfController {

    private final PdfJobProducer pdfJobProducer;
    private final PdfGenerationService pdfGenerationService;
    private final BlogService blogService;
    private final UserCreditsService userCreditsService;

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

        PdfPreviewResponse response = new PdfPreviewResponse();
        response.setJobId(jobId);
        response.setPreviewUrl("/api/pdf/status/" + jobId);
        response.setMessage("Preview generation queued. Poll the status endpoint for completion.");

        return Result.success(response);
    }

    /**
     * Request final PDF (charged to user balance).
     * PDF-01, PDF-04, PDF-06
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

        if (!userCreditsService.hasEnoughCredits(principal.getUserId(), PDF_COST)) {
            throw BusinessException.insufficientCredits();
        }

        String jobId = pdfJobProducer.queuePdfGeneration(
            principal.getUserId(),
            blogId,
            blog.getShareCode(),
            false
        );

        PdfPreviewResponse response = new PdfPreviewResponse();
        response.setJobId(jobId);
        response.setPreviewUrl("/api/pdf/status/" + jobId);
        response.setMessage("PDF generation queued. You will be charged " + PDF_COST + " credits upon completion.");

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
     * Download generated PDF.
     * PDF-05: Generated PDF downloadable via link (expires 24h)
     */
    @GetMapping("/download/{jobId}")
    public Result<byte[]> downloadPdf(@PathVariable String jobId) {
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
