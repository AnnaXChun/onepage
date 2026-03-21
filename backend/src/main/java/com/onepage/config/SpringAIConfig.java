package com.onepage.config;

import org.springframework.ai.openai.OpenAiApi;
import org.springframework.ai.openai.chat.ChatModel;
import org.springframework.ai.openai.chat.OpenAiChatModel;
import org.springframework.ai.openai.chat.OpenAiChatOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SpringAIConfig {

    @Value("${minimax.api.key}")
    private String apiKey;

    @Bean
    public OpenAiApi openAiApi() {
        return OpenAiApi.builder()
                .baseUrl("https://api.minimax.io/v1")
                .apiKey(apiKey)
                .build();
    }

    @Bean
    public ChatModel chatModel(OpenAiApi openAiApi) {
        return OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(OpenAiChatOptions.builder()
                        .model("MiniMax-M2.7")
                        .temperature(0.7)
                        .build())
                .build();
    }
}