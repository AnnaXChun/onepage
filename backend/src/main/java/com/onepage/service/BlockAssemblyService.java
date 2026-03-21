package com.onepage.service;

import com.onepage.dto.GenerationResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BlockAssemblyService {

    public void assembleBlocks(GenerationResult result, Long blogId) {
        log.info("Assembling blocks for blogId: {} with {} blocks",
            blogId, result.getBlocks() != null ? result.getBlocks().size() : 0);

        // AI-07: Confidence scoring - higher for direct extractions, lower for AI inference
        if (result.getBlocks() != null) {
            for (GenerationResult.BlockData block : result.getBlocks()) {
                log.debug("Block: type={}, confidence={}", block.getType(), block.getConfidence());
            }
        }
    }
}
