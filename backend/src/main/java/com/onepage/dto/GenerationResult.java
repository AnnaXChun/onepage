package com.onepage.dto;

import lombok.Data;
import lombok.Builder;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class GenerationResult {
    private List<BlockData> blocks;
    private float overallConfidence;

    @Data
    @Builder
    public static class BlockData {
        private String type;
        private String content;
        private int position;
        private Map<String, Object> style;
        private float confidence;
    }
}