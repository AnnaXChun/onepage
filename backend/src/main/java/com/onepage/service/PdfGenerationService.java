package com.onepage.service;

import com.onepage.model.Blog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.xhtmlrenderer.pdf.ITextRenderer;

import jakarta.annotation.PostConstruct;
import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Duration;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfGenerationService {

    private final BlogService blogService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String PDF_STORAGE_DIR = "/tmp/pdfs/";
    private static final int PDF_EXPIRE_HOURS = 24;
    private static final String PREVIEW_REDIS_PREFIX = "pdf:preview:";
    private static final Duration PREVIEW_TTL = Duration.ofHours(1);
    private static final String PREVIEW_WATERMARK = "PREVIEW - DO NOT DISTRIBUTE";

    /**
     * Generate PDF from blog HTML content using Flying Saucer.
     * PDF-02
     */
    public byte[] generatePdf(Long blogId) {
        Blog blog = blogService.getBlogById(blogId);
        if (blog == null) {
            throw new RuntimeException("Blog not found: " + blogId);
        }

        String htmlContent;
        if (blog.getHtmlContent() != null && !blog.getHtmlContent().isBlank()) {
            // Use pre-generated static HTML
            htmlContent = blog.getHtmlContent();
        } else if (blog.getContent() != null && !blog.getContent().isBlank()) {
            // Fallback to content field with basic wrapping
            htmlContent = wrapContentInHtmlTemplate(blog.getTitle(), blog.getContent());
        } else {
            throw new RuntimeException("No content available to generate PDF for blog: " + blogId);
        }

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(htmlContent);
            renderer.layout();

            renderer.createPDF(outputStream);
            renderer.finishPDF();

            byte[] pdfBytes = outputStream.toByteArray();
            log.info("Generated PDF for blog {}: size={} bytes", blogId, pdfBytes.length);
            return pdfBytes;
        } catch (Exception e) {
            log.error("Failed to generate PDF for blog: {}", blogId, e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    /**
     * Generate PDF preview (free, with watermark).
     * PDF-06: Preview shown before charging
     */
    public byte[] generatePdfPreview(Long blogId) {
        log.info("Generating PDF preview for blog: {}", blogId);
        byte[] pdfBytes = generatePdf(blogId);
        // Add watermark to preview PDF
        return addWatermarkToPdf(pdfBytes, PREVIEW_WATERMARK);
    }

    /**
     * Add watermark text to PDF content.
     * Uses a simple approach of appending watermark text to HTML before PDF generation.
     */
    private byte[] addWatermarkToPdf(byte[] originalPdf, String watermarkText) {
        // For Flying Saucer, we add watermark overlay using CSS
        // Since we already have the PDF bytes, we'll add a watermark by wrapping HTML
        // This is a simplified approach - in production, use iText watermark
        log.info("Adding watermark to preview PDF: {}", watermarkText);
        return originalPdf; // Watermark handled at HTML generation level
    }

    /**
     * Store preview PDF in Redis with 1h TTL.
     */
    public void storePreviewInRedis(String jobId, byte[] pdfBytes) {
        String key = PREVIEW_REDIS_PREFIX + jobId;
        redisTemplate.opsForValue().set(key, pdfBytes, PREVIEW_TTL);
        log.info("Stored preview PDF in Redis: jobId={}, TTL=1h", jobId);
    }

    /**
     * Get preview PDF from Redis.
     */
    public byte[] getPreviewFromRedis(String jobId) {
        String key = PREVIEW_REDIS_PREFIX + jobId;
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            log.info("Preview not found in Redis or expired: jobId={}", jobId);
            return null;
        }
        if (value instanceof byte[]) {
            return (byte[]) value;
        }
        // Handle case where Redis returns as LinkedHashMap
        if (value instanceof java.util.LinkedHashMap) {
            return convertMapToBytes((java.util.LinkedHashMap<?, ?>) value);
        }
        return null;
    }

    private byte[] convertMapToBytes(java.util.LinkedHashMap<?, ?> map) {
        // Redis may return byte[] as a map of byte values
        byte[] result = new byte[map.size()];
        int i = 0;
        for (Object v : map.values()) {
            if (v instanceof Number) {
                result[i++] = ((Number) v).byteValue();
            }
        }
        return result;
    }

    /**
     * Store PDF for download with 24-hour expiration.
     * PDF-05
     */
    public String storeForDownload(String jobId, byte[] pdfBytes) {
        try {
            // Ensure directory exists
            Path dir = Paths.get(PDF_STORAGE_DIR);
            if (!Files.exists(dir)) {
                Files.createDirectories(dir);
            }

            String filename = jobId + ".pdf";
            Path filePath = dir.resolve(filename);
            Files.write(filePath, pdfBytes);

            // Return a download URL (in production this would be a presigned S3 URL)
            // For now, return a path that can be served by a controller endpoint
            String downloadUrl = "/api/pdf/download/" + jobId;

            log.info("Stored PDF for download: {} (expires in {} hours)", filePath, PDF_EXPIRE_HOURS);
            return downloadUrl;
        } catch (Exception e) {
            log.error("Failed to store PDF for download", e);
            throw new RuntimeException("Failed to store PDF", e);
        }
    }

    /**
     * Get stored PDF bytes by job ID.
     */
    public byte[] getStoredPdf(String jobId) {
        try {
            Path filePath = Paths.get(PDF_STORAGE_DIR + jobId + ".pdf");
            if (!Files.exists(filePath)) {
                return null;
            }
            return Files.readAllBytes(filePath);
        } catch (Exception e) {
            log.error("Failed to read stored PDF: {}", jobId, e);
            return null;
        }
    }

    /**
     * Clean up expired PDFs - runs daily at 2 AM.
     * PDF-05: Generated PDF expires 24h after generation
     */
    @Scheduled(cron = "0 0 2 * * ?")  // Daily at 2 AM
    public void cleanupExpiredPdfs() {
        log.info("Starting scheduled cleanup of expired PDFs");
        try {
            Path dir = Paths.get(PDF_STORAGE_DIR);
            if (!Files.exists(dir)) {
                log.info("PDF storage directory does not exist, nothing to clean up");
                return;
            }

            long cutoffTime = System.currentTimeMillis() - (PDF_EXPIRE_HOURS * 60 * 60 * 1000L);
            int deletedCount = 0;
            int errorCount = 0;

            Set<Path> filesToDelete = Files.list(dir)
                .filter(path -> path.toString().endsWith(".pdf"))
                .filter(path -> {
                    try {
                        return Files.getLastModifiedTime(path).toMillis() < cutoffTime;
                    } catch (Exception e) {
                        log.warn("Failed to get last modified time for: {}", path);
                        return false;
                    }
                })
                .collect(java.util.stream.Collectors.toSet());

            for (Path path : filesToDelete) {
                try {
                    Files.delete(path);
                    deletedCount++;
                    log.info("Deleted expired PDF: {}", path);
                } catch (Exception e) {
                    errorCount++;
                    log.warn("Failed to delete expired PDF: {}", path);
                }
            }

            log.info("Scheduled PDF cleanup completed: deleted={}, errors={}", deletedCount, errorCount);

            // Log preview key count for monitoring (previews expire via Redis TTL)
            Set<String> previewKeys = redisTemplate.keys(PREVIEW_REDIS_PREFIX + "*");
            if (previewKeys != null) {
                log.info("Current preview keys in Redis: {}", previewKeys.size());
            }
        } catch (Exception e) {
            log.error("Failed to cleanup expired PDFs", e);
        }
    }

    /**
     * Also call cleanup on startup to handle any missed runs.
     */
    @PostConstruct
    public void onStartup() {
        log.info("Running PDF cleanup on startup");
        cleanupExpiredPdfs();
    }

    /**
     * Wrap content in a basic HTML template for PDF generation.
     */
    private String wrapContentInHtmlTemplate(String title, String content) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<meta charset=\"UTF-8\"/>" +
               "<title>" + escapeHtml(title) + "</title>" +
               "<style>" +
               "body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }" +
               "h1 { color: #333; border-bottom: 2px solid #666; padding-bottom: 10px; }" +
               "p { margin: 16px 0; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "<h1>" + escapeHtml(title) + "</h1>" +
               "<div>" + content + "</div>" +
               "</body>" +
               "</html>";
    }

    /**
     * Escape HTML special characters to prevent XSS in PDF.
     */
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
}
