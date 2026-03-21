package com.onepage.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.ChatModel;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIWriteService {

    private final ChatModel chatModel;

    public String write(String blockId, String existingText, String mode) {
        // WRT-05: Independent context per block (blockId)
        String prompt = buildPrompt(existingText, mode);
        return chatModel.call(prompt);
    }

    private String buildPrompt(String existingText, String mode) {
        if ("replace".equals(mode)) {
            return String.format(
                "Improve the following text. Keep the same meaning but make it more compelling:\n\n%s",
                existingText
            );
        } else {
            return String.format(
                "Continue the following text naturally:\n\n%s",
                existingText
            );
        }
    }
}
