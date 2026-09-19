package com.healthcompanion.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAiGatewayConfig {
  private static HttpRequest.Builder authenticatedRequest(
      String path, String apiKey, Duration timeout) {
    return HttpRequest.newBuilder(URI.create("https://api.openai.com" + path))
        .timeout(timeout)
        .header("Authorization", "Bearer " + apiKey)
        .header("Content-Type", "application/json");
  }

  @Bean
  @ConditionalOnProperty(name = "app.ai.chat-provider", havingValue = "openai")
  LlmGateway openAiGateway(
      @Value("${app.ai.openai-api-key}") String apiKey,
      @Value("${app.ai.chat-model}") String model,
      @Value("${app.ai.temperature:0.2}") double temperature,
      @Value("${app.ai.request-timeout:120s}") Duration timeout) {
    requireApiKey(apiKey);
    var client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    var json = new ObjectMapper();
    return new LlmGateway() {
      private String body(String systemInstruction, String context, String question)
          throws Exception {
        return json.writeValueAsString(
            Map.of(
                "model",
                model,
                "temperature",
                temperature,
                "stream",
                false,
                "messages",
                List.of(
                    Map.of("role", "developer", "content", systemInstruction + "\n" + context),
                    Map.of("role", "user", "content", question))));
      }

      @Override
      public String generate(String systemInstruction, String context, String question) {
        try {
          var request =
              authenticatedRequest("/v1/chat/completions", apiKey, timeout)
                  .POST(
                      HttpRequest.BodyPublishers.ofString(
                          body(systemInstruction, context, question)))
                  .build();
          var response = client.send(request, HttpResponse.BodyHandlers.ofString());
          requireSuccess(response.statusCode(), response.body(), "OpenAI chat");
          var answer =
              json.readTree(response.body())
                  .path("choices")
                  .path(0)
                  .path("message")
                  .path("content")
                  .asText();
          if (answer.isBlank()) throw new IllegalStateException("OpenAI returned an empty answer");
          return answer;
        } catch (InterruptedException exception) {
          Thread.currentThread().interrupt();
          throw new IllegalStateException("OpenAI request was interrupted", exception);
        } catch (Exception exception) {
          throw new IllegalStateException("OpenAI request failed", exception);
        }
      }
    };
  }

  private static void requireApiKey(String apiKey) {
    if (apiKey == null || apiKey.isBlank())
      throw new IllegalStateException("OPENAI_API_KEY is required for the OpenAI profile");
  }

  private static void requireSuccess(int status, String body, String operation) {
    if (status < 200 || status >= 300)
      throw new IllegalStateException(
          operation + " failed with HTTP " + status + ": " + body.substring(0, Math.min(500, body.length())));
  }
}
