package com.onepage.dto;

import lombok.Data;
import java.util.Map;

@Data
public class BlockConfigDTO {
    private String blockId;
    private String align;           // "left", "center", "right"
    private String backgroundColor; // hex color e.g., "#ffffff"
    private String textColor;       // hex color e.g., "#000000"
    private Boolean visible;         // true = show, false = hide
    private Map<String, Object> additionalSettings; // any extra config
}
