package com.onepage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class BlogDTO {

    private Long id;

    private Long userId;

    @NotBlank(message = "Title cannot be empty")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @Size(max = 50000, message = "Content exceeds maximum length")
    private String content;

    @Size(max = 500, message = "Cover image URL is too long")
    @Pattern(regexp = "^(http[s]?://.*|/.*)?$", message = "Invalid cover image URL format")
    private String coverImage;

    @Size(max = 100, message = "Template ID is too long")
    @Pattern(regexp = "^[A-Za-z0-9_-]*$", message = "Invalid template ID format")
    private String templateId;

    private String shareCode;
}
