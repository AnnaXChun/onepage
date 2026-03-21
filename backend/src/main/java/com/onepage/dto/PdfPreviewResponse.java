package com.onepage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PdfPreviewResponse {
    private String jobId;
    private String previewUrl;        // Expiring preview URL
    private String downloadUrl;       // null for preview, set for export
    private String message;
    private LocalDateTime expiresAt;  // When link expires
}
