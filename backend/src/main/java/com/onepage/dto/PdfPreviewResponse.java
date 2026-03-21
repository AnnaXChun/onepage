package com.onepage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PdfPreviewResponse {
    private String jobId;
    private String previewUrl;
    private String message;
}
