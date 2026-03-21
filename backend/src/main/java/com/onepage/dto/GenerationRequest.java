package com.onepage.dto;

import lombok.Data;

@Data
public class GenerationRequest {
    private Long blogId;
    private String imageUrl;
    private String description;
    private String[] colorPalette;
    private String dominantColor;
}