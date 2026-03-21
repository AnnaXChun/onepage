package com.onepage.dto;

import lombok.Data;

@Data
public class AIWriteRequest {
    private String blockId;
    private String existingText;
    private String mode; // "replace" or "append"
}
