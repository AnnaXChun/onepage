package com.onepage.dto;

import lombok.Data;

@Data
public class BlogDTO {
    private Long id;
    private Long userId;
    private String title;
    private String content;
    private String coverImage;
    private String templateId;
    private String shareCode;
}
