package com.onepage.service;

import com.onepage.model.Blog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfGenerationService {

    private final BlogService blogService;

    private static final String PDF_STORAGE_DIR = "/tmp/pdfs/";
    private static final int PDF_EXPIRE_HOURS = 24;

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
     * Generate PDF preview (free, lower quality acceptable).
     * PDF-06: Preview shown before charging
     */
    public byte[] generatePdfPreview(Long blogId) {
        log.info("Generating PDF preview for blog: {}", blogId);
        // For preview, we use the same method but could add watermarks later
        return generatePdf(blogId);
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
     * Clean up expired PDFs (called periodically or on startup).
     */
    public void cleanupExpiredPdfs() {
        try {
            Path dir = Paths.get(PDF_STORAGE_DIR);
            if (!Files.exists(dir)) {
                return;
            }

            long cutoffTime = System.currentTimeMillis() - (PDF_EXPIRE_HOURS * 60 * 60 * 1000L);
            Files.list(dir)
                .filter(path -> path.toString().endsWith(".pdf"))
                .filter(path -> {
                    try {
                        return Files.getLastModifiedTime(path).toMillis() < cutoffTime;
                    } catch (Exception e) {
                        return false;
                    }
                })
                .forEach(path -> {
                    try {
                        Files.delete(path);
                        log.info("Deleted expired PDF: {}", path);
                    } catch (Exception e) {
                        log.warn("Failed to delete expired PDF: {}", path);
                    }
                });
        } catch (Exception e) {
            log.error("Failed to cleanup expired PDFs", e);
        }
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
