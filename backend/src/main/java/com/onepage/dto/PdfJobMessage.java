package com.onepage.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PdfJobMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    private String jobId;       // Unique job identifier
    private Long userId;        // User requesting the PDF
    private Long blogId;        // Blog to convert to PDF
    private String shareCode;   // Share code for download URL
    private boolean isPreview;   // true if preview (free), false if final (charged)
}
